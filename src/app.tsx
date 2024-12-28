import { createTinyForm } from "@hiogawa/tiny-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as path from "@tauri-apps/api/path";
import * as dialog from "@tauri-apps/plugin-dialog";
import * as tauriFs from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import React from "react";
import * as flacPicture from "./flac-picture";
import { formatTimestamp, parseTimestamp } from "./utils/time";
import { toast } from "./utils/toast";
import { type YoutubePlayer, loadYoutubePlayer } from "./utils/youtube";

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
			tmpId: "https://www.youtube.com/watch?v=pg8UiEMGY4w",
			id: "",
		}),
	);

	const query = useQuery({
		enabled: !!form.data.id,
		queryKey: ["video-info", form.data.id],
		queryFn: async () => {
			const command = Command.sidecar("binaries/yt-dlp", ["-j", form.data.id]);
			const output = await command.execute();
			if (output.code !== 0) {
				throw new Error(output.stderr);
			}
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
			album: "",
			startTime: "",
			endTime: "",
		}),
	);
	const [player, setPlayer] = React.useState<YoutubePlayer>();

	const downloadMutation = useMutation({
		mutationFn: async () => {
			// TODO: stream command log (at least to the console)

			// download webm via yt-dlp
			const tempDir = await path.tempDir();
			const tmpFile1 = await path.join(tempDir, "yt-dlp-gui-tmp.webm");
			const tmpFile2 = await path.join(tempDir, "yt-dlp-gui-tmp.opus");
			const thumbnailFile = await path.join(tempDir, "yt-dlp-gui-tmp.jpg");
			const output1 = await Command.sidecar("binaries/yt-dlp", [
				videoInfo.id,
				"-f",
				"ba[ext=webm]",
				"-o",
				tmpFile1,
				"--write-thumbnail",
				"--convert-thumbnails",
				"jpg",
			]).execute();
			if (output1.code !== 0) {
				throw new Error(output1.stderr);
			}

			// process thumbnail data
			const thumbnailData = await tauriFs.readFile(thumbnailFile);
			const thumbnailDataFlac = flacPicture.encode(thumbnailData);

			// convert webm to opus
			const { artist, title, album, startTime, endTime } = form.data;
			const output2 = await Command.create(
				"ffmpeg",
				[
					"-hide_banner",
					"-y",
					["-i", tmpFile1],
					title && ["-metadata", `title=${title}`],
					artist && ["-metadata", `artist=${artist}`],
					album && ["-metadata", `album=${album}`],
					startTime && ["-ss", startTime],
					endTime && ["-to", endTime],
					["-metadata", `METADATA_BLOCK_PICTURE=${thumbnailDataFlac}`],
					tmpFile2,
				]
					.flat()
					.filter(Boolean),
			).execute();
			if (output2.code !== 0) {
				throw new Error(output2.stderr);
			}

			const downloadDir = await path.downloadDir();
			const defaultFilename =
				([artist, album, title].filter(Boolean).join(" - ") || "download") +
				".opus";
			const defaultOutputPath = await path.join(downloadDir, defaultFilename);
			const outputPath = await dialog.save({ defaultPath: defaultOutputPath });
			if (outputPath) {
				await tauriFs.copyFile(tmpFile2, outputPath);
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
