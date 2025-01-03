/** @type {import('electron-builder').Configuration} */
export default {
	directories: {
		output: "dist/builder",
	},
	files: ["dist/electron/**", "dist/web/**"],
	npmRebuild: false,
	linux: {
		target: "AppImage",
	},
};
