import { proxyTinyRpc } from "@hiogawa/tiny-rpc";
import type { RpcHandler } from "./server";
import { rpcClientAdapter } from "./utils";

export const rpc = proxyTinyRpc<RpcHandler>({
	adapter: rpcClientAdapter(),
});
