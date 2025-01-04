import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { BrowserWindow, app, dialog } from "electron";
import * as flacPicture from "../../flac-picture";
import type { VideoInfo } from "../../utils/youtube";

// TODO: verify yt-dlp, ffmpeg is installed
// TODO: stream command log
// TODO: error handling

const $ = promisify(execFile);

export class RpcHandler {
	constructor(private window: BrowserWindow) {}

	async getVideoInfo(id: string) {
		using dir = createTempDirectory();
		const outfileArg = dir.join("tmp");
		const outfile = dir.join("tmp.info.json");
		await $("yt-dlp", [
			id,
			"--no-playlist",
			"--skip-download",
			"--write-info-json",
			"-o",
			outfileArg,
		]);
		const data = await fs.promises.readFile(outfile, "utf-8");
		return JSON.parse(data) as VideoInfo;
	}

	async download(data: {
		id: string;
		title: string;
		artist: string;
		album: string;
		startTime: string;
		endTime: string;
	}) {
		using dir = createTempDirectory();
		const tmpFile1 = dir.join("tmp.webm");
		const tmpFile2 = dir.join("tmp.opus");
		const thumbnailFile = dir.join("tmp.jpg");

		// download webm audio and thumbnail via yt-dlp
		await $("yt-dlp", [
			data.id,
			"--no-playlist",
			"-f",
			"ba[ext=webm]",
			"-o",
			tmpFile1,
			"--write-thumbnail",
			"--convert-thumbnails",
			"jpg",
		]);

		// process thumbnail data
		const thumbnailData = await fs.promises.readFile(thumbnailFile);
		const thumbnailDataFlac = flacPicture.encode(thumbnailData);

		// convert webm to opus with metadata
		const { artist, title, album, startTime, endTime } = data;
		await $(
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
		);

		const downloadDir = app.getPath("downloads");
		const defaultFilename =
			([artist, album, title].filter(Boolean).join(" - ") || "download") +
			".opus";
		const defaultOutputPath = path.join(downloadDir, defaultFilename);

		const dialogResult = await dialog.showSaveDialog(this.window, {
			defaultPath: defaultOutputPath,
		});
		if (dialogResult.filePath) {
			await fs.promises.copyFile(tmpFile2, dialogResult.filePath);
			return true;
		}
		return false;
	}
}

function createTempDirectory() {
	const dir = path.join(
		app.getPath("temp"),
		`yt-dlp-gui-${Math.random().toString(36).slice(2)}`,
	);
	fs.mkdirSync(dir, { recursive: true });
	return {
		join: (...args: string[]) => path.join(dir, ...args),
		[Symbol.dispose]: () => {
			fs.rmSync(dir, { recursive: true, force: true });
		},
	};
}
