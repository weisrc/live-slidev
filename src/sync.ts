import {
	clicks,
	currentPage,
	getPath,
	isPresenter,
} from "@slidev/client/logic/nav";
import { isDark } from "@slidev/client/logic/dark";
import { drauu, drawingState } from "@slidev/client/logic/drawings";
import { Router } from "vue-router";
import { importJWK, onmessage, send } from "./wire";

function after<T extends object>(
	target: T,
	name: keyof T,
	handler: Function
): any {
	// @ts-ignore
	const old = target[name].bind(target);
	// @ts-ignore
	target[name] = () => {
		old();
		handler();
	};
}

export async function sync(router: Router, ws: WebSocket, pubJWK: JsonWebKey) {
	const pubKey = await importJWK(pubJWK, "verify");
	let privKey: CryptoKey;

	const ok = () => isPresenter.value && ws.readyState === ws.OPEN

	function syncNav() {
		if (!ok()) return;
		send(ws, privKey, {
			nav: {
				clicks: clicks.value,
				currentPage: currentPage.value,
			},
		});
	}

	let wasDark = isDark.value;
	function syncDark() {
		if (!ok() || wasDark === isDark.value) return;
		send(ws, privKey, {
			dark: isDark.value,
		});
		wasDark = isDark.value;
	}

	function syncDrawings() {
		if (!ok()) return;
		const page = currentPage.value;
		send(ws, privKey, {
			drawings: {
				[page]: drawingState[page],
			},
		});
	}

	const d = location.hash.slice(1);
	if (d) {
		try {
			const privJWK: JsonWebKey = { ...pubJWK, d, key_ops: ["sign"] };
			privKey = await importJWK(privJWK, "sign");
			router.push("/presenter");
		} catch (e) {
			console.error(e);
			location.hash = "error-in-console";
		}
	}

	onmessage(ws, pubKey, async ({ nav, drawings, dark }) => {
		if (nav) {
			router.replace({
				path: getPath(nav.currentPage),
				query: {
					...router.currentRoute.value.query,
					clicks: nav.clicks || 0,
				},
			});
		}
		if (drawings) {
			for (let id in drawings) {
				drawingState[+id] = drawings[id];
			}
		}
		if (typeof dark === "boolean") {
			isDark.value = dark;
		}
		const page = currentPage.value;
		const data = drawingState[page]!;
		drauu.load(data);
	});

	// @ts-ignore
	window.states = { isDark, clicks, isPresenter, currentPage };

	ws.binaryType = "arraybuffer";

	router.afterEach(syncNav);
	setInterval(syncDark, 100);

	drauu.on("committed", syncDrawings);
	after(drauu, "redo", syncDrawings);
	after(drauu, "undo", syncDrawings);
	after(drauu, "clear", syncDrawings);
}
