import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

const SYSTEM = `Generate exactly 5 vocabulary words for the difficulty level provided for a sentence writing exercise. Return only valid JSON with no extra text or markdown.

Format:
{
  "words": [
    { "word": "Resilient", "part_of_speech": "Adjective", "difficulty": "Medium" }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { difficulty = "Medium", exclude = [] } = await req.json().catch(() => ({}));
    const userPrompt = `Difficulty: ${difficulty}.${
      Array.isArray(exclude) && exclude.length ? ` Avoid these words: ${exclude.slice(0, 50).join(", ")}.` : ""
    }`;
    const data = await callOpenRouter(SYSTEM, userPrompt, { model: "openai/gpt-4o-mini", temperature: 0.95, maxTokens: 700, functionName: "generate-sentence-words" });
    return json(200, { words: (data.words ?? []).slice(0, 5) });
  } catch (e) {
    console.error("generate-sentence-words error", e);
    return json(500, { error: (e as Error).message });
  }
});
