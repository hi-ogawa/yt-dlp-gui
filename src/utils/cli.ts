import { fetchVideoMetadata } from "./youtube.ts";

// node --experimental-strip-types ./src/utils/cli.ts

async function main() {
	const videoId = process.argv[2] || "ZbO9PBdFRdc";
	const result = await fetchVideoMetadata(videoId);
	console.log(result);
}

main();
