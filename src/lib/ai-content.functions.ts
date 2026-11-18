import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const INSTRUCTIONS =
  "You write episode descriptions for NOVA, an Indian OTT streaming app. Given an episode title, a short synopsis " +
  "and optional series name, write one engaging, spoiler-light description of 2-4 sentences (40-80 words) that " +
  "hooks viewers to press play. Match the language of the synopsis (Hindi, Hinglish or English). " +
  "Return only the description text, with no quotes, headings or emojis.";

export const generateEpisodeDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().trim().min(1).max(200),
      synopsis: z.string().trim().min(3).max(1500),
      seriesName: z.string().trim().max(200).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin access only");

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const prompt = [
      data.seriesName ? `Series: ${data.seriesName}` : "",
      `Episode title: ${data.title}`,
      `Synopsis: ${data.synopsis}`,
    ].filter(Boolean).join("\n");
    try {
      const res = await generateResponse({ model: "openai/gpt-6-astra", instructions: INSTRUCTIONS, input: prompt });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type !== "message") continue;
        for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      text = text.trim();
      if (!text) return { description: "", error: "AI did not return a description. Please try again." };
      return { description: text, error: null as string | null };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI description failed", e.code, e.httpStatus);
        if (e.httpStatus === 429) return { description: "", error: "Too many requests. Please wait a moment and try again." };
        if (e.httpStatus === 402) return { description: "", error: "AI credits have run out. Please add credits to continue." };
        return { description: "", error: "AI service is unavailable right now. Please try again." };
      }
      throw e;
    }
  });
