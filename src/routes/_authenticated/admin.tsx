import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { BannersManager, SeasonsDialog } from "@/components/admin/AdminExtras";
import NotificationsManager from "@/components/admin/NotificationsManager";
import { UploadCenter } from "@/components/admin/media/UploadCenter";
import { EpisodeManager } from "@/components/admin/media/EpisodeManager";
import { MediaLibrary } from "@/components/admin/media/MediaLibrary";
import { StorageSettings } from "@/components/admin/media/StorageSettings";
import { LiveTvManager } from "@/components/admin/media/LiveTvManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  deleteAdminVideo,
  getAdminStats,
  listAdminUsers,
  listAdminVideos,
  saveAdminVideo,
  updateAdminUser,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — NOVA" },
      { name: "description", content: "Manage NOVA users, videos and subscriptions." },
      { property: "og:title", content: "Admin Panel — NOVA" },
      { property: "og:description", content: "Manage NOVA users, videos and subscriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  // No redirect for non-admins: the page opens directly and shows a notice.
  // Every admin server function still re-checks the admin role on the server.
  loader: async () => checkIsAdmin(),
  component: AdminPage,
});

type Video = Awaited<ReturnType<typeof listAdminVideos>>[number];
type VideoForm = {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  content_type: "movie" | "series" | "video";
};
const emptyForm: VideoForm = {
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  category: "",
  content_type: "movie",
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const { isAdmin } = Route.useLoaderData();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">NOVA Admin</h1>
          <p className="text-sm text-muted-foreground">
            This account doesn't have admin access yet.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
              Back to app
            </Button>
            <Button size="sm" onClick={signOut}>
              Switch account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">NOVA Admin Panel</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
            Back to app
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <StatsCards />
        <Tabs defaultValue="content">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="upload">Upload Center</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="media">Media Library</TabsTrigger>
            <TabsTrigger value="live">Live TV</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <UploadCenter />
          </TabsContent>
          <TabsContent value="episodes">
            <EpisodeManager />
          </TabsContent>
          <TabsContent value="media">
            <MediaLibrary />
          </TabsContent>
          <TabsContent value="live">
            <LiveTvManager />
          </TabsContent>
          <TabsContent value="storage">
            <StorageSettings />
          </TabsContent>
          <TabsContent value="banners">
            <BannersManager />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsManager />
          </TabsContent>
          <TabsContent value="users">
            <UsersTable />
          </TabsContent>
          <TabsContent value="content">
            <ContentManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatsCards() {
  const fetchStats = useServerFn(getAdminStats);
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fetchStats() });
  const cards = [
    { label: "Total users", value: data?.totalUsers },
    { label: "Active subscriptions", value: data?.activeSubscriptions },
    { label: "Total videos", value: data?.totalVideos },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className="mt-2 text-3xl font-semibold">{c.value ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTable() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const update = useServerFn(updateAdminUser);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });
  const mutation = useMutation({
    mutationFn: (v: { id: string; subscription_status?: "active" | "expired"; is_blocked?: boolean }) =>
      update({ data: v }),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not update user"),
  });

  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading users…</p>;
  if (!users.length) return <p className="p-4 text-sm text-muted-foreground">No users yet.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="p-3">Phone</th>
            <th className="p-3">Name</th>
            <th className="p-3">Joined</th>
            <th className="p-3">Subscription</th>
            <th className="p-3">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.phone}</td>
              <td className="p-3">{u.display_name ?? "—"}</td>
              <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-3">
                <Select
                  value={u.subscription_status}
                  onValueChange={(v) =>
                    mutation.mutate({ id: u.id, subscription_status: v as "active" | "expired" })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="p-3">
                {u.is_blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="secondary">OK</Badge>}
              </td>
              <td className="p-3 text-right">
                <Button
                  size="sm"
                  variant={u.is_blocked ? "outline" : "destructive"}
                  onClick={() => mutation.mutate({ id: u.id, is_blocked: !u.is_blocked })}
                >
                  {u.is_blocked ? "Unblock" : "Block"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentManager() {
  const qc = useQueryClient();
  const fetchVideos = useServerFn(listAdminVideos);
  const save = useServerFn(saveAdminVideo);
  const remove = useServerFn(deleteAdminVideo);
  const [form, setForm] = useState<VideoForm | null>(null);
  const [seasonsFor, setSeasonsFor] = useState<{ id: string; title: string } | null>(null);
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin", "videos"],
    queryFn: () => fetchVideos(),
  });
  const saveMut = useMutation({
    mutationFn: (v: VideoForm) => save({ data: v }),
    onSuccess: () => {
      toast.success("Video saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not save — check the URLs are valid links"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Video deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not delete video"),
  });

  function edit(v: Video) {
    setForm({
      id: v.id,
      title: v.title,
      description: v.description ?? "",
      video_url: v.video_url ?? "",
      thumbnail_url: v.thumbnail_url ?? "",
      category: v.category ?? "",
      content_type: (v.content_type as VideoForm["content_type"]) ?? "movie",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm(emptyForm)}>Add video</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading videos…</p>
      ) : !videos.length ? (
        <p className="text-sm text-muted-foreground">No videos yet.</p>
      ) : (
        <div className="grid gap-3">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" className="h-14 w-24 rounded object-cover" />
              ) : (
                <div className="h-14 w-24 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{v.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {v.content_type}
                  {v.category ? ` · ${v.category}` : ""}
                </p>
              </div>
              {v.content_type === "series" && (
                <Button size="sm" variant="secondary" onClick={() => setSeasonsFor({ id: v.id, title: v.title })}>
                  Seasons
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => edit(v)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete "${v.title}"?`)) delMut.mutate(v.id);
                }}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <SeasonsDialog show={seasonsFor} onClose={() => setSeasonsFor(null)} />
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit video" : "Add video"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate(form);
              }}
            >
              <Field label="Title">
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label={form.content_type === "series" ? "Video URL (optional for series)" : "Video URL"}>
                <Input required={form.content_type !== "series"} type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
              </Field>
              <Field label="Thumbnail URL">
                <Input type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select
                    value={form.content_type}
                    onValueChange={(v) => setForm({ ...form, content_type: v as VideoForm["content_type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="series">Web series</SelectItem>
                      <SelectItem value="serial">TV serial</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Category">
                  <Input placeholder="e.g. Action" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </Field>
              </div>
              <Button type="submit" className="w-full" disabled={saveMut.isPending}>
                {saveMut.isPending ? "Saving…" : "Save"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
