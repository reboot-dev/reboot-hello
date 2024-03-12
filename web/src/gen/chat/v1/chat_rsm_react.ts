import type {
  Message as __bufbuildProtobufMessage,
  MessageType as __bufbuildProtobufMessageType,
  PartialMessage as __bufbuildProtobufPartialMessage,
} from "@bufbuild/protobuf";
import * as resemble_react from "@reboot-dev/resemble-react";
import * as resemble_api from "@reboot-dev/resemble-api";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import {
  ChatRoomState, 
	Message, 
	CreateRequest, 
	CreateResponse, 
	GetAllRequest, 
	GetAllResponse, 
	PostRequest, 
	PostResponse,
} from "./chat_pb";

// Additionally re-export all messages from the pb module.
export {
  ChatRoomState, 
	Message, 
	CreateRequest, 
	CreateResponse, 
	GetAllRequest, 
	GetAllResponse, 
	PostRequest, 
	PostResponse,
};


export interface ChatMutators {
  post: {
    // Mutators are functions and can be called directly.
    (partialRequest?: __bufbuildProtobufPartialMessage<PostRequest>,
     optimistic_metadata?: any
    ): Promise<
      resemble_react.ResponseOrErrors<
        PostResponse,
        resemble_api.SystemErrorDetails
      >>;

    pending: resemble_react.Mutation<PostRequest>[];
  };
  create: {
    // Mutators are functions and can be called directly.
    (partialRequest?: __bufbuildProtobufPartialMessage<CreateRequest>,
     optimistic_metadata?: any
    ): Promise<
      resemble_react.ResponseOrErrors<
        CreateResponse,
        resemble_api.SystemErrorDetails
      >>;

    pending: resemble_react.Mutation<CreateRequest>[];
  };
}


export interface UseChatApi {
  mutators: ChatMutators;
  useGetAll: (
    partialRequest?: __bufbuildProtobufPartialMessage<GetAllRequest>
  ) => {
    response: GetAllResponse | undefined;
    isLoading: boolean;
    error: undefined | resemble_api.SystemErrorDetails
;
    exception: undefined | Error;
  };
  getAll: (
    partialRequest?: __bufbuildProtobufPartialMessage<GetAllRequest>
  ) => Promise<
    resemble_react.ResponseOrErrors<
    GetAllResponse,
    resemble_api.SystemErrorDetails
    >
  >;
}

export interface SettingsParams {
  id: string;
  storeMutationsLocallyInNamespace?: string;
}

class ChatInstance {

  constructor(id: string, endpoint: string) {
    this.id = id;
    this.endpoint = endpoint;
    this.refs = 1;

    // TODO(benh): rather than keeping a long-lived open connection
    // via `WebSocketsConnection`, we could consider aborting that
    // connection once the websocket is established.
    this.initializeWebSocketsConnection();
    this.initializeWebSocket();
  }

  private ref() {
    this.refs += 1;
    return this.refs;
  }

  private unref() {
    this.refs -= 1;

    if (this.refs === 0 && this.websocket !== undefined) {
      this.websocket.close();
      this.websocketsConnectionAbortController.abort();
    }

    return this.refs;
  }

  readonly id: string;
  private endpoint: string;
  private refs: number;
  private observers: resemble_react.Observers = {};
  private loadingReaders = 0;
  private runningMutates: resemble_react.Mutate[] = [];
  private queuedMutates: resemble_react.Mutate[] = [];
  private flushMutates?: resemble_react.Event = undefined;
  private websocket?: WebSocket = undefined;
  private backoff: resemble_react.Backoff = new resemble_react.Backoff();
  private websocketsConnectionAbortController = new AbortController();

  private hasRunningMutations() {
    return this.runningMutates.length > 0;
  }

  private async flushMutations() {
    if (this.flushMutates === undefined) {
      this.flushMutates = new resemble_react.Event();
    }
    await this.flushMutates.wait();
  }

  private readersLoadedOrFailed() {
    this.flushMutates = undefined;

    if (this.queuedMutates.length > 0) {
      this.runningMutates = this.queuedMutates;
      this.queuedMutates = [];

      if (this.websocket?.readyState === WebSocket.OPEN) {
        for (const { request, update } of this.runningMutates) {
          update({ isLoading: true });
          try {
            this.websocket.send(request.toBinary());
          } catch (e: unknown) {
            // We'll retry since we've stored in `*Mutates`.
          }
        }
      }
    }
  }

