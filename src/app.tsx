import { createTinyForm } from "@hiogawa/tiny-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Command } from "@tauri-apps/plugin-shell";
import React from "react";
import { formatTimestamp, parseTimestamp } from "./utils/time";
import { toast } from "./utils/toast";
import { type YoutubePlayer, loadYoutubePlayer } from "./utils/youtube-iframe";

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
		<div className="flex flex-col gap-2 pt-4 w-full max-w-lg mx-auto">
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

function DownloadForm({ videoInfo }: { videoInfo: VideoInfo }) {
	const form = createTinyForm(
		React.useState({
			title: videoInfo.title,
			artist: videoInfo.channel,
			startTime: "",
			endTime: "",
		}),
	);
	const [player, setPlayer] = React.useState<YoutubePlayer>();

	const downloadMutation = useMutation({
		mutationFn: async () => {
			// TODO
			// - download audio (yt-dlp <id> -f 'ba[ext=webm]' -o 'tmp.webm')
			// - convert to opus,
			//   crop by startTime/endTime,
			//   add metadata
			//   (ffmpeg -i tmp.webm -ss startTime -to endTime -metadata title="xxx" -metadata artist="yyy" -metadata METADATA_BLOCK_PICTURE="zzz" tmp.opus)
			// - file save dialog
			await new Promise(() => {});
		},
		onError(error) {
			console.error(error);
			toast.error("Failed to download :(");
		},
		onSuccess() {
			toast.error("Successfully downloaded :)");
		},
	});

	return (
		<form
			className="flex flex-col gap-2"
			onSubmit={form.handleSubmit(() => downloadMutation.mutate())}
		>
			<div className="relative w-full aspect-video overflow-hidden">
				<div
					ref={(el) => {
						if (!el) return;
						(async () => {
							try {
								const player = await loadYoutubePlayer(el!, {
									videoId: videoInfo.id,
								});
								setPlayer(player);
							} catch (e) {
								console.error(e);
								toast.error("Failed to load video");
							}
						})();
					}}
					className="absolute w-full h-full"
				/>
			</div>
			<label className="flex flex-col gap-0.5">
				<span className="text-sm">Title</span>
				<input {...form.fields.title.props()} />
			</label>
			<label className="flex flex-col gap-0.5">
				<span className="text-sm">Artist</span>
				<input {...form.fields.artist.props()} />
			</label>
			<label className="flex flex-col gap-0.5">
				<div className="flex items-center gap-0.5">
					<span className="text-sm min-w-16">Start time</span>
					<button
						className="p-0 px-1 text-xs"
						onClick={() => {
							if (player) {
								form.fields.startTime.onChange(
									formatTimestamp(player.getCurrentTime()),
								);
							}
						}}
					>
						use current time
					</button>
					<button
						className="p-0 px-1 text-xs"
						onClick={() => {
							if (player && form.data.startTime) {
								player.seekTo(parseTimestamp(form.data.startTime));
							}
						}}
					>
						seek
					</button>
				</div>
				<input {...form.fields.startTime.props()} />
			</label>
			<label className="flex flex-col gap-0.5">
				<div className="flex items-center gap-0.5">
					<span className="text-sm min-w-16">End time</span>
					<button
						className="p-0 px-1 text-xs"
						onClick={() => {
							if (player) {
								form.fields.endTime.onChange(
									formatTimestamp(player.getCurrentTime()),
								);
							}
						}}
					>
						use current time
					</button>
					<button
						className="p-0 px-1 text-xs"
						onClick={() => {
							if (player && form.data.startTime) {
								player.seekTo(parseTimestamp(form.data.endTime));
							}
						}}
					>
						seek
					</button>
				</div>
				<input {...form.fields.endTime.props()} />
			</label>
			<button disabled={downloadMutation.isPending}>
				{downloadMutation.isPending ? "Downloading..." : "Download"}
			</button>
		</form>
	);
}
