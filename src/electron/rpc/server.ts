import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { sortBy } from "@hiogawa/utils";
import { BrowserWindow, app, dialog } from "electron";
import * as flacPicture from "../../flac-picture";
import { fetchVideoMetadata, parseVideoId } from "../../utils/youtube";

// TODO
// verify ffmpeg is installed (or maybe bundle ffmpeg wasm)

export class RpcHandler {
	constructor(private window: BrowserWindow) {}

	async getVideoInfo(input: string) {
		const id = parseVideoId(input);
		const result = await fetchVideoMetadata(id);
		return result;
	}

	async download(data: {
		id: string;
		title: string;
		artist: string;
		album: string;
		startTime: string;
		endTime: string;
	}) {
		const result = await fetchVideoMetadata(data.id);

		const formats = sortBy(
			result.streamingData.adaptiveFormats.filter((format) =>
				format.mimeType.includes("audio/webm"),
			),
			(format) => -format.bitrate,
		);
		const format = formats[0];
		if (!format) {
			throw new Error("Audio data not available");
		}

		using dir = createTempDirectory();
		const tmpFile1 = dir.join("tmp.webm");
		const tmpFile2 = dir.join("tmp.opus");
		const metadataFile = dir.join("ffmetadata.txt");

		// download webm audio
		const audioResponse = await fetch(format.url, {
			headers: {
				// it looks like adding this trivial range header can make download a way faster
				range: `bytes=0-`,
			},
		});
		if (!audioResponse.ok || !audioResponse.body) {
			throw new Error("Failed to download audio data");
		}
		await fs.promises.writeFile(
			tmpFile1,
			Readable.fromWeb(audioResponse.body as any),
		);

		// download thumbnail
		const thumbnailUrl = `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`;
		const thumbnailResponse = await fetch(thumbnailUrl);
		if (!thumbnailResponse.ok || !thumbnailResponse.body) {
			throw new Error("Failed to download thumbnail");
		}

		// process thumbnail data
		const thumbnailData = await thumbnailResponse.bytes();
		const thumbnailDataFlac = flacPicture.encode(thumbnailData);

		// write ffmetadata file
		// https://ffmpeg.org/ffmpeg-formats.html#metadata
		const escapeValue = (s: string) => s.replace(/[=;#\\\n]/g, (c) => `\\${c}`);
		const { artist, title, album, startTime, endTime } = data;
		const metadataFileContent = [
			`;FFMETADATA1`,
			title && `title=${escapeValue(title)}`,
			artist && `artist=${escapeValue(artist)}`,
			album && `album=${escapeValue(album)}`,
			`METADATA_BLOCK_PICTURE=${escapeValue(thumbnailDataFlac)}`,
		]
			.filter(Boolean)
			.map((line) => line + "\n")
			.join("");
		await fs.promises.writeFile(metadataFile, metadataFileContent);

		// convert webm to opus with metadata
		await $(
			"ffmpeg",
			[
				"-hide_banner",
				"-y",
				["-i", tmpFile1],
				["-i", metadataFile],
				["-map_metadata", "1"],
				["-codec", "copy"],
				startTime && ["-ss", startTime],
				endTime && ["-to", endTime],
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

async function $(file: string, args: string[]) {
	const output = fs.createWriteStream(
		path.join(app.getPath("logs"), "main.log"),
		{ autoClose: false, flags: "a" },
	);
	using _ = { [Symbol.dispose]: () => output.close() };
	const proc = spawn(file, args);
	proc.stdout.pipe(output);
	proc.stderr.pipe(output);
	await new Promise<void>((resolve, reject) => {
		proc.on("error", (error) => {
			reject(makeError(error));
		});
		proc.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(makeError({ code }));
			}
		});
	});

	function makeError(cause: unknown) {
		return new Error(`Child process falure: ${[file, ...args].join(" ")}`, {
			cause,
		});
	}
}
