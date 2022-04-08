// @ts-ignore
import routes from "/@slidev/routes";
import { SlideInfoExtended } from "@slidev/types";
import * as note from "@slidev/client/logic/note";
import { Ref, ref } from "vue";

const useSlideInfo: typeof note.useSlideInfo = (id) => ({
	info: ref(routes[id]?.meta?.slide) as Ref<SlideInfoExtended>,
	update: async () => {},
});

export function shim() {
	// @ts-ignore
	note.useSlideInfo = useSlideInfo;
}
