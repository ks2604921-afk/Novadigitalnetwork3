// Client-safe storage catalog and validation rules. No secrets or provider SDKs here.

export type ProviderId = "s3" | "r2" | "firebase" | "mux" | "cloudinary";

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  kind: "Object storage" | "Video platform";
  description: string;
  /** Names of the project secrets the server adapter reads. Values never reach the browser. */
  secrets: string[];
  /** Provider can transcode / package itself (otherwise an external pipeline is needed). */
  processing: boolean;
};

export const STORAGE_PROVIDERS: ProviderInfo[] = [
  {
    id: "s3",
    name: "Amazon S3",
    kind: "Object storage",
    description: "Private bucket with presigned upload and playback links.",
    secrets: ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET", "S3_REGION"],
    processing: false,
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    kind: "Object storage",
    description: "S3-compatible storage with no download fees.",
    secrets: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
    processing: false,
  },
  {
    id: "firebase",
    name: "Firebase Storage",
    kind: "Object storage",
    description: "Google Cloud Storage bucket behind Firebase.",
    secrets: ["FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET", "FIREBASE_SERVICE_ACCOUNT_JSON"],
    processing: false,
  },
  {
    id: "mux",
    name: "Mux",
    kind: "Video platform",
    description: "Direct uploads, automatic HLS, thumbnails and signed playback.",
    secrets: ["MUX_TOKEN_ID", "MUX_TOKEN_SECRET", "MUX_SIGNING_KEY_ID", "MUX_SIGNING_PRIVATE_KEY"],
    processing: true,
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    kind: "Video platform",
    description: "Signed uploads with adaptive streaming profiles.",
    secrets: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    processing: true,
  },
];

export const PROVIDER_IDS = STORAGE_PROVIDERS.map((p) => p.id) as [ProviderId, ...ProviderId[]];

export function providerInfo(id: string | null | undefined) {
  return STORAGE_PROVIDERS.find((p) => p.id === id) ?? null;
}

/* ---------- Processing pipeline ---------- */
export const PROCESSING_JOBS = [
  { type: "transcode_360p", label: "360p" },
  { type: "transcode_480p", label: "480p" },
  { type: "transcode_720p", label: "720p" },
  { type: "transcode_1080p", label: "1080p" },
  { type: "transcode_2160p", label: "4K" },
  { type: "package_hls", label: "HLS" },
  { type: "package_dash", label: "DASH" },
  { type: "generate_thumbnail", label: "Thumbnail" },
] as const;
export type ProcessingJobType = (typeof PROCESSING_JOBS)[number]["type"];

/* ---------- File rules ---------- */
export const GB = 1024 ** 3;
export const MB = 1024 ** 2;

export const VIDEO_RULES = {
  extensions: ["mp4", "mov", "m4v", "mkv", "webm"],
  mimeTypes: ["video/mp4", "video/quicktime", "video/x-m4v", "video/x-matroska", "video/webm"],
  maxBytes: 20 * GB,
};

export const SUBTITLE_RULES = {
  extensions: ["vtt", "srt"],
  maxBytes: 2 * MB,
};

export function fileExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function formatBytes(n: number) {
  if (n >= GB) return `${(n / GB).toFixed(2)} GB`;
  if (n >= MB) return `${(n / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

export type FileCheck = { ok: true } | { ok: false; error: string };

export function validateVideoFile(f: { name: string; size: number; type: string }): FileCheck {
  const ext = fileExtension(f.name);
  if (!VIDEO_RULES.extensions.includes(ext))
    return { ok: false, error: `Unsupported format .${ext || "?"} — use ${VIDEO_RULES.extensions.join(", ")}` };
  // Browsers sometimes report an empty type for .mkv; extension check above still applies.
  if (f.type && !VIDEO_RULES.mimeTypes.includes(f.type))
    return { ok: false, error: `Unsupported file type ${f.type}` };
  if (f.size <= 0) return { ok: false, error: "File is empty" };
  if (f.size > VIDEO_RULES.maxBytes)
    return { ok: false, error: `File is ${formatBytes(f.size)} — the limit is ${formatBytes(VIDEO_RULES.maxBytes)}` };
  return { ok: true };
}

export function validateSubtitleFile(f: { name: string; size: number }): FileCheck {
  const ext = fileExtension(f.name);
  if (!SUBTITLE_RULES.extensions.includes(ext))
    return { ok: false, error: "Subtitles must be .vtt or .srt" };
  if (f.size <= 0) return { ok: false, error: "File is empty" };
  if (f.size > SUBTITLE_RULES.maxBytes)
    return { ok: false, error: `Subtitle file is ${formatBytes(f.size)} — the limit is ${formatBytes(SUBTITLE_RULES.maxBytes)}` };
  return { ok: true };
}

/** Guesses an episode number from names like "S01E04.mp4", "ep_12.mov" or "Episode 3.mp4". */
export function parseEpisodeNumber(name: string): number | null {
  const base = name.replace(/\.[^.]+$/, "");
  const m = base.match(/s\d{1,3}\s*e(\d{1,4})/i) ?? base.match(/(?:episode|ep|e)[\s._-]*(\d{1,4})/i) ?? base.match(/(\d{1,4})(?!.*\d)/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Private, provider-neutral object key. Never contains the user's original filename. */
export function buildStorageKey(input: {
  kind: "movie" | "episode" | "subtitle";
  showId: string;
  episodeId?: string | null;
  assetId: string;
  filename: string;
}) {
  const ext = fileExtension(input.filename) || "bin";
  const parts = ["nova", input.kind, input.showId];
  if (input.episodeId) parts.push(input.episodeId);
  parts.push(input.assetId, `original.${ext}`);
  return parts.join("/");
}
