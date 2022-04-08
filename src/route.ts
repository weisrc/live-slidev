import { Router } from "vue-router";

export function route(router: Router) {
	router.addRoute({
		name: "presenter",
		path: "/presenter/:no",
		// @ts-ignore
		component: () => import("@slidev/client/internals/Presenter.vue"),
	});
	router.addRoute({
		path: "/presenter",
		redirect: { path: "/presenter/1" },
	});
}
