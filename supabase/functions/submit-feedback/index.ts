import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/openrouter.ts";

const TARGET_EMAIL = "adithyashyam1@gmail.com";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "Unauthorized" });

    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim();
    if (!message) return json(400, { error: "message is required" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "Supabase is not configured" });
    if (!brevoApiKey) {
      return json(500, {
        error: "BREVO_API_KEY is missing in the Supabase edge function secrets",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json(401, { error: "Unauthorized" });

    const user = userData.user;
    const { data: profile } = await supabase
      .from("users")
      .select("name,email")
      .eq("id", user.id)
      .maybeSingle();

    const fromEmail = Deno.env.get("BREVO_SENDER_EMAIL") ?? "adithyashyam1@gmail.com";
    const fromName = Deno.env.get("BREVO_SENDER_NAME") ?? "FlicWord";
    const displayName = profile?.name?.trim() || user.user_metadata?.name || "Anonymous";
    const replyTo = profile?.email || user.email || undefined;

    const subject = `New Flicword feedback from ${displayName}`;
    const textContent = [
      `User: ${displayName}`,
      `Email: ${replyTo ?? "unknown"}`,
      `User ID: ${user.id}`,
      "",
      message,
    ].join("\n");

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: TARGET_EMAIL }],
        replyTo: replyTo ? { email: replyTo, name: displayName } : undefined,
        subject,
        textContent,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
            <h2 style="margin:0 0 12px">New Flicword feedback</h2>
            <p><strong>User:</strong> ${escapeHtml(displayName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(replyTo ?? "unknown")}</p>
            <p><strong>User ID:</strong> ${escapeHtml(user.id)}</p>
            <div style="margin-top:16px;padding:12px;border-left:4px solid #d4a853;background:#f8f5ec;white-space:pre-wrap">${escapeHtml(message)}</div>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo send failed", brevoResponse.status, errorText);
      return json(502, { error: "Could not send feedback email" });
    }

    const { error: insertError } = await supabase.from("feedback").insert({
      user_id: user.id,
      message,
    });
    if (insertError) {
      console.error("Feedback insert failed", insertError);
    }

    return json(200, { ok: true });
  } catch (e) {
    console.error("submit-feedback error", e);
    return json(500, { error: String((e as any)?.message ?? e) });
  }
});