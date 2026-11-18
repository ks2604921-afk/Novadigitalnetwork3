import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  PROCESSING_JOBS,
  PROVIDER_IDS,
  STORAGE_PROVIDERS,
  buildStorageKey,
  validateSubtitleFile,
  validateVideoFile,
  type ProviderId,
} from "@/lib/storage/catalog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin access only");
}

const adapters = () => import("@/lib/storage/adapter.server");

type Availability =
  | { ok: true; providerId: ProviderId }
  | { ok: false; reason: string };

async function resolveActiveProvider(context: Ctx): Promise<Availability> {
  const { data } = await context.supabase
    .from("storage_providers")
    .select("id, is_enabled")
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return { ok: false, reason: "No storage provider is configured. Real video uploading is not available yet." };
  const { getAdapter } = await adapters();
  const a = getAdapter(data.id as ProviderId);
  if (!data.is_enabled) return { ok: false, reason: `${a.info.name} is selected but disabled.` };
  const missing = a.missingSecrets();
  if (missing.length) return { ok: false, reason: `${a.info.name} is missing secrets: ${missing.join(", ")}.` };
  if (!a.implemented) return { ok: false, reason: `${a.info.name} credentials are present, but its adapter has not been built yet.` };
  return { ok: true, providerId: data.id as ProviderId };
}

/* ---------------- Storage provider settings ---------------- */

export const getStorageOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAdapter } = await adapters();
    const { data: rows } = await context.supabase.from("storage_providers").select("*");
    const byId = new Map<string, Record<string, unknown>>((rows ?? []).map((r: { id: string }) => [r.id, r]));
    const providers = STORAGE_PROVIDERS.map((p) => {
      const a = getAdapter(p.id);
      const row = byId.get(p.id) as
        | { is_enabled: boolean; is_active: boolean; connection_status: string; last_tested_at: string | null; last_test_message: string | null }
        | undefined;
      return {
        ...p,
        implemented: a.implemented,
        missingSecrets: a.missingSecrets(),
        isEnabled: row?.is_enabled ?? false,
        isActive: row?.is_active ?? false,
        connectionStatus: row?.connection_status ?? "not_configured",
        lastTestedAt: row?.last_tested_at ?? null,
        lastTestMessage: row?.last_test_message ?? null,
      };
    });
    const availability = await resolveActiveProvider(context);
    return {
      providers,
      activeProviderId: providers.find((p) => p.isActive)?.id ?? null,
      uploadsAvailable: availability.ok,
      unavailableReason: availability.ok ? null : availability.reason,
    };
  });

export const setProviderEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.enum(PROVIDER_IDS), enabled: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdapter } = await adapters();
    const a = getAdapter(data.id);
    if (data.enabled) {
      const missing = a.missingSecrets();
      if (missing.length) throw new Error(`Add these secrets first: ${missing.join(", ")}`);
      if (!a.implemented) throw new Error(`The ${a.info.name} adapter has not been built yet`);
    }
    const patch: { id: ProviderId; is_enabled: boolean; is_active?: boolean } = { id: data.id, is_enabled: data.enabled };
    if (!data.enabled) patch.is_active = false;
    const { error } = await context.supabase.from("storage_providers").upsert(patch, { onConflict: "id" });
    if (error) throw new Error("Could not update provider");
    return { ok: true };
  });

export const setActiveProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.enum(PROVIDER_IDS).nullable() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("storage_providers").update({ is_active: false }).eq("is_active", true);
    if (!data.id) return { ok: true };
    const { data: row } = await context.supabase.from("storage_providers").select("is_enabled").eq("id", data.id).maybeSingle();
    if (!row?.is_enabled) throw new Error("Enable the provider before making it active");
    const { error } = await context.supabase.from("storage_providers").update({ is_active: true }).eq("id", data.id);
    if (error) throw new Error("Could not set active provider");
    return { ok: true };
  });

export const testProviderConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.enum(PROVIDER_IDS) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getAdapter } = await adapters();
    const a = getAdapter(data.id);
    let result: { ok: boolean; message: string };
    try {
      result = await a.testConnection();
    } catch (e) {
      console.error("Storage test failed", e);
      result = { ok: false, message: "Connection test failed" };
    }
    const status = result.ok ? "connected" : a.missingSecrets().length ? "not_configured" : "failed";
    await context.supabase.from("storage_providers").upsert(
      { id: data.id, connection_status: status, last_tested_at: new Date().toISOString(), last_test_message: result.message },
      { onConflict: "id" },
    );
    return result;
  });

