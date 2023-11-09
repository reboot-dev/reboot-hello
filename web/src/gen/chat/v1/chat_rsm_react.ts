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
  useGetAll: (partialRequest?: __bufbuildProtobufPartialMessage<GetAllRequest>) => {
   response: GetAllResponse | undefined;
    isLoading: boolean;
    error: unknown;
    mutations: {
    };
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



    useEffect(() => {
      if (abortController === undefined ) {
        return
      }
      const loop = async () => {
        await __resembleRetryForever(async () => {
          try {

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
      },
    };
  };




  async function* ReactQuery(
    request: __resembleIQueryRequest,
    signal: AbortSignal
  ): AsyncGenerator<__resembleIQueryResponse, void, unknown> {
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
  };
};


