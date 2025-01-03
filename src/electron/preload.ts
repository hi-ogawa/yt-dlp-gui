import { contextBridge, ipcRenderer } from "electron";

function main() {
	contextBridge.exposeInMainWorld("PRELOAD_API", {
		// doThing: () => ipcRenderer.send("do-a-thing"),
	});
}

main();
