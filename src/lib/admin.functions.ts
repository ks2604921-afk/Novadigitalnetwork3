import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const [users, active, videos] = await Promise.all([
      db.from("users").select("id", { count: "exact", head: true }),
      db.from("users").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
      db.from("shows").select("id", { count: "exact", head: true }),
    ]);
    return {
      totalUsers: users.count ?? 0,
      activeSubscriptions: active.count ?? 0,
      totalVideos: videos.count ?? 0,
    };
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data, error } = await db
      .from("users")
      .select("id, phone, display_name, subscription_status, is_blocked, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Could not load users");
    return data ?? [];
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      subscription_status: z.enum(["active", "expired"]).optional(),
      is_blocked: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const patch: { subscription_status?: string; is_blocked?: boolean } = {};
    if (data.subscription_status) patch.subscription_status = data.subscription_status;
    if (typeof data.is_blocked === "boolean") patch.is_blocked = data.is_blocked;
    const { error } = await db.from("users").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update user");
    if (data.is_blocked) await db.from("sessions").delete().eq("user_id", data.id);
    return { ok: true };
  });

const videoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  video_url: z.string().trim().url().max(1000).or(z.literal("")),
  thumbnail_url: z.string().trim().url().max(1000).or(z.literal("")),
  category: z.string().trim().max(100).default(""),
  content_type: z.enum(["movie", "series", "serial", "video"]),
});

export const listAdminVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("shows")
      .select("id, title, description, video_url, thumbnail_url, category, content_type, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load videos");
    return (data ?? []) as Array<{
      id: string;
      title: string;
      description: string | null;
      video_url: string | null;
      thumbnail_url: string | null;
      category: string | null;
      content_type: string;
      created_at: string;
    }>;
  });

export const saveAdminVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(videoSchema.extend({ id: z.string().uuid().optional() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const row = {
      ...rest,
      description: rest.description || null,
      thumbnail_url: rest.thumbnail_url || null,
      category: rest.category || null,
      video_url: rest.video_url || null,
    };
    const q = id
      ? context.supabase.from("shows").update(row).eq("id", id)
      : context.supabase.from("shows").insert(row);
    const { error } = await q;
    if (error) throw new Error("Could not save video");
    return { ok: true };
  });

export const deleteAdminVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("episodes").delete().eq("show_id", data.id);
    await context.supabase.from("seasons").delete().eq("show_id", data.id);
    const { error } = await context.supabase.from("shows").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete video");
    return { ok: true };
  });

// ---------- Banners (featured shows on Home) ----------
export const listAdminBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("shows")
      .select("id, title, banner_url, thumbnail_url, mobile_banner_url, banner_start_at, banner_end_at, is_featured, content_type")
      .eq("is_featured", true)
      .order("updated_at", { ascending: false });
    if (error) throw new Error("Could not load banners");
    return (data ?? []) as Array<{
      id: string; title: string; banner_url: string | null; thumbnail_url: string | null;
      mobile_banner_url: string | null; banner_start_at: string | null; banner_end_at: string | null;
      is_featured: boolean; content_type: string;
    }>;
  });

export const setAdminBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      is_featured: z.boolean(),
      banner_url: z.string().trim().url().max(1000).or(z.literal("")).optional(),
      mobile_banner_url: z.string().trim().url().max(1000).or(z.literal("")).optional(),
      banner_start_at: z.string().datetime().nullable().optional(),
      banner_end_at: z.string().datetime().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: {
      is_featured: boolean; banner_url?: string | null; mobile_banner_url?: string | null;
      banner_start_at?: string | null; banner_end_at?: string | null;
    } = { is_featured: data.is_featured };
    if (data.banner_url !== undefined) patch.banner_url = data.banner_url || null;
    if (data.mobile_banner_url !== undefined) patch.mobile_banner_url = data.mobile_banner_url || null;
    if (data.banner_start_at !== undefined) patch.banner_start_at = data.banner_start_at;
    if (data.banner_end_at !== undefined) patch.banner_end_at = data.banner_end_at;
    if (patch.banner_start_at && patch.banner_end_at && patch.banner_end_at <= patch.banner_start_at) {
      throw new Error("End date must be after start date");
    }
    const { error } = await context.supabase.from("shows").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update banner");
    return { ok: true };
  });

// ---------- Seasons & Episodes ----------
export const listAdminSeasons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ showId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("seasons")
      .select("id, season_number, title, episodes(id, episode_number, title, description, thumbnail_url, stream_url, duration_seconds)")
      .eq("show_id", data.showId)
      .order("season_number");
    if (error) throw new Error("Could not load seasons");
    return ((rows ?? []) as Array<{
      id: string; season_number: number; title: string | null;
      episodes: Array<{ id: string; episode_number: number; title: string; description: string | null;
        thumbnail_url: string | null; stream_url: string | null; duration_seconds: number | null }>;
    }>).map((s) => ({ ...s, episodes: [...s.episodes].sort((a, b) => a.episode_number - b.episode_number) }));
  });

export const saveAdminSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      show_id: z.string().uuid(),
      season_number: z.number().int().min(1).max(999),
      title: z.string().trim().max(200).default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const row = { ...rest, title: rest.title || null };
    const { error } = id
      ? await context.supabase.from("seasons").update(row).eq("id", id)
      : await context.supabase.from("seasons").insert(row);
    if (error) throw new Error("Could not save season");
    return { ok: true };
  });

export const deleteAdminSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("episodes").delete().eq("season_id", data.id);
    const { error } = await context.supabase.from("seasons").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete season");
    return { ok: true };
  });

export const saveAdminEpisode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      show_id: z.string().uuid(),
      season_id: z.string().uuid(),
      episode_number: z.number().int().min(1).max(9999),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).default(""),
      stream_url: z.string().trim().url().max(1000),
      thumbnail_url: z.string().trim().url().max(1000).or(z.literal("")),
      duration_minutes: z.number().int().min(0).max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, duration_minutes, ...rest } = data;
    const row = {
      ...rest,
      description: rest.description || null,
      thumbnail_url: rest.thumbnail_url || null,
      duration_seconds: duration_minutes ? duration_minutes * 60 : null,
    };
    const { error } = id
      ? await context.supabase.from("episodes").update(row).eq("id", id)
      : await context.supabase.from("episodes").insert(row);
    if (error) throw new Error("Could not save episode");
    return { ok: true };
  });

export const deleteAdminEpisode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("episodes").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete episode");
    return { ok: true };
  });