  private initializeWebSocketsConnection() {
    resemble_react.retryForever(async () => {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.append("x-resemble-service-name", "chat.v1.Chat");
      headers.append("x-resemble-actor-id", this.id);
      headers.append("Connection", "keep-alive");

      await resemble_react.guardedFetch(
        new Request(
          `${this.endpoint}/resemble.v1alpha1.React.WebSocketsConnection`,
          {
            method: "POST",
            headers,
            body: new resemble_api.react_pb.WebSocketsConnectionRequest()
              .toJsonString(),
          }
        ),
        { signal: this.websocketsConnectionAbortController.signal }
      );
    });
  }

  private initializeWebSocket() {
    if (this.websocket === undefined && this.refs > 0) {
      const url = new URL(this.endpoint);
      this.websocket = new WebSocket(
        `wss://${url.host}/__/resemble/websocket/chat.v1.Chat/${this.id}`
      );

      this.websocket.binaryType = "arraybuffer";

      this.websocket.onopen = (event) => {
        if (this.websocket?.readyState === WebSocket.OPEN) {
          for (const { request, update } of this.runningMutates) {
            update({ isLoading: true });
            try {
              this.websocket.send(request.toBinary());
            } catch (e: unknown) {
              // We'll retry since we've stored in `*Mutates`.
            }
          }
        }
      };

      this.websocket.onerror = async (event) => {
        if (this.websocket !== undefined) {
          // TODO: explicitly close?
          this.websocket = undefined;

          for (const { update } of this.runningMutates) {
            update({ isLoading: false, error: "WebSocket disconnected" });
          }

          if (this.refs > 0) {
            await this.backoff.wait();

            this.initializeWebSocket();
          }
        }
      };

      this.websocket.onclose = async (event) => {
        if (this.websocket !== undefined) {
          // TODO: explicitly close?
          this.websocket = undefined;

          for (const { update } of this.runningMutates) {
            update({ isLoading: false, error: "WebSocket disconnected" });
          }

          if (this.refs > 0) {
            await this.backoff.wait();

            this.initializeWebSocket();
          }
        }
      };

      this.websocket.onmessage = async (event) => {
        const { resolve } = this.runningMutates[0];
        this.runningMutates.shift();

        const response = resemble_api.react_pb.MutateResponse.fromBinary(
          new Uint8Array(event.data)
        );

        resolve(response);

        if (
          this.flushMutates !== undefined &&
          this.runningMutates.length === 0
        ) {
          this.flushMutates.set();
        }
      };
    }
  }

  private async mutate(
    partialRequest: __bufbuildProtobufPartialMessage<resemble_api.react_pb.MutateRequest>,
    update: (props: { isLoading: boolean; error?: any }) => void
  ): Promise<resemble_api.react_pb.MutateResponse> {
    const request = partialRequest instanceof resemble_api.react_pb.MutateRequest
      ? partialRequest
      : new resemble_api.react_pb.MutateRequest(partialRequest);

    return new Promise((resolve, _) => {
      if (this.loadingReaders === 0) {
        this.runningMutates.push({ request, resolve, update });
        if (this.websocket?.readyState === WebSocket.OPEN) {
          update({ isLoading: true });
          try {
            this.websocket.send(request.toBinary());
          } catch (e: unknown) {
            // We'll retry since we've stored in `*Mutates`.
          }
        }
      } else {
        this.queuedMutates.push({ request, resolve, update });
      }
    });
  }

