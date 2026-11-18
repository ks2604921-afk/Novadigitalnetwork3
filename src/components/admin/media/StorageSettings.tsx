import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { HardDrive, KeyRound, Lock, PlugZap, ShieldCheck } from "lucide-react";
import { setActiveProvider, setProviderEnabled, testProviderConnection } from "@/lib/media.functions";
import { SUBTITLE_RULES, VIDEO_RULES, formatBytes, providerInfo } from "@/lib/storage/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatusBadge, useStorageOverview } from "./shared";

export function StorageSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useStorageOverview();
  const enable = useServerFn(setProviderEnabled);
  const activate = useServerFn(setActiveProvider);
  const test = useServerFn(testProviderConnection);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "storage"] });

  const enableMut = useMutation({
    mutationFn: (v: { id: Parameters<typeof enable>[0]["data"]["id"]; enabled: boolean }) => enable({ data: v }),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update provider"),
  });
  const activeMut = useMutation({
    mutationFn: (id: Parameters<typeof activate>[0]["data"]["id"]) => activate({ data: { id } }),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not set provider"),
  });
  const testMut = useMutation({
    mutationFn: (id: Parameters<typeof test>[0]["data"]["id"]) => test({ data: { id } }),
    onSuccess: (r) => {
      (r.ok ? toast.success : toast.error)(r.message);
      refresh();
    },
    onError: () => toast.error("Connection test failed"),
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading storage settings…</p>;
  const active = providerInfo(data.activeProviderId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Current provider</p>
          <p className="mt-2 text-2xl font-semibold">{active ? active.name : "Not Configured"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Real uploads</p>
          <p className="mt-2 text-2xl font-semibold">{data.uploadsAvailable ? "Available" : "Not available"}</p>
          {data.unavailableReason && <p className="mt-1 text-xs text-muted-foreground">{data.unavailableReason}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">File limits</p>
          <p className="mt-2 text-sm">Video: {VIDEO_RULES.extensions.join(", ")} · up to {formatBytes(VIDEO_RULES.maxBytes)}</p>
          <p className="text-sm">Subtitles: {SUBTITLE_RULES.extensions.join(", ")} · up to {formatBytes(SUBTITLE_RULES.maxBytes)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.providers.map((p) => {
          const configured = p.missingSecrets.length === 0;
          const canEnable = configured && p.implemented;
          return (
            <div key={p.id} className={`rounded-xl border bg-card p-5 ${p.isActive ? "border-nova-accent" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {p.kind === "Video platform" ? <PlugZap className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.kind}{p.processing ? " · built-in transcoding" : ""}</p>
                  </div>
                </div>
                {p.isActive && <Badge>Active</Badge>}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Configuration</dt>
                  <dd className="mt-1"><StatusBadge status={configured ? "ready" : "not_configured"} /></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Adapter</dt>
                  <dd className="mt-1"><Badge variant="outline">{p.implemented ? "Built" : "Not built yet"}</Badge></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Connection</dt>
                  <dd className="mt-1"><StatusBadge status={p.connectionStatus} /></dd>
                </div>
              </dl>

              {!configured && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-medium"><KeyRound className="h-3.5 w-3.5" /> Secrets needed</p>
                  <p className="mt-1 font-mono text-muted-foreground">{p.missingSecrets.join(", ")}</p>
                </div>
              )}
              {p.lastTestMessage && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Last test{p.lastTestedAt ? ` (${new Date(p.lastTestedAt).toLocaleString()})` : ""}: {p.lastTestMessage}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={p.isEnabled}
                    disabled={(!canEnable && !p.isEnabled) || enableMut.isPending}
                    onCheckedChange={(enabled) => enableMut.mutate({ id: p.id, enabled })}
                  />
                  {p.isEnabled ? "Enabled" : "Disabled"}
                </label>
                <Button size="sm" variant="outline" disabled={testMut.isPending} onClick={() => testMut.mutate(p.id)}>
                  Test connection
                </Button>
                {p.isActive ? (
                  <Button size="sm" variant="ghost" onClick={() => activeMut.mutate(null)}>Stop using</Button>
                ) : (
                  <Button size="sm" disabled={!p.isEnabled || activeMut.isPending} onClick={() => activeMut.mutate(p.id)}>
                    Use this provider
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Security model</p>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> Videos are stored privately; nothing is public by default.</li>
          <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> Uploads and playback use short-lived signed links made on the server.</li>
          <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> Provider keys stay in secure project secrets and never reach the browser.</li>
          <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> Every storage action re-checks that you are an admin.</li>
        </ul>
      </div>
    </div>
  );
}
