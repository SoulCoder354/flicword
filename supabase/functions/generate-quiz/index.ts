import { callOpenRouter, corsHeaders, json } from "../_shared/openrouter.ts";

const SYSTEM = `Generate exactly 5 vocabulary quiz questions for the difficulty level provided. Each question shows a definition and the user must pick the correct word from 4 options. Make the wrong options plausible and similar in theme to the correct answer to make it challenging. At the end include one short improvement tip based on the theme of the words. Return only valid JSON with no extra text or markdown.

Format:
{
  "questions": [
    { "definition": "...", "correct_answer": "Word", "options": ["Word","B","C","D"], "difficulty": "Medium" }
  ],
  "improvement_tip": "..."
}
The options array must have exactly 4 items and must include the correct_answer.`;

const shuffle = <T,>(a: T[]): T[] => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { difficulty = "Medium", exclude = [] } = await req.json().catch(() => ({}));
    const userPrompt = `Difficulty: ${difficulty}.${
      Array.isArray(exclude) && exclude.length ? ` Avoid these words: ${exclude.slice(0, 50).join(", ")}.` : ""
    }`;
    const data = await callOpenRouter(SYSTEM, userPrompt, { model: "openai/gpt-4o-mini", temperature: 0.95, maxTokens: 1500, functionName: "generate-quiz" });
    const questions = (data.questions ?? []).slice(0, 5).map((q: any) => {
      const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
      const final = opts.includes(q.correct_answer) ? opts : [q.correct_answer, ...opts].slice(0, 4);
      while (final.length < 4) final.push("—");
      return { ...q, options: shuffle(final) };
    });
    return json(200, { questions, improvement_tip: data.improvement_tip ?? "" });
  } catch (e) {
    console.error("generate-quiz error", e);
    return json(500, { error: (e as Error).message });
  }
});
