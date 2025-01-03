import path from "node:path";
import { pathToFileURL } from "node:url";
import { exposeTinyRpc } from "@hiogawa/tiny-rpc";
import { BrowserWindow, app, ipcMain } from "electron";
import { RpcHandler } from "./rpc/server";
import { rpcServerAdapter } from "./rpc/utils";

async function main() {
	await app.whenReady();

	// setup window
	const dirname = app.getAppPath();
	const window = new BrowserWindow({
		webPreferences: {
			preload: path.join(dirname, "preload.cjs"),
		},
	});

	// setup rpc
	exposeTinyRpc({
		routes: new RpcHandler(window),
		adapter: rpcServerAdapter(ipcMain),
	});

	await window.loadURL(
		import.meta.env.DEV
			? "http://localhost:1420"
			: pathToFileURL(path.join(dirname, "../web/index.html")).href,
	);
}

main();
