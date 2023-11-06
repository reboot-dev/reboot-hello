import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useResembleContext } from "./ResembleClientProvider";
import { Event } from "./event";
import {
  ClearRequest,
  ClearResponse,
  CreateRequest,
  CreateResponse,
  GetAllRequest,
  GetAllResponse,
  Message,
  PostRequest,
  PostResponse,
} from "./gen/chat_pb";
import {
  Deferred,
  filterSet,
  parseStreamedValue,
  pushMaybeToLocalStorage,
  removeMaybeFromLocalStorage,
  retryForever,
  setMaybeInLocalStorage,
} from "./helpers";
import { QueryRequest, QueryResponse } from "./resemble_react";

export interface PostResponseOrError {
  response?: PostResponse;
  error?: Error;
}

export interface ClearResponseOrError {
  response?: ClearResponse;
  error?: Error;
}

export interface ChatApi {
  Create: (requestJson?: any) => Promise<CreateResponse>;
  GetAll: (requestJson?: any) => Promise<GetAllResponse>;
  StreamGetAll: (requestJson?: any) => AsyncGenerator<Message, void, unknown>;
  useStreamGetAll: (requestJson?: any) => {
    data: { messages: Message[] };
    isLoading: boolean;
    error: unknown;
  };
  useGetAll: (settings?: { storeMutationsLocallyWithKey?: string }) => {
    response: GetAllResponse | undefined;
    isLoading: boolean;
    error: unknown;
    mutations: {
      Post: (request: PostRequest) => Promise<PostResponseOrError>;
      Clear: (request: ClearRequest) => Promise<ClearResponseOrError>;
    };
    // This is the union or the sets runningPostMutations and queuedPostMutations
    pendingPostMutations: {
      request: PostRequest;
      idempotencyKey: string;
      isLoading: boolean;
      error?: unknown;
    }[];
    failedPostMutations: {
      request: PostRequest;
      idempotencyKey: string;
      isLoading: boolean;
      error?: unknown;
    }[];
    recoveredPostMutations: {
      request: PostRequest;
      idempotencyKey: string;
      run: () => void;
    }[];
  };
}

