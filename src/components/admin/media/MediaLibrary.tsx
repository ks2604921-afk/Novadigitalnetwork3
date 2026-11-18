import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Play } from "lucide-react";
import { getAssetPlayback, listMediaAssets } from "@/lib/media.functions";
import { PROCESSING_JOBS, formatBytes, providerInfo } from "@/lib/storage/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, formatDuration } from "./shared";

export function MediaLibrary() {
  const fetchAssets = useServerFn(listMediaAssets);
  const playback = useServerFn(getAssetPlayback);
  const { data: assets = [], isLoading } = useQuery({ queryKey: ["admin", "media"], queryFn: () => fetchAssets() });
  const [open, setOpen] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ title: string; url: string } | null>(null);

  async function preview(id: string, title: string) {
    const r = await playback({ data: { assetId: id } });
    if (!r.ok) {
      toast.error(r.reason);
      return;
    }
    setPlayer({ title, url: r.url });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading media…</p>;
  if (!assets.length)
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No video files yet. Files appear here once a storage provider is connected and an upload starts.
      </div>
    );

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">File</th>
              <th className="p-3">Linked to</th>
              <th className="p-3">Size</th>
              <th className="p-3">Details</th>
              <th className="p-3">Upload</th>
              <th className="p-3">Processing</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <Fragment key={a.id}>
                <tr className="border-t border-border">
                  <td className="p-3">
                    <p className="max-w-[220px] truncate font-medium">{a.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {providerInfo(a.provider_id)?.name ?? "No provider"} · {new Date(a.created_at).toLocaleDateString()}
                      {!a.is_current && a.upload_status === "uploaded" ? " · replaced" : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    <p>{a.show?.title ?? "—"}</p>
                    {a.episode && <p className="text-xs text-muted-foreground">Ep {a.episode.episode_number} · {a.episode.title}</p>}
                  </td>
                  <td className="p-3">{formatBytes(a.file_size_bytes)}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {a.height ? `${a.width}×${a.height}` : "—"} · {formatDuration(a.duration_seconds)}
                    <br />{a.mime_type}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={a.upload_status} />
                    {a.error_message && <p className="mt-1 max-w-[200px] text-xs text-destructive">{a.error_message}</p>}
                  </td>
                  <td className="p-3"><StatusBadge status={a.processing_status} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Preview" disabled={a.upload_status !== "uploaded"} onClick={() => preview(a.id, a.original_filename)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Processing steps" onClick={() => setOpen(open === a.id ? null : a.id)}>
                        <ChevronDown className={`h-4 w-4 transition ${open === a.id ? "rotate-180" : ""}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
                {open === a.id && (
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={7} className="p-4">
                      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
                        {PROCESSING_JOBS.map((j) => {
                          const job = a.jobs.find((x) => x.job_type === j.type);
                          return (
                            <div key={j.type} className="rounded-lg border border-border bg-card p-3">
                              <p className="text-xs font-semibold">{j.label}</p>
                              <div className="mt-2"><StatusBadge status={job?.status ?? "not_started"} /></div>
                              {job && job.status === "running" && <p className="mt-1 text-xs text-muted-foreground">{job.progress}%</p>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Processing steps run only when the chosen provider supports them; none run until one is connected.
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!player} onOpenChange={(o) => !o && setPlayer(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{player?.title}</DialogTitle></DialogHeader>
          {player && <video src={player.url} controls className="w-full rounded-lg bg-background" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
