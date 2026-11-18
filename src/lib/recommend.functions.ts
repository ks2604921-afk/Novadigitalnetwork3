import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Recommendation = { title: string; why: string };
export type RecommendResult =
  | { ok: true; picks: Recommendation[] }
  | { ok: false; error: string; picks: Recommendation[] };

export const recommendTitles = createServerFn({ method: "POST" })
  .validator(
    z.object({
      mood: z.string().trim().min(1).max(300),
      catalog: z.array(z.string().trim().min(1).max(120)).min(1).max(200),
    }),
  )
  .handler(async ({ data }): Promise<RecommendResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false, error: "AI recommendations are not configured yet.", picks: [] };
    }
    let resp: Response;
    try {
      resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          max_completion_tokens: 600,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You are NOVA\'s recommendation engine. Pick up to 6 titles from the provided catalog that match the viewer\'s mood or preferred genres. Reply with json only, exactly this shape: {"picks":[{"title":"...","why":"one short sentence"}]}. Use only titles that appear verbatim in the catalog.',
            },
            {
              role: "user",
              content: `Viewer mood / preferred genres: ${data.mood}\nCatalog: ${data.catalog.join(", ")}\nRespond in json.`,
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Could not reach the recommendation service.", picks: [] };
    }
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`AI recommendation failed [${resp.status}]: ${body}`);
      return { ok: false, error: `Recommendation request failed (${resp.status}).`, picks: [] };
    }
    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content) as { picks?: unknown };
      const allowed = new Set(data.catalog);
      const picks: Recommendation[] = Array.isArray(parsed.picks)
        ? parsed.picks
            .filter(
              (p): p is { title: string; why?: unknown } =>
                typeof p === "object" &&
                p !== null &&
                typeof (p as { title?: unknown }).title === "string" &&
                allowed.has((p as { title: string }).title),
            )
            .slice(0, 6)
            .map((p) => ({
              title: p.title,
              why: typeof p.why === "string" && p.why.trim() ? p.why.trim() : "Matches your mood.",
            }))
        : [];
      if (picks.length === 0) {
        return { ok: false, error: "No matching titles found. Try a different mood.", picks: [] };
      }
      return { ok: true, picks };
    } catch {
      return { ok: false, error: "Could not read the AI response.", picks: [] };
    }
  });