/* ---------------- Upload targets & episodes ---------------- */

export const listUploadTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("shows")
      .select("id, title, content_type, video_asset_id, seasons(id, season_number, title)")
      .order("title");
    if (error) throw new Error("Could not load titles");
    return ((data ?? []) as Array<{
      id: string; title: string; content_type: string; video_asset_id: string | null;
      seasons: Array<{ id: string; season_number: number; title: string | null }>;
    }>).map((s) => ({ ...s, seasons: [...s.seasons].sort((a, b) => a.season_number - b.season_number) }));
  });

export type AdminEpisode = {
  id: string; show_id: string; season_id: string; episode_number: number; title: string;
  description: string | null; thumbnail_url: string | null; duration_seconds: number | null;
  stream_url: string | null; release_date: string | null; language: string | null;
  access_tier: "free" | "premium"; publish_status: "draft" | "scheduled" | "published";
  scheduled_at: string | null; video_asset_id: string | null;
  asset: { id: string; upload_status: string; processing_status: string; original_filename: string } | null;
  subtitles: Array<{ id: string; language_code: string; label: string; format: string; upload_status: string; is_default: boolean }>;
};

export const listSeasonEpisodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ seasonId: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<AdminEpisode[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("episodes")
      .select(
        "id, show_id, season_id, episode_number, title, description, thumbnail_url, duration_seconds, stream_url, release_date, language, access_tier, publish_status, scheduled_at, video_asset_id, asset:media_assets!episodes_video_asset_id_fkey(id, upload_status, processing_status, original_filename), subtitles:video_subtitles(id, language_code, label, format, upload_status, is_default)",
      )
      .eq("season_id", data.seasonId)
      .order("episode_number");
    if (error) {
      console.error(error);
      throw new Error("Could not load episodes");
    }
    return (rows ?? []) as AdminEpisode[];
  });

const episodeSchema = z
  .object({
    id: z.string().uuid().optional(),
    show_id: z.string().uuid(),
    season_id: z.string().uuid(),
    episode_number: z.number().int().min(1).max(9999),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).default(""),
    thumbnail_url: z.string().trim().url().max(1000).or(z.literal("")),
    duration_seconds: z.number().int().min(0).max(100000).nullable(),
    release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    language: z.string().trim().max(60).default(""),
    access_tier: z.enum(["free", "premium"]),
    publish_status: z.enum(["draft", "scheduled", "published"]),
    scheduled_at: z.string().datetime().nullable(),
  })
  .refine((v) => v.publish_status !== "scheduled" || !!v.scheduled_at, {
    message: "Scheduled episodes need a publish date and time",
  });

export const saveEpisodeDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(episodeSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const row = {
      ...rest,
      description: rest.description || null,
      thumbnail_url: rest.thumbnail_url || null,
      language: rest.language || null,
      scheduled_at: rest.publish_status === "scheduled" ? rest.scheduled_at : null,
    };
    const { error } = id
      ? await context.supabase.from("episodes").update(row).eq("id", id)
      : await context.supabase.from("episodes").insert(row);
    if (error) {
      console.error(error);
      throw new Error(error.code === "23505" ? "That episode number already exists in this season" : "Could not save episode");
    }
    return { ok: true };
  });

/* ---------------- Video uploads ---------------- */

const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("movie"), showId: z.string().uuid() }),
  z.object({ kind: z.literal("episode"), episodeId: z.string().uuid() }),
]);

