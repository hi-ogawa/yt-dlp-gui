import ReactDOMClient from "react-dom/client";

function Root() {
	return <div>Hello</div>;
}

function main() {
	const domRoot = document.getElementById("root")!;
	const reactRoot = ReactDOMClient.createRoot(domRoot);
	reactRoot.render(<Root />);
}

main();
