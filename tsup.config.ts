import { type Result, x } from "tinyexec";
import { defineConfig } from "tsup";

const dev = process.env["NODE_ENV"] === "development";
let app: Result | undefined;

export default defineConfig({
	entry: ["src/electron/main.ts", "src/electron/preload.ts"],
	format: ["cjs"], // preload needs to be cjs
	outDir: "dist/electron",
	define: {
		"import.meta.env.DEV": JSON.stringify(dev),
	},
	plugins: [
		{
			name: "dev-app-start",
			async buildEnd() {
				if (dev) {
					app?.kill();
					app = x("pnpm", ["electron-start"], {
						nodeOptions: {
							stdio: "inherit",
						},
					});
				}
			},
		},
	],
});