export const Chat = (id: string): ChatApi => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.append("x-resemble-service-name", "resemble_react_chat.Chat");
  headers.append("x-resemble-actor-id", id);
  headers.append("Connection", "keep-alive");

  const resembleContext = useResembleContext();

  const newRequest = (
    requestBody: any,
    path: string,
    method: "GET" | "POST",
    idempotencyKey?: string
  ) => {
    if (idempotencyKey !== undefined) {
      headers.set("x-resemble-idempotency-key", idempotencyKey);
    }
    return new Request(`${resembleContext.client?.endpoint}${path}`, {
      method: method, //TODO: figure out how to get this from proto.
      headers: headers,
      body:
        Object.keys(requestBody).length !== 0
          ? JSON.stringify(requestBody)
          : null,
    });
  };

  const Create = async (requestJson = {}) => {
    const requestBody = CreateRequest.fromJson(requestJson);
    const request = newRequest(requestBody, "/create", "POST");

    const response = await fetch(request);
    return await response.json();
  };

  const GetAll = async (requestJson = {}) => {
    const requestBody = GetAllRequest.fromJson(requestJson);
    const request = newRequest(requestBody, "/get_all", "GET");
    const response = await fetch(request);
    return await response.json();
  };

  async function* StreamGetAll(
    requestJson = {}
  ): AsyncGenerator<Message, void, unknown> {
    const requestBody = GetAllRequest.fromJson(requestJson);
    const request = newRequest(requestBody, "/stream_get_all", "GET");
    const response = await fetch(request);

    if (response.body == null) {
      throw new Error("Unable to read body of response.");
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    if (reader === undefined) {
      throw new Error("Not able to instantiate reader on response body.");
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const json_message = JSON.parse(parseStreamedValue(value));
      yield Message.fromJson(json_message);
    }
  }

  const useStreamGetAll = (jsonRequest = {}) => {
    let [isLoading, setIsLoading] = useState<boolean>(true);
    const [responses, setResponse] = useState<Message[]>([]);
    const [error, setError] = useState<unknown>();

    useEffect(() => {
      const fetchStreamGetAll = async () => {
        for await (const response of StreamGetAll()) {
          setIsLoading(false);
          setResponse((responses) => [...responses, response]);
        }
      };
      try {
        fetchStreamGetAll();
      } catch (e: unknown) {
        setError(e);
      }
    }, []);

    const data = { messages: responses }; // How do we get the 'messages' key?

    return { data, isLoading, error };
  };

  async function* ReactQuery(
    request: QueryRequest,
    signal: AbortSignal
  ): AsyncGenerator<QueryResponse, void, unknown> {
    const response = await fetch(
      newRequest(QueryRequest.toJson(request), "/query", "POST"),
      { signal: signal }
    );

    if (response.body == null) {
      throw new Error("Unable to read body of response");
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    if (reader === undefined) {
      throw new Error("Not able to instantiate reader on response body");
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      } else {
        yield QueryResponse.fromJson(JSON.parse(parseStreamedValue(value)));
      }
    }
  }

  async function _Mutation<T extends PostRequest & ClearRequest>(
    path: string,
    mutation: Mutation<T>,
    request: T,
    idempotencyKey: string,
    localStorageKey: MutableRefObject<string | undefined>,
    setUnobservedPendingPostMutations: Dispatch<SetStateAction<Mutation<T>[]>>,
    abortController: AbortController,
    shouldClearFailedPostMutations: MutableRefObject<boolean>,
    setFailedPostMutations: Dispatch<SetStateAction<Mutation<T>[]>>,
    runningPostMutations: MutableRefObject<Mutation<T>[]>,
    flushMutations: MutableRefObject<Event | undefined>,
    queuedPostMutations: MutableRefObject<[Mutation<T>, () => void][]>,
    recoveredPostMutations: MutableRefObject<[Mutation<T>, () => void][]>,
    type: { new (request: T): T }
  ): Promise<PostResponseOrError> {
    runningPostMutations.current.push(mutation);
    // Maybe add to localStorage.
    pushMaybeToLocalStorage(localStorageKey.current, mutation);

    try {
      return await retryForever(
        async () => {
          try {
            setMaybeInLocalStorage(
              localStorageKey.current,
              setUnobservedPendingPostMutations,
              (mutations) => {
                return mutations.map((mutation) => {
                  if (mutation.idempotencyKey === idempotencyKey) {
                    return { ...mutation, isLoading: true };
                  }
                  return mutation;
                });
              }
            );
            const req: T =
              request instanceof type ? request : new type(request);

            const response = await fetch(
              newRequest(req.toJson(), path, "POST", idempotencyKey),
              { signal: abortController.signal }
            );

            if (!response.ok && response.headers.has("grpc-status")) {
              const grpcStatus = response.headers.get("grpc-status");
              let grpcMessage = response.headers.get("grpc-message");
              const error = new Error(
                `'resemble_react_chat.Chat.Post' for '${id}' responded ` +
                  `with status ${grpcStatus}` +
                  `${grpcMessage !== null ? ": " + grpcMessage : ""}`
              );

              if (shouldClearFailedPostMutations.current) {
                shouldClearFailedPostMutations.current = false;
                setFailedPostMutations([
                  { request, idempotencyKey, isLoading: false, error },
                ]);
              } else {
                setFailedPostMutations((failedPostMutations) => [
                  ...failedPostMutations,
                  { request, idempotencyKey, isLoading: false, error },
                ]);
              }
              setMaybeInLocalStorage(
                localStorageKey.current,
                setUnobservedPendingPostMutations,
                (mutations) =>
                  mutations.filter(
                    (mutation) => mutation.idempotencyKey !== idempotencyKey
                  )
              );

              return { error };
            }
            if (!response.ok) {
              throw new Error("Failed to fetch");
            }
            const jsonResponse = await response.json();
            return {
              response: PostResponse.fromJson(jsonResponse),
            };
          } catch (e: unknown) {
            setMaybeInLocalStorage(
              localStorageKey.current,
              setUnobservedPendingPostMutations,
              (mutations) =>
                mutations.map((mutation) => {
                  if (mutation.idempotencyKey === idempotencyKey) {
                    return { ...mutation, error: e, isLoading: false };
                  } else {
                    return mutation;
                  }
                })
            );

            if (abortController.signal.aborted) {
              // TODO(benh): instead of returning 'undefined' as a
              // means of knowing that we've aborted provide a way
              // of "bailing" from a 'retry' by calling a function
              // passed into the lambda that 'retry' takes.
              return { error: new Error("Aborted") };
            } else {
              throw e;
            }
          }
        },
        {
          maxBackoffSeconds: 3,
        }
      );
    } finally {
      runningPostMutations.current = runningPostMutations.current.filter(
        (mutation) => mutation.idempotencyKey !== idempotencyKey
      );
      // Maybe remove from localStorage.
      removeMaybeFromLocalStorage(
        localStorageKey.current,
        (mutation: Mutation<T>) => mutation.idempotencyKey !== idempotencyKey
      );

      // NOTE: we deliberately DO NOT remove from
      // 'unobservedPendingPostMutations' but instead wait
      // for a response first so that we don't cause a render
      // before getting the updated state from the server.

      if (
        flushMutations.current !== undefined &&
        runningPostMutations.current.length === 0
      ) {
        flushMutations.current.set();
      } else {
        for (const [mutation, run] of queuedPostMutations.current) {
          queuedPostMutations.current.shift();
          run();
          break; // Only want to run one mutation at a time for now!
        }
      }
    }
  }

  interface Mutation<T> {
    request: T;
    idempotencyKey: string;
    isLoading: boolean;
    error?: unknown; // TODO(benh): coerce to a string? JSON.stringify?
  }

  const useGetAll = (settings?: { storeMutationsLocallyWithKey?: string }) => {
    const [response, setResponse] = useState<GetAllResponse>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<unknown>();
    // if (settings?.storeMutationsLocallyWithKey !== undefined) {
    //   localStorage.removeItem(settings?.storeMutationsLocallyWithKey);

    // NOTE: using "refs" here because we want to "remember" some
    // state, but don't want setting that state to trigger new renders (see
    // https://react.dev/learn/referencing-values-with-refs).
    // Using a ref here so that we don't render every time we set it.

    const observedIdempotencyKeys = useRef(new Set<string>());

    // NOTE: rather than starting with undefined for 'flushMutations'
    // we start with an event so any mutations that may get created
    // before we've started reading will get queued.
    const flushMutations = useRef<Event | undefined>(new Event());

    const abortController = useRef<AbortController>();

    const runningPostMutations = useRef<Mutation<PostRequest>[]>([]);
    const runningClearMutations = useRef<Mutation<ClearRequest>[]>([]);

    const recoveredPostMutations = useRef<
      [Mutation<PostRequest>, () => void][]
    >([]);
    const recoveredClearMutations = useRef<
      [Mutation<ClearRequest>, () => void][]
    >([]);
    // Helper function to get 'abortController' since it is immutable
    // and this way we don't need to do 'new AbortController()' on
    // every render.
    function getAbortController() {
      if (abortController.current === undefined) {
        abortController.current = new AbortController();
      }

      return abortController.current;
    }

    useEffect(() => {
      const abortController = getAbortController();
      return () => {
        abortController.abort();
      };
    }, []);

    // NOTE: using a ref for 'settings' so that it doesn't get changed
    // after the first time calling 'useGetAll'.
    const settingsRef = useRef(settings);

    const shouldClearFailedPostMutations = useRef(false);
    const shouldClearFailedClearMutations = useRef(false);
    // We are using string comparison here since we can't do value
    // equality of anonymous objects.
    if (JSON.stringify(settingsRef.current) !== JSON.stringify(settings)) {
      throw new Error("Changing settings is not supported!");
    }

    const localStorageKeyRef = useRef(settings?.storeMutationsLocallyWithKey);
    const [failedPostMutations, setFailedPostMutations] = useState<
      Mutation<PostRequest>[]
    >([]);
    const [failedClearMutations, setFailedClearMutations] = useState<
      Mutation<ClearRequest>[]
    >([]);

    const doThisOneTime = useRef(true);
    const queuedPostMutations = useRef<[Mutation<PostRequest>, () => void][]>(
      []
    );
    const queuedClearMutations = useRef<[Mutation<ClearRequest>, () => void][]>(
      []
    );
    const getRecoveredPostMutations = (): [
      Mutation<PostRequest>,
      () => void
    ][] => {
      // This needs to clear localStorage also.
      if (localStorageKeyRef.current !== undefined) {
        const value = localStorage.getItem(localStorageKeyRef.current);
        if (value !== null) {
          const mutations: Mutation<PostRequest>[] = JSON.parse(value);
          const initialQueuedPostMutations: [
            Mutation<PostRequest>,
            () => void
          ][] = [];
          for (const mutation of mutations) {
            initialQueuedPostMutations.push([mutation, () => __Post(mutation)]);
          }
          return initialQueuedPostMutations;
        }
        return [];
      } else {
        return [];
      }
    };

    const getRecoveredClearMutations = (): [
      Mutation<ClearRequest>,
      () => void
    ][] => {
      // This needs to clear localStorage also.
      if (localStorageKeyRef.current !== undefined) {
        const value = localStorage.getItem(localStorageKeyRef.current);
        if (value !== null) {
          const mutations: Mutation<ClearRequest>[] = JSON.parse(value);
          const initialQueuedClearMutations: [
            Mutation<ClearRequest>,
            () => void
          ][] = [];
          for (const mutation of mutations) {
            initialQueuedClearMutations.push([
              mutation,
              () => __Clear(mutation),
            ]);
          }
          return initialQueuedClearMutations;
        }
        return [];
      } else {
        return [];
      }
    };

    if (doThisOneTime.current) {
      doThisOneTime.current = false;
      recoveredPostMutations.current = getRecoveredPostMutations();
      recoveredClearMutations.current = getRecoveredClearMutations();
    }

    // Anytime we're removing items from runningPostMutations, remove from
    // localStorage.

    // Anytime we add to queuedPostMutations OR directly add to
    // runningPostMutations, add to localStorage.

    // User facing state that only includes the pending mutations that
    // have not been observed.
    //
    // Initially this is set to 'queuedPostMutations' in case there
    // were any mutations that we had in 'localStorage'.
    const [unobservedPendingPostMutations, setUnobservedPendingPostMutations] =
      useState<Mutation<PostRequest>[]>(
        queuedPostMutations.current.map(([mutation]) => mutation)
      );
    const [
      unobservedPendingClearMutations,
      setUnobservedPendingClearMutations,
    ] = useState<Mutation<ClearRequest>[]>(
      queuedClearMutations.current.map(([mutation]) => mutation)
    );

    useEffect(() => {
      shouldClearFailedPostMutations.current = true;
    }, [failedPostMutations]);

    useEffect(() => {
      shouldClearFailedClearMutations.current = true;
    }, [failedClearMutations]);

    async function __Post(mutation: Mutation<PostRequest>) {
      return _Mutation<PostRequest>(
        "/post",
        mutation,
        mutation.request,
        mutation.idempotencyKey,
        localStorageKeyRef,
        setUnobservedPendingPostMutations,
        getAbortController(),
        shouldClearFailedPostMutations,
        setFailedPostMutations,
        runningPostMutations,
        flushMutations,
        queuedPostMutations,
        recoveredPostMutations,
        PostRequest
      );
    }

    async function __Clear(mutation: Mutation<ClearRequest>) {
      return _Mutation<ClearRequest>(
        "/clear",
        mutation,
        mutation.request,
        mutation.idempotencyKey,
        localStorageKeyRef,
        setUnobservedPendingClearMutations,
        getAbortController(),
        shouldClearFailedClearMutations,
        setFailedClearMutations,
        runningClearMutations,
        flushMutations,
        queuedClearMutations,
        recoveredClearMutations,
        ClearRequest
      );
    }

    async function _Post(mutation: Mutation<PostRequest>) {
      setMaybeInLocalStorage(
        localStorageKeyRef.current,
        setUnobservedPendingPostMutations,
        (mutations) => [...mutations, mutation]
      );

      // NOTE: we only run one mutation at a time so that we provide a
      // serializable experience for the end user but we will
      // eventually support mutations in parallel when we have strong
      // eventually consistent writers.
      if (
        runningPostMutations.current.length > 0 ||
        flushMutations.current !== undefined
      ) {
        const deferred = new Deferred<PostResponseOrError>(() =>
          __Post(mutation)
        );

        // Add to localStorage here.
        queuedPostMutations.current.push([mutation, () => deferred.start()]);
        // Maybe add to localStorage.
        pushMaybeToLocalStorage(localStorageKeyRef.current, mutation);

        return deferred.promise;
      } else {
        return await __Post(mutation);
      }
    }

    async function _Clear(mutation: Mutation<ClearRequest>) {
      setMaybeInLocalStorage(
        localStorageKeyRef.current,
        setUnobservedPendingClearMutations,
        (mutations) => [...mutations, mutation]
      );

      // NOTE: we only run one mutation at a time so that we provide a
      // serializable experience for the end user but we will
      // eventually support mutations in parallel when we have strong
      // eventually consistent writers.
      if (
        runningClearMutations.current.length > 0 ||
        flushMutations.current !== undefined
      ) {
        const deferred = new Deferred<ClearResponseOrError>(() =>
          __Clear(mutation)
        );

        // Add to localStorage here.
        queuedClearMutations.current.push([mutation, () => deferred.start()]);
        // Maybe add to localStorage.
        pushMaybeToLocalStorage(localStorageKeyRef.current, mutation);

        return deferred.promise;
      } else {
        return await __Clear(mutation);
      }
    }

    async function Post(request: PostRequest): Promise<PostResponseOrError> {
      const idempotencyKey = uuidv4();

      const mutation = {
        request: request,
        idempotencyKey: idempotencyKey,
        isLoading: false, // Won't start loading if we're flushing mutations.
      };

      return _Post(mutation);
    }

    async function Clear(request: ClearRequest): Promise<ClearResponseOrError> {
      const idempotencyKey = uuidv4();

      const mutation = {
        request: request,
        idempotencyKey: idempotencyKey,
        isLoading: false, // Won't start loading if we're flushing mutations.
      };

      return _Clear(mutation);
    }

    useEffect(() => {
      const loop = async () => {
        await retryForever(async () => {
          try {
            // Wait for any mutations to complete before starting to
            // read so that we read the latest state including those
            // mutations.
            if (
              runningPostMutations.current.length > 0 ||
              runningClearMutations.current.length > 0
            ) {
              // TODO(benh): check invariant
              // 'flushMutations.current !== undefined' but don't
              // throw an error since that will just retry, instead
              // add support for "bailing" from a 'retry' by calling a
              // function passed into the lambda that 'retry' takes.
              await flushMutations.current?.wait();
            }

            const responses = ReactQuery(
              QueryRequest.create({
                method: "GetAll",
                // request: GetAllRequest.encode(request).finish(),
              }),
              getAbortController().signal
            );

            for await (const response of responses) {
              setIsLoading(false);

              for (const idempotencyKey of response.idempotencyKeys) {
                observedIdempotencyKeys.current.add(idempotencyKey);
              }

              // Only keep around the idempotency keys that are
              // still pending as the rest are not useful for us.
              observedIdempotencyKeys.current = filterSet(
                observedIdempotencyKeys.current,
                (observedIdempotencyKey) =>
                  [
                    ...runningPostMutations.current,
                    ...runningClearMutations.current,
                  ].some(
                    (mutation) =>
                      observedIdempotencyKey === mutation.idempotencyKey
                  )
              );

              if (flushMutations.current !== undefined) {
                // TODO(benh): check invariant
                // 'pendingPostMutations.current.length === 0' but don't
                // throw an error since that will just retry, instead
                // add support for "bailing" from a 'retry' by calling a
                // function passed into the lambda that 'retry' takes.

                flushMutations.current = undefined;

                for (const [mutation, run] of queuedPostMutations.current) {
                  queuedPostMutations.current.shift();
                  run();
                  break; // TODO(riley): figure out if we still only want one?
                }
                for (const [mutation, run] of queuedClearMutations.current) {
                  queuedClearMutations.current.shift();
                  run();
                  break; // TODO(riley): figure out if we still only want one?
                }
              }

              setMaybeInLocalStorage(
                localStorageKeyRef.current,
                setUnobservedPendingPostMutations,
                (mutations) =>
                  mutations
                    .filter(
                      (mutation) =>
                        // Only keep mutations that are queued, pending or
                        // recovered.
                        queuedPostMutations.current.some(
                          ([queuedPostMutation]) =>
                            mutation.idempotencyKey ===
                            queuedPostMutation.idempotencyKey
                        ) ||
                        runningPostMutations.current.some(
                          (runningPostMutations) =>
                            mutation.idempotencyKey ===
                            runningPostMutations.idempotencyKey
                        ) ||
                        queuedClearMutations.current.some(
                          ([queuedClearMutation]) =>
                            mutation.idempotencyKey ===
                            queuedClearMutation.idempotencyKey
                        ) ||
                        runningClearMutations.current.some(
                          (runningClearMutations) =>
                            mutation.idempotencyKey ===
                            runningClearMutations.idempotencyKey
                        )
                    )
                    .filter(
                      (mutation) =>
                        // Only keep mutations whose effects haven't been observed.
                        !observedIdempotencyKeys.current.has(
                          mutation.idempotencyKey
                        )
                    )
              );

              setResponse(GetAllResponse.fromBinary(response.response));
            }
          } catch (e: unknown) {
            if (getAbortController().signal.aborted) {
              return;
            }

            setError(e);
            setIsLoading(true);

            // TODO(benh): check invariant
            // 'flushMutations.current === undefined' but don't
            // throw an error since that will just retry, instead
            // add support for "bailing" from a 'retry' by calling a
            // function passed into the lambda that 'retry' takes.
            flushMutations.current = new Event();

            throw e;
          }
        });
      };

      loop();
    }, []);

    return {
      response,
      isLoading,
      error,
      mutations: { Post, Clear },
      pendingPostMutations: unobservedPendingPostMutations,
      failedPostMutations,
      recoveredPostMutations: recoveredPostMutations.current.map(
        ([mutation, run]) => ({ ...mutation, run: run })
      ),
      pendingClearMutations: unobservedPendingClearMutations,
      failedClearMutations,
      recoveredClearMutations: recoveredClearMutations.current.map(
        ([mutation, run]) => ({ ...mutation, run: run })
      ),
    };
  };

  return {
    GetAll,
    StreamGetAll,
    Create,
    useStreamGetAll,
    useGetAll,
  };
};
