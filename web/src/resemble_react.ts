/* eslint-disable */
import * as _m0 from "protobufjs/minimal";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export const protobufPackage = "resemble.v1alpha1";

export interface QueryRequest {
  method: string;
  request: Uint8Array;
}

export interface QueryResponse {
  response: Uint8Array;
  idempotencyKeys: string[];
}

function createBaseQueryRequest(): QueryRequest {
  return { method: "", request: new Uint8Array() };
}

export const QueryRequest = {
  encode(
    message: QueryRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.method !== "") {
      writer.uint32(10).string(message.method);
    }
    if (message.request.length !== 0) {
      writer.uint32(18).bytes(message.request);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.method = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.request = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJson(object: any): QueryRequest {
    return {
      method: isSet(object.method) ? String(object.method) : "",
      request: isSet(object.request)
        ? bytesFromBase64(object.request)
        : new Uint8Array(),
    };
  },

  toJson(message: QueryRequest): unknown {
    const obj: any = {};
    message.method !== undefined && (obj.method = message.method);
    message.request !== undefined &&
      (obj.request = base64FromBytes(
        message.request !== undefined ? message.request : new Uint8Array()
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryRequest>, I>>(
    base?: I
  ): QueryRequest {
    return QueryRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<QueryRequest>, I>>(
    object: I
  ): QueryRequest {
    const message = createBaseQueryRequest();
    message.method = object.method ?? "";
    message.request = object.request ?? new Uint8Array();
    return message;
  },
};

function createBaseQueryResponse(): QueryResponse {
  return { response: new Uint8Array(), idempotencyKeys: [] };
}

export const QueryResponse = {
  encode(
    message: QueryResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.response.length !== 0) {
      writer.uint32(10).bytes(message.response);
    }
    for (const v of message.idempotencyKeys) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.response = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.idempotencyKeys.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJson(object: any): QueryResponse {
    return {
      response: isSet(object.response)
        ? bytesFromBase64(object.response)
        : new Uint8Array(),
      idempotencyKeys: Array.isArray(object?.idempotencyKeys)
        ? object.idempotencyKeys.map((e: any) => String(e))
        : [],
    };
  },

  toJson(message: QueryResponse): unknown {
    const obj: any = {};
    message.response !== undefined &&
      (obj.response = base64FromBytes(
        message.response !== undefined ? message.response : new Uint8Array()
      ));
    if (message.idempotencyKeys) {
      obj.idempotencyKeys = message.idempotencyKeys.map((e) => e);
    } else {
      obj.idempotencyKeys = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryResponse>, I>>(
    base?: I
  ): QueryResponse {
    return QueryResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<QueryResponse>, I>>(
    object: I
  ): QueryResponse {
    const message = createBaseQueryResponse();
    message.response = object.response ?? new Uint8Array();
    message.idempotencyKeys = object.idempotencyKeys?.map((e) => e) || [];
    return message;
  },
};

export interface React {
  Query(request: QueryRequest): Observable<QueryResponse>;
}

export class ReactClientImpl implements React {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || "resemble.v1alpha1.React";
    this.rpc = rpc;
    this.Query = this.Query.bind(this);
  }
  Query(request: QueryRequest): Observable<QueryResponse> {
    const data = QueryRequest.encode(request).finish();
    const result = this.rpc.serverStreamingRequest(this.service, "Query", data);
    return result.pipe(
      map((data) => QueryResponse.decode(_m0.Reader.create(data)))
    );
  }
}

interface Rpc {
  request(
    service: string,
    method: string,
    data: Uint8Array
  ): Promise<Uint8Array>;
  clientStreamingRequest(
    service: string,
    method: string,
    data: Observable<Uint8Array>
  ): Promise<Uint8Array>;
  serverStreamingRequest(
    service: string,
    method: string,
    data: Uint8Array
  ): Observable<Uint8Array>;
  bidirectionalStreamingRequest(
    service: string,
    method: string,
    data: Observable<Uint8Array>
  ): Observable<Uint8Array>;
}

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
