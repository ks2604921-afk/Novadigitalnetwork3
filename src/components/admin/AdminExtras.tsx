import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Layers, Plus, Trash2, Pencil, Film, X } from "lucide-react";
import {
  deleteAdminEpisode,
  deleteAdminSeason,
  listAdminBanners,
  listAdminSeasons,
  listAdminVideos,
  saveAdminEpisode,
  saveAdminSeason,
  setAdminBanner,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ---------------- Banners ---------------- */
export function BannersManager() {
  const qc = useQueryClient();
  const fetchBanners = useServerFn(listAdminBanners);
  const fetchVideos = useServerFn(listAdminVideos);
  const setBanner = useServerFn(setAdminBanner);
  const { data: banners = [], isLoading } = useQuery({ queryKey: ["admin", "banners"], queryFn: () => fetchBanners() });
  const { data: videos = [] } = useQuery({ queryKey: ["admin", "videos"], queryFn: () => fetchVideos() });
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");
  const [image, setImage] = useState("");

  const mut = useMutation({
    mutationFn: (v: { id: string; is_featured: boolean; banner_url?: string }) => setBanner({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.is_featured ? "Banner added" : "Banner removed");
      setAdding(false);
      setPick("");
      setImage("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not update banner — check the image link"),
  });

  const available = videos.filter((v) => !banners.some((b) => b.id === v.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Home banners</h2>
          <p className="text-sm text-muted-foreground">Big slides shown at the top of the app.</p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={!videos.length}>
          <ImagePlus className="mr-1.5 h-4 w-4" /> Add banner
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !banners.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No banners yet. {videos.length ? "Tap “Add banner” to feature a title." : "Upload a title in Content first."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {banners.map((b) => {
            const img = b.banner_url || b.thumbnail_url;
            return (
              <div key={b.id} className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                {img && <img src={img} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{b.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{b.content_type}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => mut.mutate({ id: b.id, is_featured: false })}>
                    <X className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add banner</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pick) {
                toast.error("Choose a title");
                return;
              }
              mut.mutate({ id: pick, is_featured: true, banner_url: image });
            }}
          >
            <Field label="Title">
              <Select value={pick} onValueChange={setPick}>
                <SelectTrigger><SelectValue placeholder="Choose a movie or series" /></SelectTrigger>
                <SelectContent>
                  {available.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Banner image link (wide)">
              <Input type="url" placeholder="https://… (blank = use thumbnail)" value={image} onChange={(e) => setImage(e.target.value)} />
            </Field>
            {image && <img src={image} alt="" className="aspect-video w-full rounded-lg object-cover" />}
            <Button type="submit" className="w-full" disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Add to home"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Seasons & Episodes ---------------- */
type EpForm = {
  id?: string;
  season_id: string;
  episode_number: string;
  title: string;
  description: string;
  stream_url: string;
  thumbnail_url: string;
  duration_minutes: string;
};

export function SeasonsDialog({ show, onClose }: { show: { id: string; title: string } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchSeasons = useServerFn(listAdminSeasons);
  const saveSeason = useServerFn(saveAdminSeason);
  const delSeason = useServerFn(deleteAdminSeason);
  const saveEp = useServerFn(saveAdminEpisode);
  const delEp = useServerFn(deleteAdminEpisode);
  const [ep, setEp] = useState<EpForm | null>(null);

  const key = ["admin", "seasons", show?.id];
  const { data: seasons = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchSeasons({ data: { showId: show!.id } }),
    enabled: !!show,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const seasonMut = useMutation({
    mutationFn: () =>
      saveSeason({
        data: { show_id: show!.id, season_number: (seasons.at(-1)?.season_number ?? 0) + 1, title: "" },
      }),
    onSuccess: () => { toast.success("Season added"); refresh(); },
    onError: () => toast.error("Could not add season"),
  });
  const delSeasonMut = useMutation({
    mutationFn: (id: string) => delSeason({ data: { id } }),
    onSuccess: () => { toast.success("Season deleted"); refresh(); },
    onError: () => toast.error("Could not delete season"),
  });
  const epMut = useMutation({
    mutationFn: (f: EpForm) =>
      saveEp({
        data: {
          id: f.id,
          show_id: show!.id,
          season_id: f.season_id,
          episode_number: Number(f.episode_number) || 1,
          title: f.title,
          description: f.description,
          stream_url: f.stream_url,
          thumbnail_url: f.thumbnail_url,
          duration_minutes: f.duration_minutes ? Number(f.duration_minutes) : undefined,
        },
      }),
    onSuccess: () => { toast.success("Episode saved"); setEp(null); refresh(); },
    onError: () => toast.error("Could not save — check the video link"),
  });
  const delEpMut = useMutation({
    mutationFn: (id: string) => delEp({ data: { id } }),
    onSuccess: () => { toast.success("Episode deleted"); refresh(); },
    onError: () => toast.error("Could not delete episode"),
  });

  return (
    <Dialog open={!!show} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> {show?.title} — Seasons & episodes
          </DialogTitle>
        </DialogHeader>

        {ep ? (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); epMut.mutate(ep); }}
          >
            <div className="grid grid-cols-[90px_1fr] gap-3">
              <Field label="Ep #">
                <Input required type="number" min={1} value={ep.episode_number} onChange={(e) => setEp({ ...ep, episode_number: e.target.value })} />
              </Field>
              <Field label="Episode title">
                <Input required value={ep.title} onChange={(e) => setEp({ ...ep, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={ep.description} onChange={(e) => setEp({ ...ep, description: e.target.value })} />
            </Field>
            <Field label="Video link">
              <Input required type="url" value={ep.stream_url} onChange={(e) => setEp({ ...ep, stream_url: e.target.value })} />
            </Field>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field label="Thumbnail link">
                <Input type="url" value={ep.thumbnail_url} onChange={(e) => setEp({ ...ep, thumbnail_url: e.target.value })} />
              </Field>
              <Field label="Minutes">
                <Input type="number" min={0} value={ep.duration_minutes} onChange={(e) => setEp({ ...ep, duration_minutes: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEp(null)}>Back</Button>
              <Button type="submit" className="flex-1" disabled={epMut.isPending}>{epMut.isPending ? "Saving…" : "Save episode"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !seasons.length ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No seasons yet.</p>
            ) : (
              seasons.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold">Season {s.season_number}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setEp({
                            season_id: s.id,
                            episode_number: String((s.episodes.at(-1)?.episode_number ?? 0) + 1),
                            title: "", description: "", stream_url: "", thumbnail_url: "", duration_minutes: "",
                          })
                        }
                      >
                        <Plus className="mr-1 h-4 w-4" /> Episode
                      </Button>
                      <Button
                        size="sm" variant="ghost" aria-label="Delete season"
                        onClick={() => confirm(`Delete Season ${s.season_number} and all its episodes?`) && delSeasonMut.mutate(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {!s.episodes.length ? (
                    <p className="text-xs text-muted-foreground">No episodes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {s.episodes.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 rounded-xl bg-card p-2">
                          {e.thumbnail_url ? (
                            <img src={e.thumbnail_url} alt="" className="h-10 w-16 rounded object-cover" />
                          ) : (
                            <div className="flex h-10 w-16 items-center justify-center rounded bg-muted"><Film className="h-4 w-4 text-muted-foreground" /></div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">E{e.episode_number} · {e.title}</p>
                            {e.duration_seconds ? <p className="text-xs text-muted-foreground">{Math.round(e.duration_seconds / 60)} min</p> : null}
                          </div>
                          <Button
                            size="icon" variant="ghost" aria-label="Edit episode"
                            onClick={() =>
                              setEp({
                                id: e.id, season_id: s.id, episode_number: String(e.episode_number), title: e.title,
                                description: e.description ?? "", stream_url: e.stream_url ?? "", thumbnail_url: e.thumbnail_url ?? "",
                                duration_minutes: e.duration_seconds ? String(Math.round(e.duration_seconds / 60)) : "",
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Delete episode" onClick={() => confirm(`Delete "${e.title}"?`) && delEpMut.mutate(e.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => seasonMut.mutate()} disabled={seasonMut.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> Add season {(seasons.at(-1)?.season_number ?? 0) + 1}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
