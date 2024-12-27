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
