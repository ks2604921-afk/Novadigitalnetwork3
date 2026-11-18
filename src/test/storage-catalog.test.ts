import { describe, expect, it } from "vitest";
import { GB, MB, buildStorageKey, parseEpisodeNumber, validateSubtitleFile, validateVideoFile } from "@/lib/storage/catalog";

describe("video file rules", () => {
  it("accepts an mp4 under 20 GB", () => {
    expect(validateVideoFile({ name: "movie.mp4", size: 5 * GB, type: "video/mp4" }).ok).toBe(true);
  });
  it("rejects files over 20 GB", () => {
    expect(validateVideoFile({ name: "movie.mp4", size: 20 * GB + 1, type: "video/mp4" }).ok).toBe(false);
  });
  it("rejects non-video formats", () => {
    expect(validateVideoFile({ name: "poster.jpg", size: 1000, type: "image/jpeg" }).ok).toBe(false);
  });
});

describe("subtitle file rules", () => {
  it("accepts .srt and .vtt up to 2 MB", () => {
    expect(validateSubtitleFile({ name: "hi.srt", size: 2 * MB }).ok).toBe(true);
    expect(validateSubtitleFile({ name: "hi.vtt", size: 1000 }).ok).toBe(true);
  });
  it("rejects subtitles over 2 MB or other formats", () => {
    expect(validateSubtitleFile({ name: "hi.srt", size: 2 * MB + 1 }).ok).toBe(false);
    expect(validateSubtitleFile({ name: "hi.txt", size: 10 }).ok).toBe(false);
  });
});

describe("bulk episode matching", () => {
  it("reads episode numbers from common file names", () => {
    expect(parseEpisodeNumber("Show_S01E04.mp4")).toBe(4);
    expect(parseEpisodeNumber("ep-12.mov")).toBe(12);
    expect(parseEpisodeNumber("Episode 3.mkv")).toBe(3);
  });
});

describe("storage keys", () => {
  it("never include the original file name", () => {
    const key = buildStorageKey({ kind: "episode", showId: "s", episodeId: "e", assetId: "a", filename: "My Secret Cut.MP4" });
    expect(key).toBe("nova/episode/s/e/a/original.mp4");
  });
});
