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
		const result = await $("yt-dlp", ["--no-playlist", "-j", id]);
		return JSON.parse(result.stdout) as VideoInfo;
	}

	async download(data: {
		id: string;
		title: string;
		artist: string;
		album: string;
		startTime: string;
		endTime: string;
	}) {
		// download webm audio and thumbnail via yt-dlp
		const tmpDir = path.join(
			app.getPath("temp"),
			`yt-dlp-gui-${Math.random().toString(36).slice(2)}`,
		);
		using _ = setupTempDirectory(tmpDir);
		const tmpFile1 = path.join(tmpDir, "tmp.webm");
		const tmpFile2 = path.join(tmpDir, "tmp.opus");
		const thumbnailFile = path.join(tmpDir, "tmp.jpg");
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

function setupTempDirectory(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
	return {
		[Symbol.dispose]: () => {
			fs.rmSync(dir, { recursive: true, force: true });
		},
	};
}
