import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { word, sentence } = await req.json();
    if (!word || !sentence) return json(400, { error: "word and sentence are required" });

    const system =
      "You are an expert English writing coach. Score a learner's sentence that uses the target word. Return ONLY valid JSON, no markdown.";

    const user = `Target word: "${word}"
Learner sentence: "${sentence}"

Evaluate clarity, grammar, and how naturally the target word is used. Return JSON in this EXACT shape:
{
  "score": 4,
  "feedback": "One short, friendly sentence with concrete tip.",
  "improved": "An optional improved version of the sentence."
}
"score" must be an integer 1-5.`;

    const data = await callOpenRouter(system, user, { temperature: 0.4, maxTokens: 400, functionName: "score-sentence" });
    const score = Math.max(1, Math.min(5, Math.round(Number(data?.score) || 0)));
    return json(200, {
      score,
      feedback: String(data?.feedback ?? ""),
      improved: String(data?.improved ?? ""),
    });
  } catch (e) {
    console.error("score-sentence error", e);
    return json(500, { error: String((e as any)?.message ?? e) });
  }
});
