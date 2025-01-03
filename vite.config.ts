import react from "@vitejs/plugin-react";
import { presetUno } from "unocss";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig(async () => ({
	clearScreen: false,
	plugins: [unocss({ presets: [presetUno()] }), react()],
	build: {
		outDir: "dist/web",
	},
	server: {
		port: 1420,
		strictPort: true,
	},
}));
