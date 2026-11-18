import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Radio, Trash2 } from "lucide-react";
import { deleteAdminChannel, listAdminChannels, saveAdminChannel, type LiveChannel } from "@/lib/live.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "./shared";

type Form = {
  id?: string; name: string; logo_url: string; category: string; language: string;
  stream_url: string; description: string; is_active: boolean; sort_order: string;
};
const EMPTY: Form = { name: "", logo_url: "", category: "Entertainment", language: "", stream_url: "", description: "", is_active: true, sort_order: "0" };

export function LiveTvManager() {
  const qc = useQueryClient();
  const fetchChannels = useServerFn(listAdminChannels);
  const saveFn = useServerFn(saveAdminChannel);
  const deleteFn = useServerFn(deleteAdminChannel);
  const [form, setForm] = useState<Form | null>(null);
  const { data: channels = [], isLoading } = useQuery({ queryKey: ["admin", "live-channels"], queryFn: () => fetchChannels() });

  const save = useMutation({
    mutationFn: (f: Form) =>
      saveFn({ data: { ...f, sort_order: Number(f.sort_order) || 0 } }),
    onSuccess: () => { toast.success("Channel saved"); setForm(null); qc.invalidateQueries({ queryKey: ["admin", "live-channels"] }); qc.invalidateQueries({ queryKey: ["live-channels"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save channel"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Channel deleted"); qc.invalidateQueries({ queryKey: ["admin", "live-channels"] }); },
    onError: () => toast.error("Could not delete channel"),
  });

  const edit = (c: LiveChannel) => setForm({
    id: c.id, name: c.name, logo_url: c.logo_url ?? "", category: c.category, language: c.language ?? "",
    stream_url: c.stream_url, description: c.description ?? "", is_active: c.is_active, sort_order: String(c.sort_order),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Radio className="h-5 w-5 text-primary" /> Live TV channels</h2>
          <p className="text-sm text-muted-foreground">Active channels appear in the app's Live TV section. Use an HLS (.m3u8) or MP4 stream link.</p>
        </div>
        <Button onClick={() => setForm({ ...EMPTY })}><Plus className="mr-1 h-4 w-4" /> Add channel</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Channel</th><th className="p-3">Category</th><th className="p-3">Language</th><th className="p-3">Status</th><th className="p-3">Order</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-muted-foreground">Loading…</td></tr>}
            {!isLoading && !channels.length && <tr><td colSpan={6} className="p-4 text-muted-foreground">No channels yet. Add your first live channel.</td></tr>}
            {channels.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="h-9 w-9 rounded-md bg-muted object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted"><Radio className="h-4 w-4" /></div>}
                    <div><p className="font-medium">{c.name}</p><p className="max-w-[260px] truncate text-xs text-muted-foreground">{c.stream_url}</p></div>
                  </div>
                </td>
                <td className="p-3">{c.category}</td>
                <td className="p-3">{c.language || "—"}</td>
                <td className="p-3">{c.is_active ? <Badge>Live</Badge> : <Badge variant="secondary">Hidden</Badge>}</td>
                <td className="p-3">{c.sort_order}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => edit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit channel" : "New channel"}</DialogTitle></DialogHeader>
          {form && (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
              <Field label="Channel name"><Input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Category"><Input required maxLength={60} placeholder="News, Sports, Music…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Live stream link"><Input required type="url" placeholder="https://…/live.m3u8" value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Logo image link"><Input type="url" placeholder="https://…" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field></div>
              <Field label="Language"><Input maxLength={60} placeholder="Hindi" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></Field>
              <Field label="Display order"><Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Description"><Textarea rows={2} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Show in app</label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save channel"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
