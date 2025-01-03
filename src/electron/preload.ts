import { contextBridge, ipcRenderer } from "electron";

function main() {
	ipcRenderer;
	contextBridge.exposeInMainWorld("PRELOAD_API", {});
}

main();
