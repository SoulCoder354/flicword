import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

const SYSTEM = `You are a vocabulary and grammar expert. Evaluate whether the user has used the given word correctly and naturally in their sentence. Rate the sentence out of 5 and give one specific suggestion on how they could improve their use of this word. Return only valid JSON with no extra text or markdown.

Format:
{
  "rating": 4,
  "quick_feedback": "Great use of the word!",
  "improvement_suggestion": "..."
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { word, sentence } = await req.json();
    if (!word || !sentence) return json(400, { error: "word and sentence required" });
    const data = await callOpenRouter(
      SYSTEM,
      `Word: ${word}\nUser sentence: ${sentence}`,
      { model: "openai/gpt-4o-mini", temperature: 0.4, maxTokens: 400, functionName: "evaluate-sentence" },
    );
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 0)));
    return json(200, {
      rating,
      quick_feedback: data.quick_feedback ?? "",
      improvement_suggestion: data.improvement_suggestion ?? "",
    });
  } catch (e) {
    console.error("evaluate-sentence error", e);
    return json(500, { error: (e as Error).message });
  }
});