  private async read<
    RequestType extends __bufbuildProtobufMessage<RequestType>,
    ResponseType extends __bufbuildProtobufMessage<ResponseType>,
    >(
    method: string,
    request: RequestType,
    bearerToken: string | undefined,
    responseType: __bufbuildProtobufMessageType<ResponseType>,
    reader: resemble_react.Reader<ResponseType>
  ) {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.append("x-resemble-service-name", "chat.v1.Chat");
    headers.append("x-resemble-actor-id", this.id);
    headers.append("Connection", "keep-alive");

    if (bearerToken !== undefined) {
      headers.append("Authorization", `Bearer ${bearerToken}`);
    }

    const queryRequest = new resemble_api.react_pb.QueryRequest({
      method,
      request: request.toBinary(),
    });

    // Expected idempotency key we should observe due to a mutation.
    interface Expected {
      // Idempotency key of mutation.
      idempotencyKey: string;

      // Callback when we've observed this idempotency key.
      observed: (callback: () => void) => Promise<void>;

      // Callback when we no longer care about observing.
      aborted: () => void;
    }

    let expecteds: Expected[] = [];

    // When we disconnect we may not be able to observe
    // responses due to mutations yet there may still be
    // some outstanding responses that are expected which
    // we treat as "orphans" in the sense that we won't
    // observe their idempotency keys but once we reconnect
    // we will still have observed their effects and can
    // call `observed()` on them.
    let orphans: Expected[] = [];

    const id = `${uuidv4()}`;

    this.observers[id] = {
      observe: (
        idempotencyKey: string,
        observed: (callback: () => void) => Promise<void>,
        aborted: () => void
      ) => {
        expecteds.push({ idempotencyKey, observed, aborted });
      },
      unobserve: (idempotencyKey: string) => {
        expecteds = expecteds.filter(
          expected => expected.idempotencyKey !== idempotencyKey
        );
      }
    };

    try {
      await resemble_react.retryForever(async () => {
        let loaded = false;
        this.loadingReaders += 1;

        // Any mutations started after we've incremented
        // `this.loadingReaders` will be queued until after
        // all the readers have loaded and thus (1) we know all
        // current `expected` are actually `orphans` that
        // we will haved "observed" once we are (re)connected
        // because we flush mutations before starting to read
        // and (2) all queued mutations can stay in `expected`
        // because we will in fact be able to observe them
        // since they won't get sent over the websocket
        // until after we are (re)connected.
        //
        // NOTE: we need to concatenate with `orphans`
        // because we may try to (re)connect multiple times
        // and between each try more mutations may have been
        // made (or queued ones will be moved to running).
        orphans = [...orphans, ...expecteds];
        expecteds = [];

        try {
          // Wait for potentially completed mutations to flush
          // before starting to read so that we read the latest
          // state including those mutations.
          if (this.hasRunningMutations()) {
            await this.flushMutations();
          }

          unstable_batchedUpdates(() => {
            for (const setIsLoading of Object.values(reader.setIsLoadings)) {
              setIsLoading(true);
            }
          });

          const queryResponses = resemble_react.grpcServerStream({
            endpoint: `${this.endpoint}/resemble.v1alpha1.React.Query`,
            method: "POST",
            headers,
            request: queryRequest,
            responseType: resemble_api.react_pb.QueryResponse,
            signal: reader.abortController.signal,
          });

          for await (const queryResponse of queryResponses) {
            if (!loaded) {
              if ((this.loadingReaders -= 1) === 0) {
                this.readersLoadedOrFailed();
              }
              loaded = true;
            }

            unstable_batchedUpdates(() => {
              for (const setIsLoading of Object.values(reader.setIsLoadings)) {
                setIsLoading(false);
              }
            });

            const response = queryResponse.response !== undefined
              ? responseType.fromBinary(queryResponse.response)
              : undefined;

            // If we were disconnected it must be that we've
            // observed all `orphans` because we waited
            // for any mutations to flush before we re-started to
            // read.
            if (orphans.length > 0) {
              // We mark all mutations as observed except the
              // last one which we also invoke all `setResponse`s.
              // In this way we effectively create a barrier
              // for all readers that will synchronize on the last
              // mutation, but note that this still may lead
              // to some partial state/response updates because
              // one reader may have actually received a response
              // while another reader got disconnected. While this
              // is likely very rare, it is possible. Mitigating
              // this issue is non-trivial and for now we have
              // no plans to address it.
              for (let i = 0; i < orphans.length - 1; i++) {
                orphans[i].observed(() => {});
              }
              await orphans[orphans.length - 1].observed(() => {
                if (response !== undefined) {
                  reader.response = response;
                  for (const setResponse of Object.values(reader.setResponses)) {
                    setResponse(response);
                  }
                }
              });

              orphans = [];
            } else if (
              expecteds.length > 0 &&
              queryResponse.idempotencyKeys.includes(
                expecteds[0].idempotencyKey
              )
            ) {
              // eslint-disable-next-line no-loop-func
              await expecteds[0].observed(() => {
                if (response !== undefined) {
                  reader.response = response;
                  for (const setResponse of Object.values(reader.setResponses)) {
                    setResponse(response);
                  }
                }
                // eslint-disable-next-line no-loop-func
                expecteds.shift();
              });
            } else if (response !== undefined) {
              unstable_batchedUpdates(() => {
                reader.response = response;
                for (const setResponse of Object.values(reader.setResponses)) {
                  setResponse(response);
                }
              });
            }
          }

          throw new Error('Not expecting stream to ever be done');
        } catch (e: unknown) {
          if (!loaded) {
            if ((this.loadingReaders -= 1) === 0) {
              this.readersLoadedOrFailed();
            }
          }

          loaded = false;

          if (reader.abortController.signal.aborted) {
            for (const { aborted } of [...orphans, ...expecteds]) {
              aborted();
            }
            return;
          }

          unstable_batchedUpdates(() => {
            for (const setIsLoading of Object.values(reader.setIsLoadings)) {
              setIsLoading(false);
            }
            if (e instanceof resemble_api.Status) {
              for (const setStatus of Object.values(reader.setStatuses)) {
                setStatus(e);
              }
            }
          });

          console.error(e);

          throw e; // This just retries!
        }
      });
    } finally {
      delete this.observers[id];
    }
  }


