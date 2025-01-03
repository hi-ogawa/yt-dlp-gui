import "virtual:uno.css";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";
import { rpc } from "./electron/rpc/client";
import { QueryClientWrapper } from "./utils/query";
import { toast } from "./utils/toast";

function main() {
	Object.assign(globalThis, { rpc });

	const domRoot = document.getElementById("root")!;
	const reactRoot = ReactDOMClient.createRoot(domRoot);
	const root = (
		<React.StrictMode>
			<QueryClientWrapper>
				<App />
			</QueryClientWrapper>
		</React.StrictMode>
	);
	toast.render();
	reactRoot.render(root);
}

main();
