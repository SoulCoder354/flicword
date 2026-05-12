import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);

    // 1. Today's word already cached → return it (no API call).
    const { data: existing } = await supabase
      .from("word_of_the_day")
      .select("*")
      .eq("date", today)
      .maybeSingle();
    if (existing) return json(200, { word: existing, cached: true });

    // 2. Fetch every word ever used so GPT never repeats one.
    const { data: history } = await supabase
      .from("word_of_the_day")
      .select("word");
    const usedWords = new Set<string>(
      (history ?? []).map((r: any) => String(r.word).toLowerCase()),
    );

    const system =
      "You are a vocabulary education expert. Generate ONE advanced C1-C2 vocabulary word with full details. The word must NEVER repeat any word in the provided exclusion list. Return ONLY valid JSON, no markdown. Example sentences must feel natural and human written.";

    const buildPrompt = (excludeList: string[]) => `Exclude these words (do not pick any of them, case-insensitive): ${excludeList.length ? excludeList.join(", ") : "(none)"}

Return JSON in this EXACT shape:
{
  "word": "Ephemeral",
  "part_of_speech": "Adjective",
  "definition": "Lasting for a very short time",
  "etymology": "From Greek ephēmeros meaning lasting only a day",
  "synonyms": ["fleeting", "transient", "short-lived"],
  "antonyms": ["permanent", "enduring", "lasting"],
  "casual_use": "That perfect sunset was so ephemeral.",
  "professional_use": "Ephemeral cloud resources are torn down after each deploy."
}`;

    // 3. Try up to 4 times — regenerate if duplicate.
    let chosen: any = null;
    let exclude = Array.from(usedWords);
    for (let i = 0; i < 4; i++) {
      const data = await callOpenRouter(system, buildPrompt(exclude), { temperature: 0.95, functionName: "generate-word-of-the-day" });
      if (!data?.word) continue;
      if (!usedWords.has(String(data.word).toLowerCase())) {
        chosen = data;
        break;
      }
      exclude = [...exclude, data.word];
    }
    if (!chosen) throw new Error("Could not generate a unique word-of-the-day");

    const row = {
      word: chosen.word,
      part_of_speech: chosen.part_of_speech ?? null,
      definition: chosen.definition ?? null,
      etymology: chosen.etymology ?? null,
      synonyms: Array.isArray(chosen.synonyms) ? chosen.synonyms.join(", ") : (chosen.synonyms ?? null),
      antonyms: Array.isArray(chosen.antonyms) ? chosen.antonyms.join(", ") : (chosen.antonyms ?? null),
      casual_use: chosen.casual_use ?? null,
      professional_use: chosen.professional_use ?? null,
      date: today,
    };

    const { data: inserted, error } = await supabase
      .from("word_of_the_day")
      .insert(row)
      .select("*")
      .single();

    // Race: another invocation already inserted today's word — fetch it.
    if (error) {
      const { data: again } = await supabase
        .from("word_of_the_day")
        .select("*")
        .eq("date", today)
        .maybeSingle();
      if (again) return json(200, { word: again, cached: true });
      throw error;
    }

    return json(200, { word: inserted, cached: false });
  } catch (e) {
    console.error("generate-word-of-the-day error", e);
    return json(500, { error: String((e as any)?.message ?? e) });
  }
});
