import type { AudioContent, AudioFormat } from "../types.js";

const MIME_TO_FORMAT: Record<string, AudioFormat> = {
	"audio/wav": "wav",
	"audio/wave": "wav",
	"audio/x-wav": "wav",
	"audio/mpeg": "mp3",
	"audio/mp3": "mp3",
	"audio/flac": "flac",
	"audio/ogg": "ogg",
	"audio/webm": "webm",
	"audio/mp4": "m4a",
	"audio/x-m4a": "m4a",
	"audio/aac": "aac",
};

export function audioFormatFromMimeType(mimeType: string): AudioFormat | undefined {
	return MIME_TO_FORMAT[mimeType.toLowerCase()];
}

export function resolveAudioFormat(audio: AudioContent): AudioFormat | undefined {
	return audio.format ?? audioFormatFromMimeType(audio.mimeType);
}

export function resolveOpenAIAudioFormat(audio: AudioContent): "wav" | "mp3" {
	const format = resolveAudioFormat(audio);
	if (format === "wav" || format === "mp3") return format;
	throw new Error(`OpenAI audio input only supports wav/mp3, got ${audio.mimeType}`);
}
