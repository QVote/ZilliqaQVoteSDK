export namespace QVoteContracts {
    /**
    * We are not including Nat
    */
    export namespace Types {
        type Bits = "32" | "64" | "128" | "256"
        type ByStrLength = "20" | "30" | ""
        export type String = "String"
        export type Bool = "Bool"
        export type BNum = "BNum"
        export type Int<X extends Bits> = `Int${X}`
        export type Uint<X extends Bits> = `Uint${X}`
        export type ByStr<X extends ByStrLength> = `ByStr${X}`
        export type Primitive = Int<Bits> | Uint<Bits> | ByStr<ByStrLength> | string | BNum
        export type Algebraic = Bool | ScillaList<any> | ScillaMap<any, any> | Pair<any, any>
        export type ScillaList<V extends All> = `List (${V})`
        export type ScillaMap<K extends Primitive, V extends All> = `Map (${K}) (${V})`
        export type Pair<V1 extends All, V2 extends All> = `Pair (${V1}) (${V2})`
        export type All = Primitive | Algebraic
    }

    export interface Transition {
        vname: string;
        params: Field[];
    }
    export interface Field {
        vname: string;
        type: string;
        depth?: number;
    }
    export type ValueField = string | ADTValue;
    export interface Value {
        vname: string;
        type: string;
        value: ValueField;
    }
    export interface ADTValue {
        constructor: string;
        argtypes: string[];
        arguments: Value[];
    }
}

export namespace Zil {
    export interface RPCResponseSuccess<R = any> extends RPCResponseBase {
        result: R;
        error: undefined;
    }
    export interface RPCResponseError<E = any> extends RPCResponseBase {
        result: undefined;
        error: RPCError<E>;
    }
    export declare enum RPCErrorCode {
        RPC_INVALID_REQUEST = -32600,
        RPC_METHOD_NOT_FOUND = -32601,
        RPC_INVALID_PARAMS = -32602,
        RPC_INTERNAL_ERROR = -32603,
        RPC_PARSE_ERROR = -32700,
        RPC_MISC_ERROR = -1,
        RPC_TYPE_ERROR = -3,
        RPC_INVALID_ADDRESS_OR_KEY = -5,
        RPC_INVALID_PARAMETER = -8,
        RPC_DATABASE_ERROR = -20,
        RPC_DESERIALIZATION_ERROR = -22,
        RPC_VERIFY_ERROR = -25,
        RPC_VERIFY_REJECTED = -26,
        RPC_IN_WARMUP = -28,
        RPC_METHOD_DEPRECATED = -32
    }
    export interface RPCError<E> {
        code: RPCErrorCode;
        message: string;
        data?: E;
    }
    export declare type RPCResponse<R, E> = RPCResponseSuccess<R> | RPCResponseError<E>;
    interface RPCResponseBase {
        jsonrpc: "2.0";
        id: "1";
    }
}