import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let exclude: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.exclude)) exclude = body.exclude;
    } catch (_) {/* no body */}

    const system =
      "You generate fresh, engaging vocabulary-learning topics. Return ONLY valid JSON, no markdown.";
    const user = `Generate exactly 3 different vocabulary topics for a learner. Each topic must be broad enough to have many words but specific enough to be interesting. Examples: Technology, Business, Travel, Science, Food, Sports, Medicine, Law, Nature, Psychology, History, Art, Music, Architecture, Cinema, Philosophy, Astronomy, Cooking.

Avoid these recently-shown topics: ${exclude.join(", ") || "(none)"}.

Return JSON in this EXACT shape:
{
  "topics": [
    { "name": "Technology", "emoji": "💻", "description": "Words from the world of tech and innovation" }
  ]
}
Use a single relevant emoji per topic. Description must be 4–8 words.`;

    const data = await callOpenRouter(system, user, { temperature: 1.0, functionName: "generate-topics" });
    if (!Array.isArray(data?.topics) || data.topics.length !== 3) {
      throw new Error("Invalid topics payload");
    }
    return json(200, data);
  } catch (e) {
    console.error("generate-topics error", e);
    return json(500, { error: String(e?.message ?? e) });
  }
});
