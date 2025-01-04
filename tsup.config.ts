import { ChildProcess, spawn } from "node:child_process";
import { defineConfig } from "tsup";

const dev = process.env["NODE_ENV"] === "development";
let app: ChildProcess | undefined;

export default defineConfig({
	entry: ["src/electron/main.ts", "src/electron/preload.ts"],
	format: ["cjs"], // preload needs to be cjs
	outDir: "dist/electron",
	external: ["electron"],
	define: {
		"import.meta.env.DEV": JSON.stringify(dev),
	},
	esbuildOptions: (options) => {
		options.target = "es2022";
	},
	plugins: [
		{
			name: "dev-app-start",
			async buildEnd() {
				if (dev) {
					app?.kill();
					app = spawn("pnpm", ["electron-start"], {
						stdio: "inherit",
					});
				}
			},
		},
	],
});
