// Shared OpenRouter helper for Flicword edge functions with primary + 2 fallback keys.
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
const FALLBACK_LIMIT_PER_HOUR = 80;

type KeyName = "primary" | "fallback" | "fallback2" | "fallback3";

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

const getHourCount = async (admin: any, keyName: KeyName): Promise<number> => {
  if (!admin) return 0;
  try {
    const { count } = await admin
      .from("api_usage")
      .select("id", { count: "exact", head: true })
      .eq("key_name", keyName)
      .gte("hour_window", currentHourWindow());
    return count ?? 0;
  } catch (_e) {
    return 0;
  }
};

const logUsage = async (
  admin: any,
  keyName: KeyName,
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
  const fallback2Key = Deno.env.get("OPENROUTER_API_KEY_FALLBACK_2");
  const fallback3Key = Deno.env.get("OPENROUTER_API_KEY_FALLBACK_3");

  const available: { name: KeyName; key: string }[] = [];
  if (primaryKey) available.push({ name: "primary", key: primaryKey });
  if (fallbackKey) available.push({ name: "fallback", key: fallbackKey });
  if (fallback2Key) available.push({ name: "fallback2", key: fallback2Key });
  if (fallback3Key) available.push({ name: "fallback3", key: fallback3Key });

  if (available.length === 0) {
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

  // Load balancing: deprioritize keys that are over their hourly limit
  const ordered = [...available];
  if (available.length > 1) {
    try {
      const counts = await Promise.all(
        available.map((k) => getHourCount(admin, k.name)),
      );
      const limits: Record<KeyName, number> = {
        primary: PRIMARY_LIMIT_PER_HOUR,
        fallback: FALLBACK_LIMIT_PER_HOUR,
        fallback2: FALLBACK_LIMIT_PER_HOUR,
        fallback3: FALLBACK_LIMIT_PER_HOUR,
      };
      ordered.sort((a, b) => {
        const aOver = counts[available.indexOf(a)] >= limits[a.name] ? 1 : 0;
        const bOver = counts[available.indexOf(b)] >= limits[b.name] ? 1 : 0;
        return aOver - bOver;
      });
    } catch (_e) {
      // ignore, keep original order
    }
  }

  let lastErr: unknown = null;
  for (let i = 0; i < ordered.length; i++) {
    const { name, key } = ordered[i];
    try {
      const result = await singleCall(key, body);
      await logUsage(admin, name, functionName, true);
      return result;
    } catch (e) {
      await logUsage(admin, name, functionName, false);
      console.error(`[${functionName}] Key ${name} failed:`, e);
      lastErr = e;
      const hasNext = i < ordered.length - 1;
      if (!hasNext) break;
      // Only proceed to next key on fallback-eligible errors
      if (!shouldFallback(e)) break;
    }
  }
  throw lastErr ?? new Error("OpenRouter call failed");
}
