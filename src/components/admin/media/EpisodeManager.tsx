import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Captions, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { saveAdminSeason, saveAdminVideo } from "@/lib/admin.functions";
import { generateEpisodeDescription } from "@/lib/ai-content.functions";
import {
  deleteSubtitle,
  finishSubtitleUpload,
  listSeasonEpisodes,
  listUploadTargets,
  requestSubtitleUpload,
  saveEpisodeDetails,
  type AdminEpisode,
} from "@/lib/media.functions";
import { SUBTITLE_RULES, validateSubtitleFile } from "@/lib/storage/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, StatusBadge, formatDuration, uploadToSignedUrl, useStorageOverview } from "./shared";

type Form = {
  id?: string;
  episode_number: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration_minutes: string;
  release_date: string;
  language: string;
  access_tier: "free" | "premium";
  publish_status: "draft" | "scheduled" | "published";
  scheduled_at: string;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function EpisodeManager() {
  const qc = useQueryClient();
  const fetchTargets = useServerFn(listUploadTargets);
  const fetchEpisodes = useServerFn(listSeasonEpisodes);
  const saveSeason = useServerFn(saveAdminSeason);
  const saveEpisode = useServerFn(saveEpisodeDetails);
  const [showId, setShowId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [subsFor, setSubsFor] = useState<AdminEpisode | null>(null);
  const [synopsis, setSynopsis] = useState("");
  const [newShow, setNewShow] = useState<{ title: string; type: "series" | "serial"; category: string } | null>(null);
  const aiDescribe = useServerFn(generateEpisodeDescription);
  const createShow = useServerFn(saveAdminVideo);
  const generate = useMutation({
    mutationFn: () => aiDescribe({ data: { title: form!.title, synopsis, seriesName: show?.title } }),
    onSuccess: (r) => {
      if (r.error) { toast.error(r.error); return; }
      setForm((f) => (f ? { ...f, description: r.description } : f));
      toast.success("Description ready — review and save");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not generate description"),
  });
  const addShow = useMutation({
    mutationFn: (n: { title: string; type: "series" | "serial"; category: string }) =>
      createShow({ data: { title: n.title, description: "", video_url: "", thumbnail_url: "", category: n.category, content_type: n.type } as never }),
    onSuccess: () => { toast.success("Added — now pick it from the list"); setNewShow(null); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add"),
  });

  const { data: targets = [] } = useQuery({ queryKey: ["admin", "upload-targets"], queryFn: () => fetchTargets() });
  const series = targets.filter((t) => t.content_type === "series" || t.content_type === "serial");
  const show = series.find((s) => s.id === showId);
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["admin", "season-episodes", seasonId],
    queryFn: () => fetchEpisodes({ data: { seasonId } }),
    enabled: !!seasonId,
  });

  const addSeason = useMutation({
    mutationFn: () =>
      saveSeason({ data: { show_id: showId, season_number: (show?.seasons.at(-1)?.season_number ?? 0) + 1, title: "" } }),
    onSuccess: () => { toast.success("Season added"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: () => toast.error("Could not add season"),
  });

  const save = useMutation({
    mutationFn: (f: Form) =>
      saveEpisode({
        data: {
          id: f.id,
          show_id: showId,
          season_id: seasonId,
          episode_number: Number(f.episode_number),
          title: f.title,
          description: f.description,
          thumbnail_url: f.thumbnail_url,
          duration_seconds: f.duration_minutes ? Math.round(Number(f.duration_minutes) * 60) : null,
          release_date: f.release_date || null,
          language: f.language,
          access_tier: f.access_tier,
          publish_status: f.publish_status,
          scheduled_at: f.publish_status === "scheduled" && f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
        },
      }),
    onSuccess: () => { toast.success("Episode saved"); setForm(null); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save episode"),
  });

  function openNew() {
    setSynopsis("");
    setForm({
      episode_number: String((episodes.at(-1)?.episode_number ?? 0) + 1), title: "", description: "", thumbnail_url: "",
      duration_minutes: "", release_date: "", language: "", access_tier: "free", publish_status: "draft", scheduled_at: "",
    });
  }
  function openEdit(e: AdminEpisode) {
    setSynopsis("");
    setForm({
      id: e.id, episode_number: String(e.episode_number), title: e.title, description: e.description ?? "",
      thumbnail_url: e.thumbnail_url ?? "", duration_minutes: e.duration_seconds ? String(Math.round(e.duration_seconds / 60)) : "",
      release_date: e.release_date ?? "", language: e.language ?? "", access_tier: e.access_tier,
      publish_status: e.publish_status, scheduled_at: toLocalInput(e.scheduled_at),
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Web series / TV serial">
          <Select value={showId} onValueChange={(v) => { setShowId(v); setSeasonId(""); }}>
            <SelectTrigger><SelectValue placeholder={series.length ? "Choose a series or serial" : "None yet — add one"} /></SelectTrigger>
            <SelectContent>{series.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} · {s.content_type === "serial" ? "Serial" : "Web series"}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Season">
          <Select value={seasonId} onValueChange={setSeasonId} disabled={!show}>
            <SelectTrigger><SelectValue placeholder="Choose a season" /></SelectTrigger>
            <SelectContent>
              {show?.seasons.map((s) => <SelectItem key={s.id} value={s.id}>Season {s.season_number}{s.title ? ` · ${s.title}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="outline" onClick={() => setNewShow({ title: "", type: "serial", category: "" })}>
            <Plus className="mr-1 h-4 w-4" /> Serial / Series
          </Button>
          <Button variant="outline" disabled={!show || addSeason.isPending} onClick={() => addSeason.mutate()}>
            <Plus className="mr-1 h-4 w-4" /> Season
          </Button>
          <Button disabled={!seasonId} onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Episode</Button>
        </div>
      </div>

      {show && (
        <p className="text-xs text-muted-foreground">
          Series ID <span className="font-mono">{show.id}</span>
          {seasonId && <> · Season ID <span className="font-mono">{seasonId}</span></>}
        </p>
      )}

      {seasonId && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">#</th><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Access</th>
                <th className="p-3">Video</th><th className="p-3">Subtitles</th><th className="p-3">Length</th><th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="p-4 text-muted-foreground">Loading…</td></tr>}
              {!isLoading && !episodes.length && <tr><td colSpan={8} className="p-4 text-muted-foreground">No episodes in this season yet.</td></tr>}
              {episodes.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{e.episode_number}</td>
                  <td className="p-3">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{[e.language, e.release_date].filter(Boolean).join(" · ") || "—"}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={e.publish_status} />
                    {e.publish_status === "scheduled" && e.scheduled_at && (
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(e.scheduled_at).toLocaleString()}</p>
                    )}
                  </td>
                  <td className="p-3 capitalize">{e.access_tier}</td>
                  <td className="p-3">
                    {e.asset ? <StatusBadge status={e.asset.upload_status} /> : e.stream_url ? <span className="text-xs text-muted-foreground">Link only</span> : <span className="text-xs text-muted-foreground">None</span>}
                  </td>
                  <td className="p-3">{e.subtitles.length || "—"}</td>
                  <td className="p-3">{formatDuration(e.duration_seconds)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Subtitles" onClick={() => setSubsFor(e)}><Captions className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit episode" : "New episode"}</DialogTitle></DialogHeader>
          {form && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(ev) => { ev.preventDefault(); save.mutate(form); }}
            >
              <Field label="Episode number">
                <Input type="number" min={1} required value={form.episode_number} onChange={(e) => setForm({ ...form, episode_number: e.target.value })} />
              </Field>
              <Field label="Episode title">
                <Input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:col-span-2">
                <Field label="Short synopsis for AI" hint="A few lines about what happens. AI writes the publish-ready description below.">
                  <Textarea rows={2} maxLength={1500} value={synopsis} placeholder="Raj finally confronts his father about the missing letter…" onChange={(e) => setSynopsis(e.target.value)} />
                </Field>
                <Button type="button" size="sm" disabled={!form.title.trim() || synopsis.trim().length < 3 || generate.isPending} onClick={() => generate.mutate()}>
                  <Sparkles className="mr-1 h-4 w-4" /> {generate.isPending ? "Writing…" : "Generate description with AI"}
                </Button>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea rows={3} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Thumbnail image link">
                  <Input type="url" placeholder="https://…" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
                </Field>
              </div>
              <Field label="Duration (minutes)" hint="Filled automatically from the video once uploaded">
                <Input type="number" min={0} step="0.1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
              </Field>
              <Field label="Release date">
                <Input type="date" value={form.release_date} onChange={(e) => setForm({ ...form, release_date: e.target.value })} />
              </Field>
              <Field label="Language">
                <Input placeholder="Hindi" maxLength={60} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </Field>
              <Field label="Access">
                <Select value={form.access_tier} onValueChange={(v) => setForm({ ...form, access_tier: v as Form["access_tier"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.publish_status} onValueChange={(v) => setForm({ ...form, publish_status: v as Form["publish_status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.publish_status === "scheduled" && (
                <Field label="Publish at">
                  <Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </Field>
              )}
              <p className="text-xs text-muted-foreground sm:col-span-2">Upload or replace the video in the Upload Center. Viewers only see published episodes, or scheduled ones after their time.</p>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button type="submit" disabled={save.isPending}>Save episode</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <SubtitlesDialog episode={subsFor} onClose={() => setSubsFor(null)} />
      <Dialog open={!!newShow} onOpenChange={(o) => !o && setNewShow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add serial or web series</DialogTitle></DialogHeader>
          {newShow && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); addShow.mutate(newShow); }}>
              <Field label="Name"><Input required maxLength={200} value={newShow.title} onChange={(e) => setNewShow({ ...newShow, title: e.target.value })} /></Field>
              <Field label="Type">
                <Select value={newShow.type} onValueChange={(v) => setNewShow({ ...newShow, type: v as "series" | "serial" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="serial">TV serial</SelectItem><SelectItem value="series">Web series</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Category"><Input maxLength={100} placeholder="Drama" value={newShow.category} onChange={(e) => setNewShow({ ...newShow, category: e.target.value })} /></Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewShow(null)}>Cancel</Button>
                <Button type="submit" disabled={addShow.isPending}>{addShow.isPending ? "Adding…" : "Add"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubtitlesDialog({ episode, onClose }: { episode: AdminEpisode | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: overview } = useStorageOverview();
  const request = useServerFn(requestSubtitleUpload);
  const finish = useServerFn(finishSubtitleUpload);
  const remove = useServerFn(deleteSubtitle);
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState("hi");
  const [label, setLabel] = useState("Hindi");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileError = file ? (() => { const c = validateSubtitleFile(file); return c.ok ? null : c.error; })() : null;

  async function upload() {
    if (!episode || !file || fileError) return;
    setBusy(true);
    try {
      const r = await request({ data: { episodeId: episode.id, languageCode: lang, label, filename: file.name, sizeBytes: file.size, isDefault } });
      if (!r.ok) return void toast.error(r.reason);
      try {
        await uploadToSignedUrl(file, r.upload, () => undefined);
        await finish({ data: { subtitleId: r.subtitleId, success: true } });
        toast.success("Subtitle uploaded");
        setFile(null);
      } catch (e) {
        await finish({ data: { subtitleId: r.subtitleId, success: false } });
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["admin"] });
    }
  }

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Subtitle removed"); qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove subtitle"),
  });

  return (
    <Dialog open={!!episode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Subtitles · E{episode?.episode_number} {episode?.title}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {!episode?.subtitles.length && <p className="text-sm text-muted-foreground">No subtitle files yet.</p>}
          {episode?.subtitles.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{s.label} <span className="text-muted-foreground">({s.language_code}, .{s.format}){s.is_default ? " · default" : ""}</span></span>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.upload_status} />
                <Button size="icon" variant="ghost" aria-label="Delete subtitle" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <Field label="Language code"><Input value={lang} maxLength={12} onChange={(e) => setLang(e.target.value)} /></Field>
          <Field label="Label"><Input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label={`Subtitle file (${SUBTITLE_RULES.extensions.join(", ")})`}>
              <Input type="file" accept=".vtt,.srt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            {fileError && <p className="mt-1 text-xs text-destructive">{fileError}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={isDefault} onCheckedChange={setIsDefault} /> Default track</label>
          <div className="flex justify-end">
            <Button disabled={!overview?.uploadsAvailable || !file || !!fileError || busy || !lang || !label} onClick={upload}>
              {overview?.uploadsAvailable ? "Upload subtitle" : "Uploading unavailable"}
            </Button>
          </div>
          {!overview?.uploadsAvailable && <p className="text-xs text-muted-foreground sm:col-span-2">{overview?.unavailableReason}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
