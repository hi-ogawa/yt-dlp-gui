import path from "node:path";
import { pathToFileURL } from "node:url";
import { BrowserWindow, app } from "electron";

async function main() {
	await app.whenReady();
	const dirname = app.getAppPath();
	const window = new BrowserWindow({
		webPreferences: {
			preload: path.join(dirname, "preload.cjs"),
		},
	});
	await window.loadURL(
		import.meta.env.DEV
			? "http://localhost:1420"
			: pathToFileURL(path.join(dirname, "../web/index.html")).href,
	);
}

main();