export const requestVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      target: targetSchema,
      filename: z.string().trim().min(1).max(300),
      mimeType: z.string().max(100),
      sizeBytes: z.number().int().positive(),
      durationSeconds: z.number().int().min(0).max(100000).nullable(),
      width: z.number().int().min(0).max(10000).nullable(),
      height: z.number().int().min(0).max(10000).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const check = validateVideoFile({ name: data.filename, size: data.sizeBytes, type: data.mimeType });
    if (!check.ok) return { ok: false as const, reason: check.error };

    const avail = await resolveActiveProvider(context);
    if (!avail.ok) return { ok: false as const, reason: avail.reason };

    let showId: string;
    let episodeId: string | null = null;
    if (data.target.kind === "movie") {
      showId = data.target.showId;
    } else {
      const { data: ep } = await context.supabase.from("episodes").select("id, show_id").eq("id", data.target.episodeId).maybeSingle();
      if (!ep) return { ok: false as const, reason: "Episode not found" };
      showId = ep.show_id;
      episodeId = ep.id;
    }

    const { data: asset, error } = await context.supabase
      .from("media_assets")
      .insert({
        provider_id: avail.providerId,
        asset_kind: data.target.kind,
        show_id: showId,
        episode_id: episodeId,
        original_filename: data.filename,
        file_size_bytes: data.sizeBytes,
        mime_type: data.mimeType || "application/octet-stream",
        duration_seconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        upload_status: "pending",
        is_current: false,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !asset) throw new Error("Could not register upload");

    const key = buildStorageKey({ kind: data.target.kind, showId, episodeId, assetId: asset.id, filename: data.filename });
    const { getAdapter, StorageUnavailableError } = await adapters();
    try {
      const upload = await getAdapter(avail.providerId).createSignedUpload({
        key,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      });
      await context.supabase.from("media_assets").update({ storage_key: key, upload_status: "uploading" }).eq("id", asset.id);
      return { ok: true as const, assetId: asset.id as string, upload };
    } catch (e) {
      const reason = e instanceof StorageUnavailableError ? e.message : "Could not create a secure upload link";
      if (!(e instanceof StorageUnavailableError)) console.error(e);
      await context.supabase.from("media_assets").update({ upload_status: "failed", error_message: reason }).eq("id", asset.id);
      return { ok: false as const, reason };
    }
  });

export const completeVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ assetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: asset } = await context.supabase
      .from("media_assets")
      .select("id, provider_id, asset_kind, show_id, episode_id, storage_key, upload_status")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset || asset.upload_status !== "uploading" || !asset.storage_key) throw new Error("Upload not in progress");

    // Mark previous video as replaced.
    const prevQuery = context.supabase.from("media_assets").select("id").eq("is_current", true).neq("id", asset.id);
    const { data: prev } = asset.episode_id
      ? await prevQuery.eq("episode_id", asset.episode_id)
      : await prevQuery.eq("show_id", asset.show_id ?? "").is("episode_id", null);
    if (prev?.length) {
      await context.supabase.from("media_assets").update({ is_current: false }).in("id", prev.map((p: { id: string }) => p.id));
    }

    let processing = "not_started";
    const { getAdapter } = await adapters();
    const adapter = getAdapter(asset.provider_id as ProviderId);
    if (adapter.submitProcessing) {
      const jobs = await adapter.submitProcessing({ key: asset.storage_key, jobs: PROCESSING_JOBS.map((j) => j.type) });
      if (jobs.length) {
        await context.supabase.from("video_processing_jobs").insert(
          jobs.map((j) => ({ asset_id: asset.id, job_type: j.type, provider_job_id: j.providerJobId, status: "queued" })),
        );
        processing = "queued";
      }
    }
    await context.supabase
      .from("media_assets")
      .update({ upload_status: "uploaded", is_current: true, processing_status: processing, replaced_asset_id: prev?.[0]?.id ?? null })
      .eq("id", asset.id);
    if (asset.episode_id) await context.supabase.from("episodes").update({ video_asset_id: asset.id }).eq("id", asset.episode_id);
    else await context.supabase.from("shows").update({ video_asset_id: asset.id }).eq("id", asset.show_id ?? "");
    return { ok: true, processing };
  });

export const failVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ assetId: z.string().uuid(), message: z.string().max(500) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase
      .from("media_assets")
      .update({ upload_status: "failed", error_message: data.message })
      .eq("id", data.assetId)
      .in("upload_status", ["pending", "uploading"]);
    return { ok: true };
  });

/* ---------------- Media library ---------------- */

export type MediaAssetRow = {
  id: string; provider_id: string | null; asset_kind: string; original_filename: string;
  file_size_bytes: number; mime_type: string; duration_seconds: number | null; width: number | null; height: number | null;
  upload_status: string; processing_status: string; error_message: string | null; is_current: boolean;
  playback_manifest_ref: string | null; created_at: string;
  show: { id: string; title: string } | null;
  episode: { id: string; title: string; episode_number: number } | null;
  jobs: Array<{ id: string; job_type: string; status: string; progress: number; error_message: string | null }>;
};

export const listMediaAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaAssetRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("media_assets")
      .select(
        "id, provider_id, asset_kind, original_filename, file_size_bytes, mime_type, duration_seconds, width, height, upload_status, processing_status, error_message, is_current, playback_manifest_ref, created_at, show:shows!media_assets_show_id_fkey(id, title), episode:episodes!media_assets_episode_id_fkey(id, title, episode_number), jobs:video_processing_jobs(id, job_type, status, progress, error_message)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      console.error(error);
      throw new Error("Could not load media");
    }
    return (data ?? []) as MediaAssetRow[];
  });

