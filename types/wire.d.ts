declare global {
    interface Crypto {
        randomUUID: () => string;
    }
}
export declare const ECDSA: {
    readonly name: "ECDSA";
    readonly namedCurve: "P-384";
};
export declare const ECDSA_SIG: {
    readonly name: "ECDSA";
    readonly hash: {
        readonly name: "SHA-384";
    };
};
export declare function importJWK(jwk: JsonWebKey, usage: KeyUsage): Promise<CryptoKey>;
export declare function sign(key: CryptoKey, data: ArrayBufferLike): Promise<ArrayBuffer>;
export declare function verify(key: CryptoKey, data: ArrayBufferLike, signature: ArrayBufferLike): Promise<boolean>;
export declare function pack(priv: CryptoKey, data: unknown): Promise<Uint8Array>;
export declare function unpack(pub: CryptoKey, packed: ArrayBuffer): Promise<any>;
export declare function send(ws: WebSocket, privKey: CryptoKey, data: unknown): Promise<void>;
export declare function onmessage(ws: WebSocket, pubKey: CryptoKey, handler: (data: any) => void): Promise<void>;
