import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LiveChannel = Database["public"]["Tables"]["live_channels"]["Row"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin access only");
}

/** Public: active channels for the app's Live TV section. */
export const listLiveChannels = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [] as LiveChannel[];
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await db
    .from("live_channels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) return [] as LiveChannel[];
  return (data ?? []) as LiveChannel[];
});

export const listAdminChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("live_channels").select("*").order("sort_order").order("name");
    if (error) throw new Error("Could not load channels");
    return (data ?? []) as LiveChannel[];
  });

const channelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  logo_url: z.string().trim().url().max(1000).or(z.literal("")),
  category: z.string().trim().min(1).max(60),
  language: z.string().trim().max(60),
  stream_url: z.string().trim().url().max(1000),
  description: z.string().trim().max(1000),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const saveAdminChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(channelSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const row = {
      ...rest,
      logo_url: rest.logo_url || null,
      language: rest.language || null,
      description: rest.description || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = id
      ? await context.supabase.from("live_channels").update(row).eq("id", id)
      : await context.supabase.from("live_channels").insert(row);
    if (error) throw new Error("Could not save channel");
    return { ok: true };
  });

export const deleteAdminChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("live_channels").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete channel");
    return { ok: true };
  });
