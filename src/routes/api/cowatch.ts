import { createFileRoute } from "@tanstack/react-router";
import {
  addCoWatchMessage,
  createCoWatchRoom,
  endCoWatchRoom,
  getCoWatchRoom,
  joinCoWatchRoom,
  leaveCoWatchRoom,
  normalizeRoomId,
  setCoWatchControlMode,
  subscribeCoWatchRoom,
  syncCoWatchPlayback,
  type CompanionMessageKind,
  type ControlMode,
} from "@/lib/cowatch-hub.server";

export const Route = createFileRoute("/api/cowatch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawRoom = url.searchParams.get("room") ?? "";
        const roomId = normalizeRoomId(rawRoom);
        if (!roomId) {
          return Response.json({ error: "Missing room ID." }, { status: 400 });
        }

        const wantsStream =
          url.searchParams.get("stream") === "1" ||
          (request.headers.get("accept") ?? "").includes("text/event-stream");

        if (!wantsStream) {
          const room = getCoWatchRoom(roomId);
          if (!room) {
            return Response.json({ error: "Room not found." }, { status: 404 });
          }
          return Response.json({ room });
        }

        const encoder = new TextEncoder();
        let unsubscribe: (() => void) | undefined;
        let keepAlive: ReturnType<typeof setInterval> | undefined;

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const sendEvent = (eventName: string, payload: unknown) => {
              try {
                controller.enqueue(
                  encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`),
                );
              } catch {
                /* stream already closed */
              }
            };

            const initial = getCoWatchRoom(roomId);
            if (initial) {
              sendEvent(initial.closed ? "room:ended" : "room:state", {
                type: initial.closed ? "room:ended" : "room:state",
                room: initial,
              });
            }

            unsubscribe = subscribeCoWatchRoom(roomId, (event) => {
              sendEvent(event.type, event);
            });

            keepAlive = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(": keep-alive\n\n"));
              } catch {
                if (keepAlive) clearInterval(keepAlive);
              }
            }, 20_000);

            request.signal.addEventListener("abort", () => {
              if (keepAlive) clearInterval(keepAlive);
              unsubscribe?.();
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            });
          },
          cancel() {
            if (keepAlive) clearInterval(keepAlive);
            unsubscribe?.();
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
        }

        const action = typeof body["action"] === "string" ? body["action"] : "";
        const roomId = normalizeRoomId(typeof body["roomId"] === "string" ? body["roomId"] : "");
        if (!roomId) {
          return Response.json({ error: "Invalid roomId." }, { status: 400 });
        }

        switch (action) {
          case "create": {
            const room = createCoWatchRoom({
              roomId,
              title: typeof body["title"] === "string" ? body["title"] : "NOVA Stream",
              hostId: typeof body["hostId"] === "string" ? body["hostId"] : "host",
              hostName: typeof body["hostName"] === "string" ? body["hostName"] : "TV Host",
              playing: Boolean(body["playing"]),
              currentTime: typeof body["currentTime"] === "number" ? body["currentTime"] : 0,
              controlMode:
                body["controlMode"] === "everyone" ? "everyone" : "host-only",
            });
            return Response.json({ ok: true, room });
          }

          case "join": {
            const participantId =
              typeof body["participantId"] === "string" ? body["participantId"] : "guest";
            const room = joinCoWatchRoom({
              roomId,
              participantId,
              name: typeof body["name"] === "string" ? body["name"] : "Mobile Companion",
              title: typeof body["title"] === "string" ? body["title"] : undefined,
            });
            return Response.json({ ok: true, room });
          }

          case "set-control-mode": {
            const actorId = typeof body["actorId"] === "string" ? body["actorId"] : "";
            const controlMode: ControlMode =
              body["controlMode"] === "everyone" ? "everyone" : "host-only";
            const result = setCoWatchControlMode({ roomId, actorId, controlMode });
            if (!result.ok) {
              return Response.json({ error: result.error }, { status: result.status });
            }
            return Response.json({ ok: true, room: result.room });
          }

          case "sync-playback": {
            const actorId = typeof body["actorId"] === "string" ? body["actorId"] : "";
            const playing = Boolean(body["playing"]);
            const currentTime =
              typeof body["currentTime"] === "number" ? body["currentTime"] : 0;
            const result = syncCoWatchPlayback({
              roomId,
              actorId,
              playing,
              currentTime,
            });
            if (!result.ok) {
              return Response.json({ error: result.error }, { status: result.status });
            }
            return Response.json({ ok: true, room: result.room });
          }

          case "send-message": {
            const kind: CompanionMessageKind =
              body["kind"] === "comment" || body["kind"] === "feedback"
                ? body["kind"]
                : "chat";
            const id =
              typeof body["id"] === "string" && body["id"]
                ? body["id"]
                : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const author =
              typeof body["author"] === "string" ? body["author"] : "Companion";
            const text = typeof body["text"] === "string" ? body["text"] : "";
            const result = addCoWatchMessage({ roomId, id, author, kind, text });
            if (!result.ok) {
              return Response.json({ error: result.error }, { status: result.status });
            }
            return Response.json({ ok: true, room: result.room });
          }

          case "leave": {
            const participantId =
              typeof body["participantId"] === "string" ? body["participantId"] : "";
            const result = leaveCoWatchRoom({ roomId, participantId });
            return Response.json(result);
          }

          case "end": {
            const actorId = typeof body["actorId"] === "string" ? body["actorId"] : "";
            const result = endCoWatchRoom({ roomId, actorId });
            if (!result.ok) {
              return Response.json({ error: result.error }, { status: result.status });
            }
            return Response.json({ ok: true, room: result.room });
          }

          default:
            return Response.json({ error: "Unsupported Co-Watch action." }, { status: 400 });
        }
      },
    },
  },
});
