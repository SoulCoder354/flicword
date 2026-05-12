// Shared OpenRouter helper for Flicword edge functions with primary + fallback keys.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_LIMIT_PER_HOUR = 80;

const getAdmin = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
};

const currentHourWindow = () => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

const getPrimaryHourCount = async (admin: any): Promise<number> => {
  if (!admin) return 0;
  try {
    const { count } = await admin
      .from("api_usage")
      .select("id", { count: "exact", head: true })
      .eq("key_name", "primary")
      .gte("hour_window", currentHourWindow());
    return count ?? 0;
  } catch (_e) {
    return 0;
  }
};

const logUsage = async (
  admin: any,
  keyName: "primary" | "fallback",
  functionName: string,
  success: boolean,
) => {
  if (!admin) return;
  try {
    await admin.from("api_usage").insert({
      key_name: keyName,
      call_count: 1,
      hour_window: currentHourWindow(),
      function_name: functionName,
      success,
    });
  } catch (e) {
    console.error("api_usage log failed:", e);
  }
};

class OpenRouterError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

const FALLBACK_STATUSES = new Set([401, 402, 429]);

async function singleCall(apiKey: string, body: unknown): Promise<any> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://flicword.app",
      "X-Title": "Flicword",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new OpenRouterError(res.status, `OpenRouter ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new OpenRouterError(500, "Empty response from OpenRouter");
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

const shouldFallback = (e: unknown) => {
  if (e instanceof OpenRouterError && FALLBACK_STATUSES.has(e.status)) return true;
  // network/timeout/abort/etc
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    if (m.includes("timeout") || m.includes("network") || m.includes("connection") || m.includes("fetch failed")) {
      return true;
    }
  }
  return false;
};

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  {
    temperature = 0.9,
    maxTokens = 600,
    model = "openai/gpt-4o",
    functionName = "unknown",
  }: { temperature?: number; maxTokens?: number; model?: string; functionName?: string } = {},
): Promise<any> {
  const primaryKey = Deno.env.get("OPENROUTER_API_KEY");
  const fallbackKey = Deno.env.get("OPENROUTER_API_KEY_FALLBACK");
  if (!primaryKey && !fallbackKey) {
    throw new Error("No OpenRouter API keys configured");
  }

  const body = {
    model,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  const admin = getAdmin();

  // Load balancing: route to fallback if primary already exceeded hourly limit
  let usePrimaryFirst = true;
  if (primaryKey && fallbackKey) {
    const primaryCount = await getPrimaryHourCount(admin);
    if (primaryCount >= PRIMARY_LIMIT_PER_HOUR) usePrimaryFirst = false;
  }
  if (!primaryKey) usePrimaryFirst = false;

  const tryKey = async (which: "primary" | "fallback", key: string) => {
    try {
      const result = await singleCall(key, body);
      await logUsage(admin, which, functionName, true);
      return result;
    } catch (e) {
      await logUsage(admin, which, functionName, false);
      throw e;
    }
  };

  // Primary path
  if (usePrimaryFirst && primaryKey) {
    try {
      return await tryKey("primary", primaryKey);
    } catch (e) {
      console.error(`[${functionName}] Primary key failed:`, e);
      if (!fallbackKey || !shouldFallback(e)) {
        // Retry primary once (transient errors not in fallback set)
        if (!fallbackKey) {
          try {
            return await tryKey("primary", primaryKey);
          } catch (e2) {
            throw e2;
          }
        }
      }
      // Fallback
      if (fallbackKey) {
        try {
          return await tryKey("fallback", fallbackKey);
        } catch (e2) {
          console.error(`[${functionName}] Fallback key also failed:`, e2);
          throw e2;
        }
      }
      throw e;
    }
  }

  // Start with fallback (load-balanced or primary missing)
  if (fallbackKey) {
    try {
      return await tryKey("fallback", fallbackKey);
    } catch (e) {
      console.error(`[${functionName}] Fallback key failed (load-balanced path):`, e);
      if (primaryKey) {
        try {
          return await tryKey("primary", primaryKey);
        } catch (e2) {
          console.error(`[${functionName}] Primary key also failed:`, e2);
          throw e2;
        }
      }
      throw e;
    }
  }

  throw new Error("No usable OpenRouter key");
}
