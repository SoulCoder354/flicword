import { supabase } from "@/integrations/supabase/client";
import { LEVEL_XP } from "./userData";

export type SentenceAttemptInput = {
  word: string;
  sentence: string;
  rating: number;
  improvement_suggestion: string;
};

export type SaveQuizArgs = {
  userId: string;
  quizType: "mcq" | "sentence_builder";
  difficulty: string;
  score: number; // 0-5 for mcq, average rating for sentence
  totalQuestions?: number;
  timeTakenSeconds?: number;
  sentenceAttempts?: SentenceAttemptInput[];
};

const addXp = async (userId: string, amount: number) => {
  const { data: row } = await supabase.from("xp").select("total_xp").eq("user_id", userId).maybeSingle();
  const newTotal = (row?.total_xp ?? 0) + amount;
  await supabase.from("xp").upsert(
    { user_id: userId, total_xp: newTotal, level: Math.floor(newTotal / LEVEL_XP) },
    { onConflict: "user_id" },
  );
  return newTotal;
};

const updateStreak = async (userId: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data: stRow } = await supabase
    .from("streaks")
    .select("current_streak,longest_streak,last_session_date")
    .eq("user_id", userId)
    .maybeSingle();
  let current = stRow?.current_streak ?? 0;
  const last = stRow?.last_session_date;
  if (last !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    current = last === yesterday ? current + 1 : 1;
  }
  const longest = Math.max(stRow?.longest_streak ?? 0, current);
  await supabase
    .from("streaks")
    .upsert({ user_id: userId, current_streak: current, longest_streak: longest, last_session_date: today }, { onConflict: "user_id" });
};

const dayKey = (iso: string) => iso.slice(0, 10);

const evalConsecutiveDays = (dates: string[]): number => {
  // dates DESC; returns longest streak ending today
  const set = new Set(dates.map(dayKey));
  let streak = 0;
  let cursor = new Date();
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

const QUIZ_KEYS = {
  mcq: ["first_quiz", "quiz_streak_3", "perfect_score_mcq", "quiz_master_10", "sharp_mind_3", "speed_learner"],
  sentence_builder: [
    "first_sentence",
    "wordsmith",
    "sentence_streak_3",
    "prolific_writer_10",
    "master_wordsmith_3",
    "eloquent",
  ],
} as const;

const evaluateMcqAchievements = async (userId: string) => {
  const { data: history } = await supabase
    .from("quiz_history")
    .select("score,total_questions,time_taken_seconds,completed_at")
    .eq("user_id", userId)
    .eq("quiz_type", "mcq")
    .order("completed_at", { ascending: false });
  const rows = history ?? [];
  const total = rows.length;
  const perfectCount = rows.filter((r: any) => Number(r.score) >= 5).length;
  const speed = rows.some((r: any) => (r.time_taken_seconds ?? 999) <= 30);
  const streak = evalConsecutiveDays(rows.map((r: any) => r.completed_at));
  const out: string[] = [];
  if (total >= 1) out.push("first_quiz");
  if (streak >= 3) out.push("quiz_streak_3");
  if (perfectCount >= 1) out.push("perfect_score_mcq");
  if (total >= 10) out.push("quiz_master_10");
  if (perfectCount >= 3) out.push("sharp_mind_3");
  if (speed) out.push("speed_learner");
  return out;
};

const evaluateSentenceAchievements = async (userId: string) => {
  const { data: history } = await supabase
    .from("quiz_history")
    .select("id,score,completed_at")
    .eq("user_id", userId)
    .eq("quiz_type", "sentence_builder")
    .order("completed_at", { ascending: false });
  const rows = history ?? [];
  const total = rows.length;
  const perfectAvg = rows.filter((r: any) => Number(r.score) >= 5).length;
  const streak = evalConsecutiveDays(rows.map((r: any) => r.completed_at));

  // Eloquent: any session where every sentence rating >= 4
  let eloquent = false;
  if (rows.length) {
    const ids = rows.slice(0, 50).map((r: any) => r.id);
    const { data: atts } = await supabase
      .from("sentence_attempts")
      .select("quiz_id,rating")
      .in("quiz_id", ids);
    const byQuiz = new Map<string, number[]>();
    (atts ?? []).forEach((a: any) => {
      const arr = byQuiz.get(a.quiz_id) ?? [];
      arr.push(a.rating);
      byQuiz.set(a.quiz_id, arr);
    });
    eloquent = Array.from(byQuiz.values()).some((rs) => rs.length >= 5 && rs.every((r) => r >= 4));
  }

  const out: string[] = [];
  if (total >= 1) out.push("first_sentence");
  if (perfectAvg >= 1) out.push("wordsmith");
  if (streak >= 3) out.push("sentence_streak_3");
  if (total >= 10) out.push("prolific_writer_10");
  if (perfectAvg >= 3) out.push("master_wordsmith_3");
  if (eloquent) out.push("eloquent");
  return out;
};

const insertNewAchievements = async (userId: string, candidateKeys: string[]) => {
  if (!candidateKeys.length) return [] as string[];
  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", userId)
    .in("achievement_key", candidateKeys);
  const existingSet = new Set((existing ?? []).map((e: any) => e.achievement_key));
  const fresh = candidateKeys.filter((k) => !existingSet.has(k));
  if (fresh.length) {
    await supabase
      .from("achievements")
      .insert(fresh.map((k) => ({ user_id: userId, achievement_key: k })));
  }
  return fresh;
};

export const completeQuiz = async (args: SaveQuizArgs) => {
  const { userId, quizType, difficulty, score, totalQuestions = 5, timeTakenSeconds, sentenceAttempts } = args;

  const { data: quiz, error } = await supabase
    .from("quiz_history")
    .insert({
      user_id: userId,
      quiz_type: quizType,
      difficulty,
      score,
      total_questions: totalQuestions,
      time_taken_seconds: timeTakenSeconds ?? null,
    })
    .select("id")
    .single();
  if (error || !quiz) throw error;

  if (sentenceAttempts && sentenceAttempts.length) {
    await supabase.from("sentence_attempts").insert(
      sentenceAttempts.map((s) => ({
        user_id: userId,
        quiz_id: quiz.id,
        word: s.word,
        sentence_written: s.sentence,
        rating: s.rating,
        improvement_suggestion: s.improvement_suggestion,
      })),
    );
  }

  // XP
  let xpEarned = 30;
  if (quizType === "mcq" && score >= totalQuestions) xpEarned += 20;
  if (quizType === "sentence_builder" && score >= 4.5) xpEarned += 20;
  await addXp(userId, xpEarned);

  await updateStreak(userId);

  const candidates =
    quizType === "mcq" ? await evaluateMcqAchievements(userId) : await evaluateSentenceAchievements(userId);
  const newlyUnlocked = await insertNewAchievements(userId, candidates);

  return { quizId: quiz.id, xpEarned, newlyUnlocked };
};
