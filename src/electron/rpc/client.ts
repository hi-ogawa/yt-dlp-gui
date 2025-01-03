import { proxyTinyRpc } from "@hiogawa/tiny-rpc";
import type { rpcRoutes } from "./server";
import { rpcClientAdapter } from "./utils";

export const rpc = proxyTinyRpc<typeof rpcRoutes>({
	adapter: rpcClientAdapter(),
});
