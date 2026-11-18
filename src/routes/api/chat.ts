import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";

const INSTRUCTIONS =
  "You are NOVA AI, the friendly assistant inside the NOVA streaming app (series, TV, sports, clips). " +
  "Help viewers pick what to watch based on mood, genre, language or time available, explain plans " +
  "(Trial, Standard ₹40/month, Premium ₹130/month, Super Premium ₹150/month) and answer app questions. " +
  "Reply in the user's language (Hindi, Hinglish or English). Keep answers short and warm, use small lists for suggestions.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI chat is not configured yet." }, { status: 500 });

        let body: { messages?: unknown };
        try {
          body = (await request.json()) as { messages?: unknown };
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
          return Response.json({ error: "Invalid conversation." }, { status: 400 });
        }

        const { createResponsesCall } = await import("@/lib/ai-gateway/responses");
        const modelMessages = await convertToModelMessages(messages as UIMessage[]);
        return createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          modelMessages,
          INSTRUCTIONS,
        ).response();
      },
    },
  },
});
