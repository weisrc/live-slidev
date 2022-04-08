declare global {
	interface Crypto {
		randomUUID: () => string;
	}
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const ECDSA = {
	name: "ECDSA",
	namedCurve: "P-384",
} as const;

export const ECDSA_SIG = {
	name: "ECDSA",
	hash: { name: "SHA-384" },
} as const;

export function importJWK(jwk: JsonWebKey, usage: KeyUsage) {
	return crypto.subtle.importKey("jwk", jwk, ECDSA, false, [usage]);
}

export function sign(key: CryptoKey, data: ArrayBufferLike) {
	return crypto.subtle.sign(ECDSA_SIG, key, data);
}

export function verify(
	key: CryptoKey,
	data: ArrayBufferLike,
	signature: ArrayBufferLike
) {
	return crypto.subtle.verify(ECDSA_SIG, key, signature, data);
}

export async function pack(priv: CryptoKey, data: unknown) {
	const time = Date.now();
	const uuid = crypto.randomUUID();
	const bytes = encoder.encode(JSON.stringify({ data, time, uuid }));
	const signature = new Uint8Array(await sign(priv, bytes));
	const packed = new Uint8Array(bytes.byteLength + signature.byteLength);
	packed.set(signature);
	packed.set(bytes, signature.byteLength);
	return packed;
}

const known = new Set();

export async function unpack(pub: CryptoKey, packed: ArrayBuffer) {
	try {
		const signature = packed.slice(0, 96);
		const bytes = packed.slice(96);
		if (await verify(pub, bytes, signature)) {
			const { data, time, uuid } = JSON.parse(decoder.decode(bytes));
			const delta = Date.now() - time;
			if (delta > 1000 || known.has(uuid)) return;
			known.add(uuid);
			return data;
		}
	} catch {
		return;
	}
}

export async function send(ws: WebSocket, privKey: CryptoKey, data: unknown) {
	ws.send(await pack(privKey, data));
}

export async function onmessage(
	ws: WebSocket,
	pubKey: CryptoKey,
	handler: (data: any) => void
) {
	ws.onmessage = async ({ data }) => {
		const unpacked = await unpack(pubKey, data);
		if (!unpacked) return;
		handler(unpacked);
	};
}
