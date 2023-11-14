import type {
  PartialMessage as __bufbuildProtobufPartialMessage,
} from "@bufbuild/protobuf";
import {
  Deferred as __resembleReactDeferred,
  Event as __resembleReactEvent,
  IQueryRequest as __resembleIQueryRequest,
  IQueryResponse as __resembleIQueryResponse,
  Mutation as __resembleMutation,
  QueryRequest as __resembleQueryRequest,
  QueryResponse  as __resembleQueryResponse,
  ResponseOrError as __resembleResponseOrError,
  filterSet as __resembleFilterSet,
  popMutationMaybeFromLocalStorage as __resemblePopMutationMaybeFromLocalStorage,
  pushMutationMaybeToLocalStorage as __resemblePushMutationMaybeToLocalStorage,
  retryForever as __resembleRetryForever,
  useResembleContext as __resembleUseResembleContext
} from "@reboot-dev/resemble-react";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ChatRoomState,
	Message,
	CreateRequest,
	CreateResponse,
	GetAllRequest,
	GetAllResponse,
} from "./chat_pb";

// Check if safari. Print warning, if yes.
// TODO(riley): fix chaos streaming for Safari.

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (isSafari) {
  const html = document.documentElement;
  const warningEl = document.createElement('div');
  warningEl.style.cssText =
  `position:absolute;top:0;left:0;width:200px;border:1px solid black;margin:4px;
  padding:4px;font-family:sans-serif;border-radius:4px`;

  const warningText = `Some features of this application may not work as
  intended on Safari. A fix is coming soon! Consider using Firefox or Chrome in
  the meantime.`

  warningEl.innerText = warningText
  html.appendChild(warningEl)
  console.log(warningText)
}


// Start of service specific code.
///////////////////////////////////////////////////////////////////////////

export interface ChatApi {
  GetAll: (partialRequest?: __bufbuildProtobufPartialMessage<GetAllRequest>) =>
  Promise<GetAllResponse>;
  Create: (partialRequest?: __bufbuildProtobufPartialMessage<CreateRequest>) =>
  Promise<CreateResponse>;
  useGetAll: (partialRequest?: __bufbuildProtobufPartialMessage<GetAllRequest>) => {
   response: GetAllResponse | undefined;
    isLoading: boolean;
    error: unknown;
    mutations: {
       Create: (request: __bufbuildProtobufPartialMessage<CreateRequest>,
       optimistic_metadata?: any ) =>
      Promise<__resembleResponseOrError<CreateResponse>>;
    };
      pendingCreateMutations: {
        request: CreateRequest;
        idempotencyKey: string;
        isLoading: boolean;
        error?: unknown;
        optimistic_metadata?: any;
      }[];
      failedCreateMutations: {
        request: CreateRequest;
        idempotencyKey: string;
        isLoading: boolean;
        error?: unknown;
      }[];
      recoveredCreateMutations: {
        request: CreateRequest;
        idempotencyKey: string;
        run: () => void;
      }[];
  };
}


