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
			tmpId: "https://www.youtube.com/watch?v=n-m0fh0mZXA",
			id: "",
		}),
	);

	const query = useQuery({
		enabled: !!form.data.id,
		queryKey: ["video-info", form.data.id],
		queryFn: async () => {
			const command = Command.create("yt-dlp", ["-j", form.data.id]);
			const output = await command.execute();
			return JSON.parse(output.stdout) as VideoInfo;
		},
	});

	return (
		<div className="flex flex-col gap-2 pt-4 w-full max-w-xl mx-auto">
			<form
				onSubmit={form.handleSubmit(() => {
					form.fields.id.onChange(form.data.tmpId);
				})}
			>
				<label className="flex flex-col gap-0.5">
					<span className="text-sm">Video ID or URL</span>
					<input {...form.fields.tmpId.props()} />
				</label>
			</form>
			{query.isLoading && <div className="p-2 mx-auto text-sm">Loading...</div>}
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
		<form
			className="flex flex-col gap-2"
			onSubmit={form.handleSubmit(() => {
				// TODO: download and process
			})}
		>
			{/* TODO: preview iframe */}
			{/* TODO: startTime/endTime */}
			<label className="flex flex-col gap-0.5">
				<span className="text-sm">Title</span>
				<input {...form.fields.title.props()} />
			</label>
			<label className="flex flex-col gap-0.5">
				<span className="text-sm">Artist</span>
				<input {...form.fields.artist.props()} />
			</label>
			<button>Download</button>
		</form>
	);
}
