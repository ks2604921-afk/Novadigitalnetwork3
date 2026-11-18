import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Film, RotateCcw, Trash2, UploadCloud, X } from "lucide-react";
import {
  completeVideoUpload,
  failVideoUpload,
  listSeasonEpisodes,
  listUploadTargets,
  requestVideoUpload,
} from "@/lib/media.functions";
import { VIDEO_RULES, formatBytes, parseEpisodeNumber, validateVideoFile } from "@/lib/storage/catalog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, StatusBadge, StorageNotice, formatDuration, readVideoMeta, uploadToSignedUrl, useStorageOverview } from "./shared";

type Mode = "movie" | "episode" | "bulk";
type ItemStatus = "ready" | "invalid" | "requesting" | "uploading" | "uploaded" | "failed" | "blocked";
type Item = {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  progress: number;
  message?: string | undefined;
  episodeId?: string | undefined;
  meta?: { duration: number | null; width: number | null; height: number | null };
};

export function UploadCenter() {
  const qc = useQueryClient();
  const { data: overview } = useStorageOverview();
  const fetchTargets = useServerFn(listUploadTargets);
  const fetchEpisodes = useServerFn(listSeasonEpisodes);
  const request = useServerFn(requestVideoUpload);
  const complete = useServerFn(completeVideoUpload);
  const fail = useServerFn(failVideoUpload);

  const [mode, setMode] = useState<Mode>("movie");
  const [showId, setShowId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [episodeId, setEpisodeId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: targets = [] } = useQuery({ queryKey: ["admin", "upload-targets"], queryFn: () => fetchTargets() });
  const { data: episodes = [] } = useQuery({
    queryKey: ["admin", "season-episodes", seasonId],
    queryFn: () => fetchEpisodes({ data: { seasonId } }),
    enabled: !!seasonId,
  });

  const movies = targets.filter((t) => t.content_type !== "series" && t.content_type !== "serial");
  const series = targets.filter((t) => t.content_type === "series" || t.content_type === "serial");
  const show = targets.find((t) => t.id === showId);
  const uploadsAvailable = !!overview?.uploadsAvailable;

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.previewUrl)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  // Bulk: auto-match files to episodes by the number in their name.
  useEffect(() => {
    if (mode !== "bulk" || !episodes.length) return;
    setItems((list) =>
      list.map((i) => {
        if (i.episodeId) return i;
        const n = parseEpisodeNumber(i.file.name);
        const ep = episodes.find((e) => e.episode_number === n);
        return ep ? { ...i, episodeId: ep.id } : i;
      }),
    );
  }, [episodes, mode]);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const next = (mode === "bulk" ? list : list.slice(0, 1)).map<Item>((file) => {
      const check = validateVideoFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: check.ok ? "ready" : "invalid",
        progress: 0,
        message: check.ok ? undefined : check.error,
      };
    });
    next.forEach((it) => it.status === "ready" && readVideoMeta(it.previewUrl).then((meta) => patch(it.id, { meta })));
    setItems((prev) => {
      if (mode !== "bulk") prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return mode === "bulk" ? [...prev, ...next] : next;
    });
  }

  function remove(id: string) {
    setItems((list) => {
      const it = list.find((i) => i.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return list.filter((i) => i.id !== id);
    });
  }

  function targetFor(it: Item) {
    if (mode === "movie") return showId ? ({ kind: "movie", showId } as const) : null;
    const ep = mode === "episode" ? episodeId : it.episodeId;
    return ep ? ({ kind: "episode", episodeId: ep } as const) : null;
  }

  async function uploadOne(it: Item) {
    const target = targetFor(it);
    if (!target) return patch(it.id, { status: "failed", message: "Choose where this video belongs first" });
    patch(it.id, { status: "requesting", progress: 0, message: undefined });
    let assetId: string | null = null;
    try {
      const r = await request({
        data: {
          target,
          filename: it.file.name,
          mimeType: it.file.type,
          sizeBytes: it.file.size,
          durationSeconds: it.meta?.duration ?? null,
          width: it.meta?.width ?? null,
          height: it.meta?.height ?? null,
        },
      });
      if (!r.ok) return patch(it.id, { status: "blocked", message: r.reason });
      assetId = r.assetId;
      patch(it.id, { status: "uploading" });
      await uploadToSignedUrl(it.file, r.upload, (progress) => patch(it.id, { progress }));
      await complete({ data: { assetId } });
      patch(it.id, { status: "uploaded", progress: 100 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      if (assetId) await fail({ data: { assetId, message } }).catch(() => undefined);
      patch(it.id, { status: "failed", message });
    } finally {
      qc.invalidateQueries({ queryKey: ["admin"] });
    }
  }

  const startAll = useMutation({
    mutationFn: async () => {
      for (const it of items.filter((i) => i.status === "ready" || i.status === "failed" || i.status === "blocked")) {
        await uploadOne(it);
      }
    },
  });

  const replacing =
    mode === "movie" ? !!show?.video_asset_id : mode === "episode" ? !!episodes.find((e) => e.id === episodeId)?.video_asset_id : false;
  const preview = items.find((i) => i.id === previewId) ?? items.find((i) => i.status !== "invalid");
  const pending = items.filter((i) => ["ready", "failed", "blocked"].includes(i.status));
  const missingTarget = mode === "movie" ? !showId : mode === "episode" ? !episodeId : items.some((i) => i.status === "ready" && !i.episodeId);

  return (
    <div className="space-y-5">
      <StorageNotice />

      <div className="flex flex-wrap gap-2">
        {([
          ["movie", "Movie"],
          ["episode", "Single episode"],
          ["bulk", "Bulk episodes"],
        ] as const).map(([m, label]) => (
          <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => { setMode(m); setItems([]); setShowId(""); setSeasonId(""); setEpisodeId(""); }}>
            {label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-3">
        <Field label={mode === "movie" ? "Movie" : "Web series"}>
          <Select value={showId} onValueChange={(v) => { setShowId(v); setSeasonId(""); setEpisodeId(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose a title" /></SelectTrigger>
            <SelectContent>
              {(mode === "movie" ? movies : series).map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {mode !== "movie" && (
          <Field label="Season" hint={show && !show.seasons.length ? "Add a season in the Episodes tab first" : undefined}>
            <Select value={seasonId} onValueChange={(v) => { setSeasonId(v); setEpisodeId(""); }} disabled={!show}>
              <SelectTrigger><SelectValue placeholder="Choose a season" /></SelectTrigger>
              <SelectContent>
                {show?.seasons.map((s) => <SelectItem key={s.id} value={s.id}>Season {s.season_number}{s.title ? ` · ${s.title}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        )}
        {mode === "episode" && (
          <Field label="Episode">
            <Select value={episodeId} onValueChange={setEpisodeId} disabled={!seasonId}>
              <SelectTrigger><SelectValue placeholder="Choose an episode" /></SelectTrigger>
              <SelectContent>
                {episodes.map((e) => <SelectItem key={e.id} value={e.id}>E{e.episode_number} · {e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        )}
        {replacing && (
          <p className="text-sm text-muted-foreground md:col-span-3">
            This title already has a video. A new upload replaces it once it finishes; the old file stays listed as replaced.
          </p>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-nova-accent bg-nova-accent/5" : "border-border hover:border-muted-foreground"}`}
      >
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">{mode === "bulk" ? "Drop episode files here" : "Drop a video file here"}</p>
          <p className="text-sm text-muted-foreground">
            or click to browse · {VIDEO_RULES.extensions.join(", ")} · up to {formatBytes(VIDEO_RULES.maxBytes)}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={mode === "bulk"}
          accept={VIDEO_RULES.extensions.map((e) => `.${e}`).join(",")}
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {items.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className={`rounded-xl border bg-card p-4 ${previewId === it.id ? "border-nova-accent" : "border-border"}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => setPreviewId(it.id)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted" aria-label="Preview">
                    <Film className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(it.file.size)}
                      {it.meta?.height ? ` · ${it.meta.width}×${it.meta.height}` : ""}
                      {it.meta?.duration ? ` · ${formatDuration(it.meta.duration)}` : ""}
                    </p>
                    {mode === "bulk" && it.status !== "invalid" && (
                      <div className="mt-2 max-w-xs">
                        <Select value={it.episodeId ?? ""} onValueChange={(v) => patch(it.id, { episodeId: v })} disabled={!seasonId}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Match to episode" /></SelectTrigger>
                          <SelectContent>
                            {episodes.map((e) => <SelectItem key={e.id} value={e.id}>E{e.episode_number} · {e.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {it.message && <p className={`mt-2 text-xs ${it.status === "invalid" || it.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{it.message}</p>}
                    {(it.status === "uploading" || it.status === "uploaded") && <Progress value={it.progress} className="mt-2 h-1.5" />}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <StatusBadge status={it.status === "invalid" ? "failed" : it.status === "blocked" ? "not_configured" : it.status} />
                    {(it.status === "failed" || it.status === "blocked") && (
                      <Button size="icon" variant="ghost" aria-label="Retry" disabled={!uploadsAvailable} onClick={() => uploadOne(it)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {it.status !== "uploading" && it.status !== "requesting" && (
                      <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(it.id)}>
                        {it.status === "uploaded" ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!uploadsAvailable || !pending.length || missingTarget || startAll.isPending} onClick={() => startAll.mutate()}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {uploadsAvailable ? `Upload ${pending.length || ""} file${pending.length === 1 ? "" : "s"}` : "Uploading unavailable"}
              </Button>
              {missingTarget && <p className="text-xs text-muted-foreground">Choose where each video belongs first.</p>}
            </div>
          </div>

          {preview && (
            <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview (from your device)</p>
              <video key={preview.id} src={preview.previewUrl} controls className="aspect-video w-full rounded-xl bg-muted" />
              <p className="truncate text-sm">{preview.file.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
