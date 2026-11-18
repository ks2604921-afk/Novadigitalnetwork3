import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Phone OTP + PIN auth, ported from the original Bolt edge function.
type SessionOut = { token: string; user: { id: string; phone: string; display_name: string | null } };
type Payload = {
  error?: string;
  message?: string;
  otp?: string;
  is_new?: boolean;
  needs_pin?: boolean;
  user_id?: string;
  session?: SessionOut;
};
type Result = { ok: boolean; status: number; data: Payload };

const PHONE_RE = /^\+?[1-9]\d{7,14}$/;
const PIN_RE = /^\d{4}$/;

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(n: number) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return hex(b);
}
async function sha256Hex(input: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return hex(new Uint8Array(h));
}
function generateOtp() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return (100000 + ((b[0] ?? 0) % 900000)).toString();
}
class BlockedError extends Error {}
const r = (data: Payload, status = 200): Result => ({
  ok: status < 400,
  status,
  data,
});

export const authAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      action: z.enum(["request-otp", "verify-otp", "set-pin", "login-pin", "me", "logout"]),
      payload: z
        .object({
          phone: z.string().max(20).optional(),
          pin: z.string().max(10).optional(),
          code: z.string().max(10).optional(),
          token: z.string().max(200).optional(),
        })
        .default({}),
    }),
  )
  .handler(async ({ data: { action, payload } }): Promise<Result> => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const phone = String(payload.phone ?? "").trim();
    const pin = String(payload.pin ?? "").trim();

    const startSession = async (user: SessionOut['user']): Promise<SessionOut | null> => {
      const { data: flags } = await db.from("users").select("is_blocked").eq("id", user.id).maybeSingle();
      if (flags?.is_blocked) throw new BlockedError();
      const token = randomHex(32);
      const expires_at = new Date(Date.now() + 30 * 864e5).toISOString();
      const { error } = await db.from("sessions").insert({ token, user_id: user.id, expires_at });
      if (error) return null;
      return { token, user: { id: user.id, phone: user.phone, display_name: user.display_name } };
    };

    try {
      if (action === "request-otp") {
        if (!PHONE_RE.test(phone)) return r({ error: "Enter a valid mobile number with country code." }, 400);
        const { data: existing } = await db.from("users").select("id").eq("phone", phone).maybeSingle();
        let isNew = false;
        if (!existing) {
          const { error } = await db.from("users").insert({ phone });
          if (error) return r({ error: "Could not start signup. Try again." }, 500);
          isNew = true;
        }
        const code = generateOtp();
        const { error } = await db
          .from("otp_codes")
          .insert({ phone, code, expires_at: new Date(Date.now() + 10 * 60000).toISOString() });
        if (error) return r({ error: "Could not send OTP. Try again." }, 500);
        // Real SMS via:
        // 1. Direct Twilio REST API (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER)
        // 2. MSG91 OTP API (MSG91_AUTH_KEY + MSG91_TEMPLATE_ID)
        // 3. Lovable Twilio Connector Gateway (TWILIO_API_KEY + LOVABLE_API_KEY + TWILIO_FROM_NUMBER)
        // Otherwise demo mode returns the code so it can be shown on screen.
        const to = phone.startsWith("+") ? phone : `+${phone}`;
        const accountSid = process.env["TWILIO_ACCOUNT_SID"]?.trim();
        const authToken = process.env["TWILIO_AUTH_TOKEN"]?.trim();
        const twilioKey = process.env["TWILIO_API_KEY"]?.trim();
        const lovableKey = process.env["LOVABLE_API_KEY"]?.trim();
        const fromNumber = process.env["TWILIO_FROM_NUMBER"]?.trim();
        const msg91Key = process.env["MSG91_AUTH_KEY"]?.trim();
        const msg91TemplateId = process.env["MSG91_TEMPLATE_ID"]?.trim();

        if (accountSid && authToken && fromNumber) {
          const basic = btoa(`${accountSid}:${authToken}`);
          const sms = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: to,
                From: fromNumber,
                Body: `Your NOVA verification code is ${code}. It expires in 10 minutes.`,
              }),
            },
          );
          if (sms.ok) return r({ message: "OTP sent", is_new: isNew });
          const errBody = await sms.text();
          console.error(`Twilio SMS failed [${sms.status}]: ${errBody}`);
          return r({ error: "Could not deliver the SMS. Try again." }, 502);
        }

        if (msg91Key && msg91TemplateId) {
          const sms = await fetch("https://control.msg91.com/api/v5/otp", {
            method: "POST",
            headers: {
              authkey: msg91Key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              template_id: msg91TemplateId,
              mobile: to.replace(/^\+/, ""),
              otp: code,
            }),
          });
          if (sms.ok) return r({ message: "OTP sent", is_new: isNew });
          const errBody = await sms.text();
          console.error(`MSG91 SMS failed [${sms.status}]: ${errBody}`);
          return r({ error: "Could not deliver the SMS. Try again." }, 502);
        }

        if (twilioKey && lovableKey && fromNumber) {
          const sms = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": twilioKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: to,
              From: fromNumber,
              Body: `Your NOVA verification code is ${code}. It expires in 10 minutes.`,
            }),
          });
          if (sms.ok) return r({ message: "OTP sent", is_new: isNew });
          const errBody = await sms.text();
          console.error(`Twilio SMS failed [${sms.status}]: ${errBody}`);
          return r({ error: "Could not deliver the SMS. Try again." }, 502);
        }
        return r({ message: "OTP sent", otp: code, is_new: isNew });
      }

      if (action === "verify-otp") {
        const code = String(payload.code ?? "").trim();
        if (!PHONE_RE.test(phone) || !/^\d{6}$/.test(code))
          return r({ error: "Enter a valid mobile number and 6-digit code." }, 400);
        const { data: otp } = await db
          .from("otp_codes")
          .select("id, expires_at, consumed")
          .eq("phone", phone)
          .eq("code", code)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!otp || otp.consumed) return r({ error: "Invalid code." }, 400);
        if (new Date(otp.expires_at).getTime() < Date.now())
          return r({ error: "Code expired. Request a new one." }, 400);
        await db.from("otp_codes").update({ consumed: true }).eq("id", otp.id);
        const { data: user } = await db
          .from("users")
          .select("id, phone, display_name")
          .eq("phone", phone)
          .maybeSingle();
        if (!user) return r({ error: "Account not found." }, 404);
        const session = await startSession(user);
        if (!session) return r({ error: "Could not start session." }, 500);
        return r({ message: "Logged in", session });
      }

      if (action === "set-pin") {
        if (!PHONE_RE.test(phone) || !PIN_RE.test(pin))
          return r({ error: "Enter a valid mobile number and a 4-digit PIN." }, 400);
        const salt = randomHex(16);
        const { error } = await db
          .from("users")
          .update({ pin_hash: await sha256Hex(salt + pin), pin_salt: salt })
          .eq("phone", phone);
        if (error) return r({ error: "Could not save PIN. Try again." }, 500);
        const { data: user } = await db
          .from("users")
          .select("id, phone, display_name")
          .eq("phone", phone)
          .maybeSingle();
        if (!user) return r({ error: "Account not found." }, 404);
        const session = await startSession(user);
        if (!session) return r({ error: "Could not start session." }, 500);
        return r({ message: "PIN set", session });
      }

      if (action === "login-pin") {
        if (!PHONE_RE.test(phone) || !PIN_RE.test(pin))
          return r({ error: "Enter a valid mobile number and a 4-digit PIN." }, 400);
        const { data: user } = await db
          .from("users")
          .select("id, phone, display_name, pin_hash, pin_salt")
          .eq("phone", phone)
          .maybeSingle();
        if (!user || !user.pin_hash || !user.pin_salt)
          return r({ error: "No PIN set for this number. Sign up first." }, 400);
        if ((await sha256Hex(user.pin_salt + pin)) !== user.pin_hash)
          return r({ error: "Incorrect PIN. Try again." }, 401);
        const session = await startSession(user);
        if (!session) return r({ error: "Could not start session." }, 500);
        return r({ message: "Logged in", session });
      }

      const token = String(payload.token ?? "").trim();
      if (action === "me") {
        if (!token) return r({ error: "No session." }, 401);
        const { data: sess } = await db
          .from("sessions")
          .select("user_id, expires_at")
          .eq("token", token)
          .maybeSingle();
        if (!sess || new Date(sess.expires_at).getTime() < Date.now())
          return r({ error: "Session expired." }, 401);
        const { data: user } = await db
          .from("users")
          .select("id, phone, display_name, is_blocked")
          .eq("id", sess.user_id)
          .maybeSingle();
        if (!user) return r({ error: "Account not found." }, 404);
        if (user.is_blocked) return r({ error: "This account has been blocked." }, 403);
        return r({ session: { token, user: { id: user.id, phone: user.phone, display_name: user.display_name } } });
      }

      // logout
      if (token) await db.from("sessions").delete().eq("token", token);
      return r({ message: "Logged out" });
    } catch (err) {
      if (err instanceof BlockedError) return r({ error: "This account has been blocked. Contact support." }, 403);
      console.error(err);
      return r({ error: "Server error" }, 500);
    }
  });
