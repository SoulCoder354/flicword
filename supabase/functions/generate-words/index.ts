import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topic, difficulty } = await req.json();
    if (!topic || !difficulty) return json(400, { error: "topic and difficulty are required" });

    const system =
      `You are a vocabulary education expert. Generate exactly 6 vocabulary words for the topic and difficulty provided. Return only valid JSON with no extra text, explanation, or markdown. Every word must be appropriate for the difficulty level:
- Easy: common everyday words (A2-B1 level)
- Medium: intermediate words (B1-B2 level)
- Hard: advanced and complex words (C1-C2 level)
All example sentences must feel natural and human written.`;

    const user = `Topic: ${topic}
Difficulty: ${difficulty}

Return JSON in this EXACT shape (6 entries):
{
  "words": [
    {
      "word": "Innovative",
      "part_of_speech": "Adjective",
      "definition": "Introducing new ideas or methods",
      "etymology": "From Latin innovare meaning to renew",
      "synonyms": ["creative", "original", "pioneering"],
      "antonyms": ["conventional", "traditional", "outdated"],
      "casual_use": "That new coffee shop has such an innovative menu.",
      "professional_use": "The company implemented innovative strategies to improve efficiency.",
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }
  ]
}`;

    const data = await callOpenRouter(system, user, { temperature: 0.85, functionName: "generate-words" });
    if (!Array.isArray(data?.words) || data.words.length === 0) {
      throw new Error("Invalid words payload");
    }
    return json(200, { words: data.words.slice(0, 6) });
  } catch (e) {
    console.error("generate-words error", e);
    return json(500, { error: String(e?.message ?? e) });
  }
});
