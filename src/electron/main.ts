import path from "node:path";
import { BrowserWindow, app } from "electron";

async function main() {
	await app.whenReady();
	const window = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, "./preload.js"),
		},
	});
	await window.loadURL("http://localhost:1420");
}

main();
