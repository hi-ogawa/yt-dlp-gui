import { createTinyForm } from "@hiogawa/tiny-form";
import { useQuery } from "@tanstack/react-query";
import { Command } from "@tauri-apps/plugin-shell";
import React from "react";

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

export function App() {
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
