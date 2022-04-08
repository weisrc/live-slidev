import { defineAppSetup } from "@slidev/types";
import liveSlidev from "../src";
import key from "./key.json";

const ROOM_ID = "4b86454b-1763-4e36-b8e6-68cf1fd1a31f";

export default defineAppSetup((ctx) => {
    const ws = new WebSocket("wss://rooms.deno.dev/" + ROOM_ID);
	liveSlidev(ctx, ws, key);
});
