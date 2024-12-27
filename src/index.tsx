import { createTinyForm } from "@hiogawa/tiny-form";
import { TinyReactToastManager } from "@hiogawa/tiny-toast";
import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { Command } from "@tauri-apps/plugin-shell";
import React from "react";
import ReactDOMClient from "react-dom/client";

const toast = new TinyReactToastManager();

interface VideoInfo {
	id: string;
	channel: string;
	title: string;
	formats: VideoFormatInfo[];
}

interface VideoFormatInfo {
	format_id: string;
	format: string;
}

function App() {
	const form = createTinyForm(
		React.useState({
			tmpId: "n-m0fh0mZXA",
			id: "",
		}),
	);

	const query = useQuery({
		enabled: !!form.data.id,
		queryKey: ["video-info", form.data.id],
		queryFn: async () => {
			const command = Command.create("yt-dlp", [
				"-j",
				`https://www.youtube.com/watch?v=${form.data.id}`,
			]);
			const output = await command.execute();
			return JSON.parse(output.stdout) as VideoInfo;
		},
	});

	return (
		<div>
			<form
				onSubmit={form.handleSubmit(() => {
					form.fields.id.onChange(form.data.tmpId);
				})}
			>
				<input {...form.fields.tmpId.props()} />
			</form>
			{query.isLoading && "Loading..."}
			{query.isSuccess && <DownloadForm videoInfo={query.data} />}
		</div>
	);
}

function DownloadForm(props: { videoInfo: VideoInfo }) {
	const form = createTinyForm(
		React.useState({
			title: props.videoInfo.title,
			artist: props.videoInfo.channel,
			startTime: undefined as number | undefined,
			endTime: undefined as number | undefined,
		}),
	);

	return (
		<form onSubmit={form.handleSubmit(() => {})}>
			<label>
				Title
				<input {...form.fields.title.props()} />
			</label>
			<label>
				Artist
				<input {...form.fields.artist.props()} />
			</label>
			<button>Download</button>
		</form>
	);
}

function QueryClientWrapper(props: React.PropsWithChildren) {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
						refetchOnReconnect: false,
						retry: 0,
					},
					mutations: {
						onError: (error) => {
							console.error("mutation error", error);
							toast.error("Something went wrong...");
						},
					},
				},
				queryCache: new QueryCache({
					onError(error, _query) {
						console.error("query error", error);
						toast.error("Something went wrong...");
					},
				}),
			}),
	);
	return (
		<QueryClientProvider client={queryClient}>
			{props.children}
		</QueryClientProvider>
	);
}

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
