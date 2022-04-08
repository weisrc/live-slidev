import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

const TBR = "___TO_BE_REMOVED___";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			fileName: "live-slidev",
		},
		rollupOptions: {
			external: ["vue", "vue-router", /^@slidev/, new RegExp(TBR)],
		},
	},
	plugins: [
		vue(),
		{
			name: "slidev-modules-resolver",
			resolveId(source) {
				if (source.startsWith("/@slidev/")) return TBR + source;
			},
			generateBundle(_, bundles) {
				for (const bundle of Object.values(bundles)) {
					if (bundle.type === "chunk") {
						bundle.code = bundle.code.replace(new RegExp(TBR), "");
					}
				}
			},
		},
	],
});
