import { createTinyForm } from "@hiogawa/tiny-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { rpc } from "./electron/rpc/client";
import { formatTimestamp, parseTimestamp } from "./utils/time";
import { toast } from "./utils/toast";
import {
	type VideoInfo,
	type YoutubePlayer,
	loadYoutubePlayer,
} from "./utils/youtube";

export function App() {
	const form = createTinyForm(
		React.useState({
			tmpId: import.meta.env.DEV
				? "https://www.youtube.com/watch?v=aS0Id3EJb4k"
				: "",
			id: "",
		}),
	);

	const query = useQuery({
		enabled: !!form.data.id,
		queryKey: ["video-info", form.data.id],
		queryFn: async () => {
			return rpc.getVideoInfo(form.data.id);
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
			album: "",
			startTime: "",
			endTime: "",
		}),
	);
	const [player, setPlayer] = React.useState<YoutubePlayer>();

	const downloadMutation = useMutation({
		mutationFn: async () => {
			const saved = await rpc.download({
				id: videoInfo.id,
				...form.data,
			});
			if (saved) {
				toast.success("Successfully downloaded :)");
			}
		},
		onError(error) {
			console.error(error);
			toast.error("Failed to download :(");
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
						type="button"
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
						type="button"
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
						type="button"
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
						type="button"
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
