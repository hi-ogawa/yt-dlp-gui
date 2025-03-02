declare let YT: YoutubeIframeApi;

type YoutubeIframeApi = {
	ready: (callback: () => void) => void;
	Player: new (el: HTMLElement, options: YoutubePlayerOptions) => YoutubePlayer;
};

export interface YoutubePlayer {
	playVideo: () => void;
	pauseVideo: () => void;
	seekTo: (second: number) => void;
	getCurrentTime: () => number;
	getPlayerState: () => number;
	destroy: () => void;
}

type YoutubePlayerOptions = {
	videoId: string;
	height?: number;
	width?: number;
	playerVars?: {
		autoplay?: 0 | 1;
		start?: number; // must be integer
	};
	events?: {
		onReady?: () => void;
	};
};

export function loadYoutubePlayer(
	el: HTMLElement,
	options: YoutubePlayerOptions,
) {
	return new Promise<YoutubePlayer>((resolve) => {
		const player = new YT.Player(el, {
			...options,
			events: { onReady: () => resolve(player) },
		});
	});
}

export interface VideoInfo {
	id: string;
	channel: string;
	title: string;
	formats: VideoFormatInfo[];
}

interface VideoFormatInfo {
	format_id: string;
	format: string;
}

export function parseVideoId(value: string): string {
	if (value.length === 11) {
		return value;
	}
	if (value.match(/youtube\.com|youtu\.be/)) {
		try {
			const url = new URL(value);
			if (url.hostname === "youtu.be") {
				return url.pathname.substring(1);
			} else {
				const videoId = url.searchParams.get("v");
				if (videoId) {
					return videoId;
				}
			}
		} catch {}
	}
	throw new Error("Invalid Video URL");
}

export async function fetchVideoMetadata(
	videoId: string,
): Promise<VideoMetadata> {
	const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
		method: "POST",
		// based on
		// https://github.com/yt-dlp/yt-dlp/blob/79ec2fdff75c8c1bb89b550266849ad4dec48dd3/yt_dlp/extractor/youtube.py#L211
		body: JSON.stringify({
			videoId,
			context: {
				client: {
					clientName: "IOS",
					clientVersion: "19.45.4",
					deviceMake: "Apple",
					deviceModel: "iPhone16,2",
					userAgent:
						"com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)",
					osName: "iPhone",
					osVersion: "18.1.0.22B83",
					hl: "en",
					timeZokne: "UTC",
					utcOffsetMinutes: 0,
				},
			},
			playbackContext: {
				contentPlaybackContext: {
					html5Preference: "HTML5_PREF_WANTS",
					signatureTimestamp: 20073,
				},
			},
			contentCheckOk: true,
			racyCheckOk: true,
		}),
		headers: {
			"X-YouTube-Client-Name": "5",
			"X-YouTube-Client-Version": "19.45.4",
			Origin: "https://www.youtube.com",
			"User-Agent":
				"com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)",
			"content-type": "application/json",
			"X-Goog-Visitor-Id": "CgtwU3N6UXVjakdWbyi94bi7BjIKCgJKUBIEGgAgUQ%3D%3D",
		},
	});
	if (res.ok) {
		const result: VideoMetadata = await res.json();
		if (result.playabilityStatus.status === "OK") {
			return result;
		}
	}
	throw new Error("Invalid Video URL");
}

export interface VideoMetadata {
	videoDetails: {
		videoId: string;
		title: string;
		author: string;
		channelId: string;
	};
	playabilityStatus: {
		status: string;
		playableInEmbed: boolean;
	};
	streamingData: {
		adaptiveFormats: {
			itag: number;
			url: string;
			mimeType: string;
			width?: number;
			height?: number;
			contentLength: number;
			bitrate: number;
		}[];
	};
}

export function fetchByRanges(
	url: string,
	totalSize: number,
	chunkSize: number,
): ReadableStream<Uint8Array> {
	const numChunks = Math.ceil(totalSize / chunkSize);
	return new ReadableStream({
		async start(controller) {
			for (let i = 0; i < numChunks; i++) {
				const start = i * chunkSize;
				const end = Math.min(totalSize, (i + 1) * chunkSize) - 1;
				const range = `bytes=${start}-${end}`;
				const response = await fetch(url, {
					headers: {
						range,
					},
				});
				if (!response.ok || !response.body) {
					throw new Error(
						`Fetch range failed (status: ${response.status}, range: ${range})`,
					);
				}
				for await (const data of response.body) {
					controller.enqueue(data);
				}
			}
			controller.close();
		},
	});
}
