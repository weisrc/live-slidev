var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import routes from "/@slidev/routes";
import * as note from "@slidev/client/logic/note";
import { ref } from "vue";
import { clicks, isPresenter, currentPage, getPath } from "@slidev/client/logic/nav";
import { isDark } from "@slidev/client/logic/dark";
import { drauu, drawingState } from "@slidev/client/logic/drawings";
function route(router) {
  router.addRoute({
    name: "presenter",
    path: "/presenter/:no",
    component: () => import("@slidev/client/internals/Presenter.vue")
  });
  router.addRoute({
    path: "/presenter",
    redirect: { path: "/presenter/1" }
  });
}
const useSlideInfo = (id) => {
  var _a, _b;
  return {
    info: ref((_b = (_a = routes[id]) == null ? void 0 : _a.meta) == null ? void 0 : _b.slide),
    update: async () => {
    }
  };
};
function shim() {
  note.useSlideInfo = useSlideInfo;
}
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ECDSA = {
  name: "ECDSA",
  namedCurve: "P-384"
};
const ECDSA_SIG = {
  name: "ECDSA",
  hash: { name: "SHA-384" }
};
function importJWK(jwk, usage) {
  return crypto.subtle.importKey("jwk", jwk, ECDSA, false, [usage]);
}
function sign(key, data) {
  return crypto.subtle.sign(ECDSA_SIG, key, data);
}
function verify(key, data, signature) {
  return crypto.subtle.verify(ECDSA_SIG, key, signature, data);
}
async function pack(priv, data) {
  const time = Date.now();
  const uuid = Math.random().toString(36).slice(2);
  const bytes = encoder.encode(JSON.stringify({ data, time, uuid }));
  const signature = new Uint8Array(await sign(priv, bytes));
  const packed = new Uint8Array(bytes.byteLength + signature.byteLength);
  packed.set(signature);
  packed.set(bytes, signature.byteLength);
  return packed;
}
const known = /* @__PURE__ */ new Set();
async function unpack(pub, packed) {
  try {
    const signature = packed.slice(0, 96);
    const bytes = packed.slice(96);
    if (await verify(pub, bytes, signature)) {
      const { data, time, uuid } = JSON.parse(decoder.decode(bytes));
      const delta = Date.now() - time;
      if (delta > 1e3 || known.has(uuid))
        return;
      known.add(uuid);
      return data;
    }
  } catch {
    return;
  }
}
async function send(ws, privKey, data) {
  ws.send(await pack(privKey, data));
}
async function onmessage(ws, pubKey, handler) {
  ws.onmessage = async ({ data }) => {
    const unpacked = await unpack(pubKey, data);
    if (!unpacked)
      return;
    handler(unpacked);
  };
}
function after(target, name, handler) {
  const old = target[name].bind(target);
  target[name] = () => {
    old();
    handler();
  };
}
async function sync(router, ws, pubJWK) {
  const pubKey = await importJWK(pubJWK, "verify");
  let privKey;
  const ok = () => isPresenter.value && ws.readyState === ws.OPEN;
  function syncNav() {
    if (!ok())
      return;
    send(ws, privKey, {
      nav: {
        clicks: clicks.value,
        currentPage: currentPage.value
      }
    });
  }
  let wasDark = isDark.value;
  function syncDark() {
    if (!ok() || wasDark === isDark.value)
      return;
    send(ws, privKey, {
      dark: isDark.value
    });
    wasDark = isDark.value;
  }
  function syncDrawings() {
    if (!ok())
      return;
    const page = currentPage.value;
    send(ws, privKey, {
      drawings: {
        [page]: drawingState[page]
      }
    });
  }
  const d = location.hash.slice(1);
  if (d) {
    try {
      const privJWK = __spreadProps(__spreadValues({}, pubJWK), { d, key_ops: ["sign"] });
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
        query: __spreadProps(__spreadValues({}, router.currentRoute.value.query), {
          clicks: nav.clicks || 0
        })
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
    const data = drawingState[page];
    drauu.load(data);
  });
  window.states = { isDark, clicks, isPresenter, currentPage };
  ws.binaryType = "arraybuffer";
  router.afterEach(syncNav);
  setInterval(syncDark, 100);
  drauu.on("committed", syncDrawings);
  after(drauu, "redo", syncDrawings);
  after(drauu, "undo", syncDrawings);
  after(drauu, "clear", syncDrawings);
}
function init({ router }, ws, pubJWK) {
  shim();
  route(router);
  if (!crypto.subtle)
    return;
  sync(router, ws, pubJWK);
  if (location.hash === "#presenter") {
    router.push("/presenter");
  }
}
export { init as default, init };