  private useGetAllReaders: {
    [id: string]: resemble_react.Reader<GetAllResponse>
  } = {};

  useGetAll(
    id: string,
    request: GetAllRequest,
    bearerToken: string | undefined,
    setResponse: (response: GetAllResponse) => void,
    setIsLoading: (isLoading: boolean) => void,
    setStatus: (status: resemble_api.Status) => void
  ) {
    let read = false;

    // NOTE: need to concatenate `request.toJsonString()` with `bearerToken`
    // because it uniquely identifies the request, i.e., a second call
    // that has the same `request` but a different bearerToken should be a
    // different call.
    const key = request.toJsonString() + bearerToken;

    if (!(key in this.useGetAllReaders)) {
      this.useGetAllReaders[key] = {
        abortController: new AbortController(),
        setResponses: {},
        setIsLoadings: {},
        setStatuses: {},
      };

      read = true;
    }

    let reader = this.useGetAllReaders[key];

    reader.setResponses[id] = setResponse;
    reader.setIsLoadings[id] = setIsLoading;
    reader.setStatuses[id] = setStatus;

    if (reader.response !== undefined) {
      setResponse(reader.response);
    }

    if (read) {
      this.read(
        "GetAll",
        request,
        bearerToken,
        GetAllResponse,
        reader
      );
    }
  }

  unuseGetAll(
    id: string,
    request: GetAllRequest,
    bearerToken: string | undefined
  ) {
    // See comment above in `useGetAll` for why
    // we concatenate `request.toJsonString()` with `bearerToken`.
    const key = request.toJsonString() + bearerToken;

    const reader = this.useGetAllReaders[key];

    delete reader.setResponses[id];
    delete reader.setIsLoadings[id];
    delete reader.setStatuses[id];

    if (Object.values(reader.setResponses).length === 0) {
      delete this.useGetAllReaders[key];
      reader.abortController.abort();
    }
  }


  private usePostMutations: (
    resemble_react.Mutation<PostRequest>)[] = [];

  private usePostSetPendings: {
    [id: string]: (mutations: resemble_react.Mutation<PostRequest>[]) => void
  } = {};