export const getAssetPlayback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ assetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: asset } = await context.supabase
      .from("media_assets")
      .select("provider_id, storage_key, playback_manifest_ref, upload_status")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset || asset.upload_status !== "uploaded" || !asset.provider_id || !asset.storage_key)
      return { ok: false as const, reason: "This video has not finished uploading" };
    const avail = await resolveActiveProvider(context);
    if (!avail.ok) return { ok: false as const, reason: avail.reason };
    const { getAdapter, StorageUnavailableError } = await adapters();
    try {
      const signed = await getAdapter(asset.provider_id as ProviderId).createSignedPlayback({
        key: asset.playback_manifest_ref ?? asset.storage_key ?? "",
        expiresInSeconds: 600,
      });
      return { ok: true as const, ...signed };
    } catch (e) {
      if (e instanceof StorageUnavailableError) return { ok: false as const, reason: e.message };
      console.error(e);
      return { ok: false as const, reason: "Could not create a playback link" };
    }
  });

/* ---------------- Subtitles ---------------- */

export const requestSubtitleUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      episodeId: z.string().uuid(),
      languageCode: z.string().trim().min(2).max(12),
      label: z.string().trim().min(1).max(60),
      filename: z.string().trim().min(1).max(300),
      sizeBytes: z.number().int().positive(),
      isDefault: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const check = validateSubtitleFile({ name: data.filename, size: data.sizeBytes });
    if (!check.ok) return { ok: false as const, reason: check.error };
    const avail = await resolveActiveProvider(context);
    if (!avail.ok) return { ok: false as const, reason: avail.reason };
    const { data: ep } = await context.supabase.from("episodes").select("id, show_id").eq("id", data.episodeId).maybeSingle();
    if (!ep) return { ok: false as const, reason: "Episode not found" };
    const format = data.filename.toLowerCase().endsWith(".srt") ? "srt" : "vtt";
    const { data: sub, error } = await context.supabase
      .from("video_subtitles")
      .insert({
        episode_id: ep.id, show_id: ep.show_id, provider_id: avail.providerId, language_code: data.languageCode,
        label: data.label, format, original_filename: data.filename, file_size_bytes: data.sizeBytes,
        is_default: data.isDefault, upload_status: "pending",
      })
      .select("id")
      .single();
    if (error || !sub) throw new Error("Could not register subtitle");
    const key = buildStorageKey({ kind: "subtitle", showId: ep.show_id, episodeId: ep.id, assetId: sub.id, filename: data.filename });
    const { getAdapter, StorageUnavailableError } = await adapters();
    try {
      const upload = await getAdapter(avail.providerId).createSignedUpload({
        key, mimeType: format === "vtt" ? "text/vtt" : "application/x-subrip", sizeBytes: data.sizeBytes,
      });
      await context.supabase.from("video_subtitles").update({ storage_key: key, upload_status: "uploading" }).eq("id", sub.id);
      return { ok: true as const, subtitleId: sub.id as string, upload };
    } catch (e) {
      const reason = e instanceof StorageUnavailableError ? e.message : "Could not create a secure upload link";
      await context.supabase.from("video_subtitles").update({ upload_status: "failed" }).eq("id", sub.id);
      return { ok: false as const, reason };
    }
  });

export const finishSubtitleUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ subtitleId: z.string().uuid(), success: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase
      .from("video_subtitles")
      .update({ upload_status: data.success ? "uploaded" : "failed" })
      .eq("id", data.subtitleId)
      .eq("upload_status", "uploading");
    return { ok: true };
  });

export const deleteSubtitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: sub } = await context.supabase.from("video_subtitles").select("provider_id, storage_key, upload_status").eq("id", data.id).maybeSingle();
    if (sub?.storage_key && sub.provider_id && sub.upload_status === "uploaded") {
      const { getAdapter } = await adapters();
      try {
        await getAdapter(sub.provider_id as ProviderId).deleteObject(sub.storage_key);
      } catch (e) {
        console.error("Subtitle object delete failed", e);
        throw new Error("Could not remove the subtitle file from storage");
      }
    }
    const { error } = await context.supabase.from("video_subtitles").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete subtitle");
    return { ok: true };
  });
