import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getStorageOverview } from "@/lib/media.functions";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string | undefined }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function useStorageOverview() {
  const fetchOverview = useServerFn(getStorageOverview);
  return useQuery({ queryKey: ["admin", "storage"], queryFn: () => fetchOverview() });
}

/** Clear, honest notice shown wherever real uploads would happen. */
export function StorageNotice() {
  const { data, isLoading } = useStorageOverview();
  if (isLoading || !data) return null;
  if (data.uploadsAvailable) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-nova-accent" />
        Uploads go to private storage through secure, short-lived links.
      </div>
    );
  }
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold">Real video uploading is not available yet</p>
        <p className="mt-1 text-muted-foreground">
          {data.unavailableReason} You can still pick, check and preview files here. Set up a provider in the Storage tab.
        </p>
      </div>
    </div>
  );
}

const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  uploaded: "default", ready: "default", succeeded: "default", connected: "default", published: "default",
  uploading: "secondary", queued: "secondary", processing: "secondary", running: "secondary", scheduled: "secondary", pending: "secondary",
  failed: "destructive", cancelled: "outline", not_started: "outline", not_configured: "outline", untested: "outline", draft: "outline",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={TONE[status] ?? "outline"} className="capitalize">{status.replace(/_/g, " ")}</Badge>;
}

export type SignedUploadInfo = {
  url: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  fields?: Record<string, string>;
};

/** Sends a file straight to the storage provider's signed link with real progress events. */
export function uploadToSignedUrl(file: File, upload: SignedUploadInfo, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, upload.url);
    for (const [k, v] of Object.entries(upload.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage replied ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    if (upload.method === "POST" && upload.fields) {
      const form = new FormData();
      for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
      form.append("file", file);
      xhr.send(form);
    } else {
      xhr.send(file);
    }
  });
}

/** Reads real duration and resolution from a local file preview. */
export function readVideoMeta(url: string) {
  return new Promise<{ duration: number | null; width: number | null; height: number | null }>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () =>
      resolve({
        duration: Number.isFinite(v.duration) ? Math.round(v.duration) : null,
        width: v.videoWidth || null,
        height: v.videoHeight || null,
      });
    v.onerror = () => resolve({ duration: null, width: null, height: null });
    v.src = url;
  });
}

export function formatDuration(s: number | null | undefined) {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : `${m}m ${sec.toString().padStart(2, "0")}s`;
}
