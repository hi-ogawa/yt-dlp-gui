import { tinyassert } from "@hiogawa/utils";
import { parseJpeg } from "./jpeg";
import { BytesWriter, bytesFromString, bytesFromU32BE } from "./utils";

export interface ImageInfo {
	mimeType: string;
	width: number;
	height: number;
	depth: number;
	colors: number;
}

// default usage
// - jpeg input
// - cover art (pictureType = 3)
// - empty description
// - return base64 string
export function encode(data: Uint8Array): string {
	const info = parseJpeg(data);
	const encodedBin = encodeImpl(data, info, 3, "");
	return toBase64(encodedBin);
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
function toBase64(data: Uint8Array): string {
	return btoa(Array.from(data, (v) => String.fromCodePoint(v)).join(""));
}

function encodeImpl(
	data: Uint8Array,
	info: ImageInfo,
	pictureType: number,
	description: string,
): Uint8Array {
	// prettier-ignore
	const numBytes =
		// picture type
		4 +
		// mime type
		4 +
		info.mimeType.length +
		// description
		4 +
		description.length +
		// image info
		4 +
		4 +
		4 +
		4 +
		// data
		4 +
		data.length;
	tinyassert(numBytes < 2 ** 24);

	const writer = new BytesWriter(new Uint8Array(numBytes));

	writer.write(bytesFromU32BE(pictureType));

	writer.write(bytesFromU32BE(info.mimeType.length));
	writer.write(bytesFromString(info.mimeType));

	writer.write(bytesFromU32BE(description.length));
	writer.write(bytesFromString(description));

	writer.write(bytesFromU32BE(info.width));
	writer.write(bytesFromU32BE(info.height));
	writer.write(bytesFromU32BE(info.depth));
	writer.write(bytesFromU32BE(info.colors));

	writer.write(bytesFromU32BE(data.length));
	writer.write(data);

	return writer.data;
}