export interface SettingsParams {
  id: string;
  storeMutationsLocallyInNamespace?: string;
}
export const Chat = ({ id, storeMutationsLocallyInNamespace}: SettingsParams): ChatApi => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.append("x-resemble-service-name", "chat.v1.Chat");
  headers.append("x-resemble-actor-id", id);
  headers.append("Connection", "keep-alive");

  const resembleContext = __resembleUseResembleContext();

  const newRequest = (
    requestBody: any,
    path: string,
    method: "GET" | "POST",
    idempotencyKey?: string,
  ) => {
    if (idempotencyKey !== undefined) {
      headers.set("x-resemble-idempotency-key", idempotencyKey);
    }
    return new Request(`${resembleContext.client?.endpoint}${path}`, {
      method: method,
      headers: headers,
      body:
        Object.keys(requestBody).length !== 0
          ? JSON.stringify(requestBody)
          : null,
    });
  };

  const GetAll = async (partialRequest: __bufbuildProtobufPartialMessage<GetAllRequest> = {}) => {
    const request = partialRequest instanceof GetAllRequest ? partialRequest : new GetAllRequest(partialRequest);
    const requestBody = request.toJson();
    // Invariant here is that we use the '/package.service.method' path and
    // HTTP 'POST' method (we need 'POST' because we send an HTTP body).
    //
    // See also 'resemble/helpers.py'.
    const response = await fetch(
      newRequest(requestBody, "/chat.v1.Chat.GetAll", "POST"));

    if (!response.ok && response.headers.has("grpc-status")) {
      const grpcStatus = response.headers.get("grpc-status");
      let grpcMessage = response.headers.get("grpc-message");
      throw new Error(
        `'chat.v1.Chat.GetAll' for '${id}' responded ` +
          `with status ${grpcStatus}` +
          `${grpcMessage !== null ? ": " + grpcMessage : ""}`
      );
    } else if (!response.ok) {
      throw new Error(
        `'chat.v1.Chat.GetAll' failed: ${response.body}`
      );
    }

    return await response.json();
  };

  const useGetAll = (partialRequest: __bufbuildProtobufPartialMessage<GetAllRequest> = {}) => {
    const [response, setResponse] = useState<GetAllResponse>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<unknown>();

    // NOTE: using "refs" here because we want to "remember" some
    // state, but don't want setting that state to trigger new renders (see
    // https://react.dev/learn/referencing-values-with-refs).
    // Using a ref here so that we don't render every time we set it.

    const observedIdempotencyKeys = useRef(new Set<string>());
    // NOTE: rather than starting with undefined for 'flushMutations'
    // we start with an event so any mutations that may get created
    // before we've started reading will get queued.
    const flushMutations = useRef<__resembleReactEvent | undefined>(new __resembleReactEvent());

    const [abortController, setAbortController] = useState<AbortController | undefined>();

    useEffect(() => {
      setAbortController(new AbortController())
      return () => {
        abortController?.abort();
      };
    }, []);

    const request = partialRequest instanceof GetAllRequest
        ? partialRequest
        : new GetAllRequest(partialRequest)

    // NOTE: using a ref for the 'request' and 'settings' (below) so
    // that it doesn't get changed after the first time calling 'usePing'.
    const requestRef = useRef(request);

    // We are using serialized string comparison here since we can't do value
    // equality of anonymous objects. We must use the proto library's toBinary()
    // since JavaScript's standard JSON library can't serialize every possible
    // field type (notably BigInt).
    const first_request_serialized = requestRef.current.toBinary().toString();
    const current_request_serialized = request.toBinary().toString();
    if (current_request_serialized !== first_request_serialized) {
      throw new Error("Changing the request is not supported!");
    }

    const settingsRef = useRef({id, storeMutationsLocallyInNamespace});
    // We are using string comparison here since we can't do value
    // equality of anonymous objects.
    if (JSON.stringify(settingsRef.current) !== JSON.stringify({id, storeMutationsLocallyInNamespace})) {
      throw new Error("Changing settings is not supported!");
    }

    const localStorageKeyRef = useRef(storeMutationsLocallyInNamespace);

    const queuedMutations = useRef<Array<() => void>>([]);

function hasRunningMutations(): boolean {
      if (
      runningCreateMutations.current.length > 0) {
        return true;
      }
      return false;
    }


    const runningCreateMutations = useRef<__resembleMutation<CreateRequest>[]>([]);
    const recoveredCreateMutations = useRef<
      [__resembleMutation<CreateRequest>, () => void][]
    >([]);
    const shouldClearFailedCreateMutations = useRef(false);
    const [failedCreateMutations, setFailedCreateMutations] = useState<
      __resembleMutation<CreateRequest>[]
    >([]);
    const queuedCreateMutations = useRef<[__resembleMutation<CreateRequest>, () => void][]>(
      []
    );
    const recoverAndPurgeCreateMutations = (): [
      __resembleMutation<CreateRequest>,
      () => void
    ][] => {
      if (localStorageKeyRef.current === undefined) {
        return [];
      }
      const suffix = Create
      const value = localStorage.getItem(localStorageKeyRef.current + suffix);
      if (value === null) {
        return [];
      }

      localStorage.removeItem(localStorageKeyRef.current);
      const mutations: __resembleMutation<CreateRequest>[] = JSON.parse(value);
      const recoveredCreateMutations: [
        __resembleMutation<CreateRequest>,
        () => void
      ][] = [];
      for (const mutation of mutations) {
        recoveredCreateMutations.push([mutation, () => __Create(mutation)]);
      }
      return recoveredCreateMutations;
    }
    const doOnceCreate = useRef(true)
    if (doOnceCreate.current) {
      doOnceCreate.current = false
      recoveredCreateMutations.current = recoverAndPurgeCreateMutations()
    }

    // User facing state that only includes the pending mutations that
    // have not been observed.
    const [unobservedPendingCreateMutations, setUnobservedPendingCreateMutations] =
      useState<__resembleMutation<CreateRequest>[]>([]);

    useEffect(() => {
      shouldClearFailedCreateMutations.current = true;
    }, [failedCreateMutations]);

    async function __Create(
      mutation: __resembleMutation<CreateRequest>
    ): Promise<__resembleResponseOrError<CreateResponse>> {
      try {
        // Invariant that we won't yield to event loop before pushing to
        // runningCreateMutations
        runningCreateMutations.current.push(mutation)
        return _Mutation<CreateRequest, CreateResponse>(
          // Invariant here is that we use the '/package.service.method'.
          //
          // See also 'resemble/helpers.py'.
          "/chat.v1.Chat.Create",
          mutation,
          mutation.request,
          mutation.idempotencyKey,
          setUnobservedPendingCreateMutations,
          abortController,
          shouldClearFailedCreateMutations,
          setFailedCreateMutations,
          runningCreateMutations,
          flushMutations,
          queuedMutations,
          CreateRequest,
          CreateResponse.fromJson
        );
      } finally {
        runningCreateMutations.current = runningCreateMutations.current.filter(
          ({ idempotencyKey }) => mutation.idempotencyKey !== idempotencyKey
        );

        __resemblePopMutationMaybeFromLocalStorage(
          localStorageKeyRef.current,
          "Create",
          (mutationRequest: __resembleMutation<Request>) =>
            mutationRequest.idempotencyKey !== mutation.idempotencyKey
        );


      }
    }
    async function _Create(mutation: __resembleMutation<CreateRequest>) {
      setUnobservedPendingCreateMutations(
        (mutations) => [...mutations, mutation]
      )

      // NOTE: we only run one mutation at a time so that we provide a
      // serializable experience for the end user but we will
      // eventually support mutations in parallel when we have strong
      // eventually consistent writers.
      if (
        hasRunningMutations() ||
        queuedMutations.current.length > 0 ||
        flushMutations.current !== undefined
      ) {
        const deferred = new __resembleReactDeferred<__resembleResponseOrError<CreateResponse>>(() =>
          __Create(mutation)
        );

        // Add to localStorage here.
        queuedCreateMutations.current.push([mutation, () => deferred.start()]);
        queuedMutations.current.push(() => {
          for (const [, run] of queuedCreateMutations.current) {
            queuedCreateMutations.current.shift();
            run();
            break;
          }
        });
        // Maybe add to localStorage.
        __resemblePushMutationMaybeToLocalStorage(localStorageKeyRef.current, "Create", mutation);

        return deferred.promise;
      } else {
        // NOTE: we'll add this mutation to `runningCreateMutations` in `__Create`
        // without yielding to event loop so that we are guaranteed atomicity with checking `hasRunningMutations()`.
        return await __Create(mutation);
      }
    }

    async function Create(
      partialRequest: __bufbuildProtobufPartialMessage<CreateRequest>, optimistic_metadata?: any
    ): Promise<__resembleResponseOrError<CreateResponse>> {
      const idempotencyKey = uuidv4();
      const request = partialRequest instanceof CreateRequest ? partialRequest : new CreateRequest(partialRequest);

      const mutation = {
        request,
        idempotencyKey,
        optimistic_metadata,
        isLoading: false, // Won't start loading if we're flushing mutations.
      };

      return _Create(mutation);
    }

    useEffect(() => {
      if (abortController === undefined ) {
        return
      }
      const loop = async () => {
        await __resembleRetryForever(async () => {
          try {// Wait for any mutations to complete before starting to
            // read so that we read the latest state including those
            // mutations.
            if (runningCreateMutations.current.length > 0) {
              // TODO(benh): check invariant
              // 'flushMutations.current !== undefined' but don't
              // throw an error since that will just retry, instead
              // add support for "bailing" from a 'retry' by calling a
              // function passed into the lambda that 'retry' takes.
              await flushMutations.current?.wait();
            }


            const responses = ReactQuery(
              __resembleQueryRequest.create({
                method: "GetAll",
                request: requestRef.current.toBinary(),
              }),
              abortController?.signal
            );

            for await (const response of responses) {
              setIsLoading(false);

              for (const idempotencyKey of response.idempotencyKeys) {
                observedIdempotencyKeys.current.add(idempotencyKey);
              }

              // Only keep around the idempotency keys that are
              // still pending as the rest are not useful for us.
              observedIdempotencyKeys.current = __resembleFilterSet(
                observedIdempotencyKeys.current,
                (observedIdempotencyKey) =>
                  [
                  ...runningCreateMutations.current,
                  ].some(
                    (mutation) =>
                      observedIdempotencyKey === mutation.idempotencyKey
                  )
              );

              if (flushMutations.current !== undefined) {
                // TODO(benh): check invariant
                // 'pendingMutations.current.length === 0' but don't
                // throw an error since that will just retry, instead
                // add support for "bailing" from a 'retry' by calling a
                // function passed into the lambda that 'retry' takes.

                flushMutations.current = undefined;

                // Dequeue 1 queue and run 1 mutation from it.
                for (const run of queuedMutations.current) {
                  queuedMutations.current.shift();
                  run();
                  break;
                }
              }

              setUnobservedPendingCreateMutations(
              (mutations) =>
                mutations
                  .filter(
                    (mutation) =>
                      // Only keep mutations that are queued, pending or
                      // recovered.
                      queuedCreateMutations.current.some(
                        ([queuedCreateMutation]) =>
                          mutation.idempotencyKey ===
                          queuedCreateMutation.idempotencyKey
                      ) ||
                      runningCreateMutations.current.some(
                        (runningCreateMutations) =>
                          mutation.idempotencyKey ===
                          runningCreateMutations.idempotencyKey
                      )
                  )
                  .filter(
                    (mutation) =>
                      // Only keep mutations whose effects haven't been observed.
                      !observedIdempotencyKeys.current.has(
                        mutation.idempotencyKey
                      )
                  )
              )


              setResponse(GetAllResponse.fromBinary(response.response));
            }
          } catch (e: unknown) {
            if (abortController?.signal.aborted) {
              return;
            }

            setError(e);
            setIsLoading(true);

            // Run a mutation in the event that we are trying to read
            // from an unconstructed actor and the mutation will peform
            // the construction.
            //
            // TODO(benh): only do this if the reason we failed to
            // read was because the actor does not exist.
            for (const run of queuedMutations.current) {
              queuedMutations.current.shift();
              run();
              break;
            }

            // TODO(benh): check invariant
            // 'flushMutations.current === undefined' but don't
            // throw an error since that will just retry, instead
            // add support for "bailing" from a 'retry' by calling a
            // function passed into the lambda that 'retry' takes.
            flushMutations.current = new __resembleReactEvent();

            throw e;
          }
        });
      };

      loop();
    }, [abortController]);

    return {
      response,
      isLoading,
      error,
      mutations: {
        Create,
      },
      pendingCreateMutations: unobservedPendingCreateMutations,
      failedCreateMutations,
      recoveredCreateMutations: recoveredCreateMutations.current.map(
        ([mutation, run]) => ({ ...mutation, run: run })
      ),
    };
  };


  const Create = async (partialRequest: __bufbuildProtobufPartialMessage<CreateRequest> = {}) => {
    const request = partialRequest instanceof CreateRequest ? partialRequest : new CreateRequest(partialRequest);
    const requestBody = request.toJson();
    // Invariant here is that we use the '/package.service.method' path and
    // HTTP 'POST' method (we need 'POST' because we send an HTTP body).
    //
    // See also 'resemble/helpers.py'.
    const response = await fetch(
      newRequest(requestBody, "/chat.v1.Chat.Create", "POST"));

    return await response.json();
  };