  async post(
    mutation: resemble_react.Mutation<PostRequest>
  ): Promise<
    resemble_react.ResponseOrErrors<
      PostResponse,
      resemble_api.SystemErrorDetails
  >> {
    // We always have at least 1 observer which is this function!
    let remainingObservers = 1;

    const event = new resemble_react.Event();

    const callbacks: (() => void)[] = [];

    const observed = (callback: () => void) => {
      callbacks.push(callback);
      remainingObservers -= 1;
      if (remainingObservers === 0) {
        unstable_batchedUpdates(() => {
          for (const callback of callbacks) {
            callback();
          }
        });
        event.set();
      }
      return event.wait();
    };

    const aborted = () => {
      observed(() => {});
    }

    // Tell observers about this pending mutation.
    for (const id in this.observers) {
      remainingObservers += 1;
      this.observers[id].observe(mutation.idempotencyKey, observed, aborted);
    }

    this.usePostMutations.push(mutation);

    unstable_batchedUpdates(() => {
      for (const setPending of Object.values(this.usePostSetPendings)) {
        setPending(this.usePostMutations);
      }
    });

    return new Promise<
      resemble_react.ResponseOrErrors<
        PostResponse,
        resemble_api.SystemErrorDetails
      >>(
      async (resolve, reject) => {
        const { responseOrStatus } = await this.mutate(
          {
            method: "Post",
            request: mutation.request.toBinary(),
            idempotencyKey: mutation.idempotencyKey,
            bearerToken: mutation.bearerToken,
          },
          ({ isLoading, error }: { isLoading: boolean; error?: any }) => {
            let rerender = false;
            for (const m of this.usePostMutations) {
              if (m === mutation) {
                if (m.isLoading !== isLoading) {
                  m.isLoading = isLoading;
                  rerender = true;
                }
                if (error !== undefined && m.error !== error) {
                  m.error = error;
                  rerender = true;
                }
              }
            }

            if (rerender) {
              unstable_batchedUpdates(() => {
                for (const setPending of Object.values(this.usePostSetPendings)) {
                  setPending(this.usePostMutations);
                }
              });
            }
          }
        );

        switch (responseOrStatus.case) {
          case "response":
            await observed(() => {
              this.usePostMutations =
                this.usePostMutations.filter(m => m !== mutation);

              unstable_batchedUpdates(() => {
                for (const setPending of Object.values(this.usePostSetPendings)) {
                  setPending(this.usePostMutations);
                }
              });

              resolve({
                response: PostResponse.fromBinary(
                  responseOrStatus.value
                )
              });
            });
            break;
          case "status":
            // Let the observers know they no longer should expect to
            // observe this idempotency key.
            for (const id in this.observers) {
              this.observers[id].unobserve(mutation.idempotencyKey);
            }

            const status = resemble_api.Status.fromJsonString(responseOrStatus.value);

            let error;
            if ((error = resemble_api.SystemError.fromStatus(status)) !== undefined) {
              console.warn(`Error '${error.getType().typeName}' received`);
              resolve({ error });
            } else {
              reject(
                new Error(
                  `Unknown error with gRPC status: ${JSON.stringify(status)}`
                )
              );
            }
            break;
          default:
            reject(new Error('Expecting either a response or an error'));
        }
      });
  }

  usePost(
    id: string,
    setPending: (mutations: resemble_react.Mutation<PostRequest>[]) => void
  ) {
    this.usePostSetPendings[id] = setPending;
  }

  unusePost(id: string) {
    delete this.usePostSetPendings[id];
  }


  private useCreateMutations: (
    resemble_react.Mutation<CreateRequest>)[] = [];

  private useCreateSetPendings: {
    [id: string]: (mutations: resemble_react.Mutation<CreateRequest>[]) => void
  } = {};

  async create(
    mutation: resemble_react.Mutation<CreateRequest>
  ): Promise<
    resemble_react.ResponseOrErrors<
      CreateResponse,
      resemble_api.SystemErrorDetails
  >> {
    // We always have at least 1 observer which is this function!
    let remainingObservers = 1;

    const event = new resemble_react.Event();

    const callbacks: (() => void)[] = [];

    const observed = (callback: () => void) => {
      callbacks.push(callback);
      remainingObservers -= 1;
      if (remainingObservers === 0) {
        unstable_batchedUpdates(() => {
          for (const callback of callbacks) {
            callback();
          }
        });
        event.set();
      }
      return event.wait();
    };

    const aborted = () => {
      observed(() => {});
    }

    // Tell observers about this pending mutation.
    for (const id in this.observers) {
      remainingObservers += 1;
      this.observers[id].observe(mutation.idempotencyKey, observed, aborted);
    }

    this.useCreateMutations.push(mutation);

    unstable_batchedUpdates(() => {
      for (const setPending of Object.values(this.useCreateSetPendings)) {
        setPending(this.useCreateMutations);
      }
    });

    return new Promise<
      resemble_react.ResponseOrErrors<
        CreateResponse,
        resemble_api.SystemErrorDetails
      >>(
      async (resolve, reject) => {
        const { responseOrStatus } = await this.mutate(
          {
            method: "Create",
            request: mutation.request.toBinary(),
            idempotencyKey: mutation.idempotencyKey,
            bearerToken: mutation.bearerToken,
          },
          ({ isLoading, error }: { isLoading: boolean; error?: any }) => {
            let rerender = false;
            for (const m of this.useCreateMutations) {
              if (m === mutation) {
                if (m.isLoading !== isLoading) {
                  m.isLoading = isLoading;
                  rerender = true;
                }
                if (error !== undefined && m.error !== error) {
                  m.error = error;
                  rerender = true;
                }
              }
            }

            if (rerender) {
              unstable_batchedUpdates(() => {
                for (const setPending of Object.values(this.useCreateSetPendings)) {
                  setPending(this.useCreateMutations);
                }
              });
            }
          }
        );

        switch (responseOrStatus.case) {
          case "response":
            await observed(() => {
              this.useCreateMutations =
                this.useCreateMutations.filter(m => m !== mutation);

              unstable_batchedUpdates(() => {
                for (const setPending of Object.values(this.useCreateSetPendings)) {
                  setPending(this.useCreateMutations);
                }
              });

              resolve({
                response: CreateResponse.fromBinary(
                  responseOrStatus.value
                )
              });
            });
            break;
          case "status":
            // Let the observers know they no longer should expect to
            // observe this idempotency key.
            for (const id in this.observers) {
              this.observers[id].unobserve(mutation.idempotencyKey);
            }

            const status = resemble_api.Status.fromJsonString(responseOrStatus.value);

            let error;
            if ((error = resemble_api.SystemError.fromStatus(status)) !== undefined) {
              console.warn(`Error '${error.getType().typeName}' received`);
              resolve({ error });
            } else {
              reject(
                new Error(
                  `Unknown error with gRPC status: ${JSON.stringify(status)}`
                )
              );
            }
            break;
          default:
            reject(new Error('Expecting either a response or an error'));
        }
      });
  }

