import { type Result, x } from "tinyexec";
import { defineConfig } from "tsup";

let app: Result | undefined;

export default defineConfig([
	{
		entry: ["src/electron/main.ts", "src/electron/preload.ts"],
		external: ["electron"],
		format: ["cjs"],
		outDir: "dist/electron",
		define: {
			"import.meta.env.DEV": JSON.stringify(true),
		},
		plugins: [
			{
				name: "dev-app-start",
				async buildEnd() {
					if (process.env.START_APP) {
						app?.kill();
						app = x("pnpm", ["electron-start"]);
					}
				},
			},
		],
	},
]);