async function _Mutation<
    Request extends
CreateRequest,
    Response extends    CreateResponse  >(
    path: string,
    mutation: __resembleMutation<Request>,
    request: Request,
    idempotencyKey: string,
    setUnobservedPendingMutations: Dispatch<
      SetStateAction<__resembleMutation<Request>[]>
    >,
    abortController: AbortController | undefined,
    shouldClearFailedMutations: MutableRefObject<boolean>,
    setFailedMutations: Dispatch<SetStateAction<__resembleMutation<Request>[]>>,
    runningMutations: MutableRefObject<__resembleMutation<Request>[]>,
    flushMutations: MutableRefObject<__resembleReactEvent | undefined>,
    queuedMutations: MutableRefObject<Array<() => void>>,
    requestType: { new (request: Request): Request },
    responseTypeFromJson: (json: any) => Response
  ): Promise<__resembleResponseOrError<Response>> {

    try {
      return await __resembleRetryForever(
        async () => {
          try {
            setUnobservedPendingMutations(
              (mutations) => {
                return mutations.map((mutation) => {
                  if (mutation.idempotencyKey === idempotencyKey) {
                    return { ...mutation, isLoading: true };
                  }
                  return mutation;
                });
              }
            );
            const req: Request =
              request instanceof requestType
                ? request
                : new requestType(request);

            const response = await fetch(
              newRequest(req.toJson(), path, "POST", idempotencyKey),
              { signal: abortController?.signal }
            );

            if (!response.ok && response.headers.has("grpc-status")) {
              const grpcStatus = response.headers.get("grpc-status");
              let grpcMessage = response.headers.get("grpc-message");
              const error = new Error(
                `'chat.v1.Chat' for '${id}' responded ` +
                  `with status ${grpcStatus}` +
                  `${grpcMessage !== null ? ": " + grpcMessage : ""}`
              );

              if (shouldClearFailedMutations.current) {
                shouldClearFailedMutations.current = false;
                setFailedMutations([
                  { request, idempotencyKey, isLoading: false, error },
                ]);
              } else {
                setFailedMutations((failedMutations) => [
                  ...failedMutations,
                  { request, idempotencyKey, isLoading: false, error },
                ]);
              }
              setUnobservedPendingMutations(
                (mutations) =>
                  mutations.filter(
                    (mutation) => mutation.idempotencyKey !== idempotencyKey
                  )
              );

              return { error } as __resembleResponseOrError<Response>;
            }
            if (!response.ok) {
              throw new Error("Failed to fetch");
            }
            const jsonResponse = await response.json();
            return {
              response: responseTypeFromJson(jsonResponse),
            };
          } catch (e: unknown) {
            setUnobservedPendingMutations(
              (mutations) =>
                mutations.map((mutation) => {
                  if (mutation.idempotencyKey === idempotencyKey) {
                    return { ...mutation, error: e, isLoading: false };
                  } else {
                    return mutation;
                  }
                })
            );

            if (abortController?.signal.aborted) {
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
      // NOTE: we deliberately DO NOT remove from
      // 'unobservedPendingMutations' but instead wait
      // for a response first so that we don't cause a render
      // before getting the updated state from the server.

      if (
        flushMutations.current !== undefined &&
        runningMutations.current.length === 0
      ) {
        flushMutations.current.set();
      } else {
        // Dequeue 1 queue and run 1 mutation from it.
        for (const run of queuedMutations.current) {
          queuedMutations.current.shift();
          run();
          break;
        }
      }
    }
  }

  async function* ReactQuery(
    request: __resembleIQueryRequest,
    signal: AbortSignal
  ): AsyncGenerator<__resembleIQueryResponse, void, unknown> {
    console.log('ReactQuery - request is : ', request)
    const response = await fetch(
      newRequest(__resembleQueryRequest.toJson(request), "/query", "POST"),
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

    let accumulated = "";

    while (true) {
      const { value, done } = await reader.read();

      if (!response.ok && response.headers.has("grpc-status")) {
        const grpcStatus = response.headers.get("grpc-status");
        let grpcMessage = response.headers.get("grpc-message");
        throw new Error(
          `'ReactQuery responded ` +
            `with status ${grpcStatus}` +
            `${grpcMessage !== null ? ": " + grpcMessage : ""}`
        );
      } else if (!response.ok) {
        throw new Error(
          `'ReactQuery' failed: ${value}`
        );
      } else if (done) {
        break;
      } else {
        accumulated += value.trim();

        if (accumulated.startsWith(",")) {
          accumulated = accumulated.substring(1);
        }

        if (!accumulated.startsWith("[")) {
          accumulated = "[" + accumulated;
        }

        if (!accumulated.endsWith("]")) {
          accumulated = accumulated + "]";
        }

        try {
          const json = JSON.parse(accumulated);
          accumulated = "";
          yield __resembleQueryResponse.fromJson(json.at(-1));
        } catch (e) {
          if (e instanceof SyntaxError) {
            accumulated = accumulated.substring(0, accumulated.length - 1);
            continue;
          } else {
            throw e;
          }
        }
      }
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      } else {
      }
    }
  }

  return {
    GetAll,
    useGetAll,
    Create,
  };
};