  useCreate(
    id: string,
    setPending: (mutations: resemble_react.Mutation<CreateRequest>[]) => void
  ) {
    this.useCreateSetPendings[id] = setPending;
  }

  unuseCreate(id: string) {
    delete this.useCreateSetPendings[id];
  }


  private static instances: { [id: string]: ChatInstance } = {};

  static use(id: string, endpoint: string) {
    if (!(id in this.instances)) {
      this.instances[id] = new ChatInstance(id, endpoint);
    } else {
      this.instances[id].ref();
    }

    return this.instances[id];
  }

  unuse() {
    if (this.unref() === 0) {
      delete ChatInstance.instances[this.id];
    }
  }
}

export const useChat = (
  { id }: { id: string }
): UseChatApi => {
  const resembleContext = resemble_react.useResembleContext();

  const endpoint = resembleContext.client.endpoint;
  const bearerToken = resembleContext.bearerToken;

  const [instance, setInstance] = useState(() => {
    return ChatInstance.use(
      id, endpoint
    );
  });

  if (instance.id !== id) {
    setInstance(
      ChatInstance.use(
        id, endpoint
      )
    );
  }

  useEffect(() => {
    return () => {
      instance.unuse();
    };
  }, [instance]);

  const headers = useMemo(() => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.append("x-resemble-service-name", "chat.v1.Chat");
    headers.append("x-resemble-actor-id", id);
    headers.append("Connection", "keep-alive");

    if (bearerToken !== undefined) {
      headers.append("Authorization", `Bearer ${bearerToken}`);
    }

    return headers;
  }, [id, bearerToken]);



  function useGetAll(
    partialRequest: __bufbuildProtobufPartialMessage<GetAllRequest> = {}
  ) {
    const newRequest = partialRequest instanceof GetAllRequest
      ? partialRequest.clone()
      : new GetAllRequest(partialRequest);

    const [request, setRequest] = useState(newRequest);

    if (!request.equals(newRequest)) {
      setRequest(newRequest);
    }

    const [response, setResponse] = useState<GetAllResponse>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<
      undefined
      | resemble_api.SystemErrorDetails
      >();
    const [exception, setException] = useState<Error>();

    const resembleContext = resemble_react.useResembleContext();

    const bearerToken = resembleContext.bearerToken;

    useEffect(() => {
      const id = uuidv4();
      instance.useGetAll(
        id,
        request,
        bearerToken,
        (response: GetAllResponse) => {
          unstable_batchedUpdates(() => {
            setError(undefined);
            setResponse(response);
          });
        },
        setIsLoading,
        (status: resemble_api.Status) => {
          let error;
          if ((error = resemble_api.SystemError.fromStatus(status)) !== undefined) {
            console.warn(`Error '${error.getType().typeName}' received`);
            setError(error);
          } else {
            error = new Error(
              `Unknown error with gRPC status: ${JSON.stringify(status)}`
            );
            console.warn(error.message);
            setException(error);
          }
        },
      );
      return () => {
        instance.unuseGetAll(id, request, bearerToken);
      };
    }, [request, bearerToken]);

    return { response, isLoading, error, exception };
  }

  async function getAll(
    partialRequest: __bufbuildProtobufPartialMessage<GetAllRequest> = {}
  ) {
    const request = partialRequest instanceof GetAllRequest
      ? partialRequest.clone()
      : new GetAllRequest(partialRequest);

    // Fetch with retry, using a backoff, i.e., if we get disconnected.
    const response = await (async () => {
      const backoff = new resemble_react.Backoff();

      while (true) {
        try {
          // Invariant here is that we use the '/package.service.method' path and
          // HTTP 'POST' method (we need 'POST' because we send an HTTP body).
          //
          // See also 'resemble/helpers.py'.
          return await resemble_react.guardedFetch(
            new Request(
              `${resembleContext.client.endpoint}/chat.v1.Chat.GetAll`, {
                method: "POST",
                headers,
                body: request.toJsonString()
              }
            )
          );
        } catch (e: unknown) {
          if (e instanceof Error) {
            console.error(e.message);
          } else {
            console.error(`Unknown error: ${JSON.stringify(e)}`);
          }
        }

        await backoff.wait();
      }
    })();

    if (!response.ok) {
      if (response.headers.get("content-type") === "application/json") {
        const status = resemble_api.Status.fromJson(await response.json());

        let error;
        if ((error = resemble_api.SystemError.fromStatus(status)) !== undefined) {
          console.warn(`Error '${error.getType().typeName}' received`);
          return { error };
        } else {
          throw new Error(
            `Unknown error with gRPC status: ${JSON.stringify(status)}`
          );
        }
      } else {
        throw new Error(`Unknown error with HTTP status ${response.status}`);
      }
    } else {
      return { response: await response.json() };
    }
  }


  function usePost() {
    const [
      pending,
      setPending
    ] = useState<resemble_react.Mutation<PostRequest>[]>([]);

    useEffect(() => {
      const id = uuidv4();
      instance.usePost(id, setPending);
      return () => {
        instance.unusePost(id);
      };
    }, []);

    const resembleContext = resemble_react.useResembleContext();

    const bearerToken = resembleContext.bearerToken;

    const post = useMemo(() => {
      const method = async (
        partialRequest: __bufbuildProtobufPartialMessage<PostRequest> = {},
        optimistic_metadata?: any
      ) => {
        const request = partialRequest instanceof PostRequest
          ? partialRequest.clone()
          : new PostRequest(partialRequest);

        const idempotencyKey = uuidv4();

        const mutation = {
          request,
          idempotencyKey,
          bearerToken,
          optimistic_metadata,
          isLoading: false, // Won't start loading if we're flushing mutations.
        };

        return instance.post(mutation);
      };

      method.pending =
        new Array<resemble_react.Mutation<PostRequest>>();

      return method;
    }, [bearerToken]);

    post.pending = pending;

    return post;
  }

  const post = usePost();


  function useCreate() {
    const [
      pending,
      setPending
    ] = useState<resemble_react.Mutation<CreateRequest>[]>([]);

    useEffect(() => {
      const id = uuidv4();
      instance.useCreate(id, setPending);
      return () => {
        instance.unuseCreate(id);
      };
    }, []);

    const resembleContext = resemble_react.useResembleContext();

    const bearerToken = resembleContext.bearerToken;

    const create = useMemo(() => {
      const method = async (
        partialRequest: __bufbuildProtobufPartialMessage<CreateRequest> = {},
        optimistic_metadata?: any
      ) => {
        const request = partialRequest instanceof CreateRequest
          ? partialRequest.clone()
          : new CreateRequest(partialRequest);

        const idempotencyKey = uuidv4();

        const mutation = {
          request,
          idempotencyKey,
          bearerToken,
          optimistic_metadata,
          isLoading: false, // Won't start loading if we're flushing mutations.
        };

        return instance.create(mutation);
      };

      method.pending =
        new Array<resemble_react.Mutation<CreateRequest>>();

      return method;
    }, [bearerToken]);

    create.pending = pending;

    return create;
  }

  const create = useCreate();


  return {
    mutators: {
      post,
      create,
    },
    getAll,
    useGetAll,
  };
};


