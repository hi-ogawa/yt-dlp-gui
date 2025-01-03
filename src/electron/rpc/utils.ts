import type {
	TinyRpcClientAdapter,
	TinyRpcServerAdapter,
} from "@hiogawa/tiny-rpc";
import type { ContextBridge, IpcMain, IpcRenderer } from "electron";

export function rpcServerAdapter(ipcMain: IpcMain): TinyRpcServerAdapter<void> {
	return {
		register: (invokeRoute) => {
			ipcMain.handle("__rpc", (_event, data) => invokeRoute(data));
		},
	};
}

export function rpcPreloadSetup(
	contextBridge: ContextBridge,
	ipcRenderer: IpcRenderer,
) {
	contextBridge.exposeInMainWorld("__RPC_API", {
		__rpc: (...args: any[]) => ipcRenderer.invoke("__rpc", ...args),
	});
}

export function rpcClientAdapter(): TinyRpcClientAdapter {
	return {
		send: (data) => {
			return (globalThis as any)["__RPC_API"].__rpc(data);
		},
	};
}
