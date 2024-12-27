import React from "react";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";
import { QueryClientWrapper } from "./utils/query";
import { toast } from "./utils/toast";

function main() {
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
