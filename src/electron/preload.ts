import { contextBridge, ipcRenderer } from "electron";
import { rpcPreloadSetup } from "./rpc/utils";

rpcPreloadSetup(contextBridge, ipcRenderer);
