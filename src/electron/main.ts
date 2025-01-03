import assert from "node:assert";
import { createServer } from "node:http";
import path from "node:path";
import { exposeTinyRpc } from "@hiogawa/tiny-rpc";
import { BrowserWindow, app, ipcMain } from "electron";
import sirv from "sirv";
import { RpcHandler } from "./rpc/server";
import { rpcServerAdapter } from "./rpc/utils";

async function main() {
	await app.whenReady();

	// setup window
	const window = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, "preload.cjs"),
		},
	});

	// setup rpc
	exposeTinyRpc({
		routes: new RpcHandler(window),
		adapter: rpcServerAdapter(ipcMain),
	});

	let windowUrl: string;
	if (import.meta.env.DEV) {
		// hard-coded dev server url
		windowUrl = "http://localhost:1420";
	} else {
		// serve static assets from localhost for youtube iframe
		// https://stackoverflow.com/questions/52856299/youtube-videos-not-played-in-electron-app-but-in-a-website-does
		const handler = sirv(path.join(__dirname, "../web"));
		const server = createServer((req, res) => {
			handler(req, res, () => {
				res.statusCode = 404;
				res.end("Not found");
			});
		});
		await new Promise<void>((resolve) => server.listen(() => resolve()));
		const address = server.address();
		assert(address);
		assert(typeof address !== "string");
		windowUrl = `http://localhost:${address.port}`;
	}
	await window.loadURL(windowUrl);
}

main();
