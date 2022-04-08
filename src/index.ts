import { route } from "./route";
import { shim } from "./shim";
import { sync } from "./sync";
import { AppContext } from "@slidev/types";

export function init(
	{ router }: AppContext,
	ws: WebSocket,
	pubJWK: JsonWebKey
) {
	shim();
	route(router);
	if (!crypto.subtle) return;
	sync(router, ws, pubJWK);

	if (location.hash === "#presenter") {
		router.push("/presenter");
	}
}

export default init;
