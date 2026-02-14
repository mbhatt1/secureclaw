// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { MEDIA_DEFAULTS } from "../config/defaults.unified.js";

export const MAX_IMAGE_BYTES = MEDIA_DEFAULTS.MAX_IMAGE_BYTES;
export const MAX_AUDIO_BYTES = MEDIA_DEFAULTS.MAX_AUDIO_BYTES;
export const MAX_VIDEO_BYTES = MEDIA_DEFAULTS.MAX_VIDEO_BYTES;
export const MAX_DOCUMENT_BYTES = MEDIA_DEFAULTS.MAX_DOCUMENT_BYTES;

export type MediaKind = "image" | "audio" | "video" | "document" | "unknown";

export function mediaKindFromMime(mime?: string | null): MediaKind {
  if (!mime) {
    return "unknown";
  }
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime === "application/pdf") {
    return "document";
  }
  if (mime.startsWith("application/")) {
    return "document";
  }
  return "unknown";
}

export function maxBytesForKind(kind: MediaKind): number {
  switch (kind) {
    case "image":
      return MAX_IMAGE_BYTES;
    case "audio":
      return MAX_AUDIO_BYTES;
    case "video":
      return MAX_VIDEO_BYTES;
    case "document":
      return MAX_DOCUMENT_BYTES;
    default:
      return MAX_DOCUMENT_BYTES;
  }
}
