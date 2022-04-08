#!/usr/bin/env node

const { writeFileSync, mkdirSync } = require("fs");
const {
	webcrypto: { subtle },
    randomUUID
} = require("crypto");
const { bold, cyan, yellow, blue, green, underline } = require("kolorist");
const { version } = require("../package.json");

console.log(`
  ${cyan("●") + blue("■") + yellow("▲")}
  ${bold("Live Slidev")} ${blue(`v${version}`)}
`);

const ok = (text) => console.log(bold(green("🗸 ")) + text);
const info = (text) => console.log(bold(cyan("> ")) + text);

function box(text) {
	const line = "─".repeat(text.length);
	console.log(`┌${line}┐\n│${text}│\n└${line}┘`);
}

const mainCode = `import { defineAppSetup } from "@slidev/types";
import liveSlidev from "live-slidev";
import key from "./key.json";

const ROOM_ID = "${randomUUID()}";

export default defineAppSetup((ctx) => {
    const ws = new WebSocket("wss://rooms.deno.dev/" + ROOM_ID);
	liveSlidev(ctx, ws, key);
});
`;

const setupPath = "./setup"
const keyPath = setupPath + "/key.json"
const mainPath  = setupPath + "/main.ts"

async function main() {
	let { publicKey, privateKey } = await subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-384",
		},
		true,
		["sign", "verify"]
	);
	const key = await subtle.exportKey("jwk", publicKey);
	const { d } = await subtle.exportKey("jwk", privateKey);
	
	if (mkdirSync(setupPath, { recursive: true })) {
		ok("Created directory " + underline(setupPath));
		writeFileSync(mainPath, mainCode);
		ok("Generated boilerplate setup code at " + underline(mainPath));
	}
    ok("Generated public JWK at " + underline(keyPath));
	writeFileSync(keyPath, JSON.stringify(key));
	info("Please copy the private JSON web key 'd' parameter below:");
	box(` ${d} `);
}

main();
