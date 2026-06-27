import { open } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const AUDIO_MIME_TYPES = new Set([
	"audio/wav",
	"audio/wave",
	"audio/x-wav",
	"audio/mpeg",
	"audio/mp3",
	"audio/flac",
	"audio/ogg",
	"audio/webm",
	"audio/mp4",
	"audio/x-m4a",
	"audio/aac",
]);

const FILE_TYPE_SNIFF_BYTES = 4100;

export async function detectSupportedImageMimeTypeFromFile(filePath: string): Promise<string | null> {
	return detectSupportedMimeTypeFromFile(filePath, IMAGE_MIME_TYPES);
}

export async function detectSupportedAudioMimeTypeFromFile(filePath: string): Promise<string | null> {
	return detectSupportedMimeTypeFromFile(filePath, AUDIO_MIME_TYPES);
}

async function detectSupportedMimeTypeFromFile(filePath: string, supportedMimeTypes: Set<string>): Promise<string | null> {
	const fileHandle = await open(filePath, "r");
	try {
		const buffer = Buffer.alloc(FILE_TYPE_SNIFF_BYTES);
		const { bytesRead } = await fileHandle.read(buffer, 0, FILE_TYPE_SNIFF_BYTES, 0);
		if (bytesRead === 0) {
			return null;
		}

		const fileType = await fileTypeFromBuffer(buffer.subarray(0, bytesRead));
		if (!fileType) {
			return null;
		}

		if (!supportedMimeTypes.has(fileType.mime)) {
			return null;
		}

		return fileType.mime;
	} finally {
		await fileHandle.close();
	}
}
