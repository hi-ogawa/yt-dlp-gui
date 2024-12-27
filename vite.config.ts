import react from "@vitejs/plugin-react";
import { presetUno } from "unocss";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
	clearScreen: false,
	plugins: [unocss({ presets: [presetUno()] }), react()],
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
}));
