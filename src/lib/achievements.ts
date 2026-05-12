import { supabase } from "@/integrations/supabase/client";

export type AchievementDef = {
  key: string;
  label: string;
  description: string;
  icon: string;
  goal: number;
  // computes current progress from stats payload
  progress: (s: AchievementStats) => number;
};

export type AchievementStats = {
  totalWords: number;
  knownWords: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  sessionsCount: number;
  perfectSession: boolean;
  nightOwl: boolean;
  earlyBird: boolean;
  // Quiz stats
  mcqCount: number;
  mcqPerfectCount: number;
  mcqStreakDays: number;
  mcqSpeed: boolean;
  sentenceCount: number;
  sentencePerfectCount: number;
  sentenceStreakDays: number;
  sentenceEloquent: boolean;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: "first_word", label: "First Word", description: "Swipe your very first word in a session.", icon: "Sparkles", goal: 1, progress: (s) => Math.min(s.totalWords, 1) },
  { key: "first_session", label: "First Session", description: "Complete your first full 6-word session.", icon: "Rocket", goal: 1, progress: (s) => Math.min(s.sessionsCount, 1) },
  { key: "seven_day_streak", label: "7 Day Streak", description: "Complete a session every day for 7 days in a row.", icon: "Flame", goal: 7, progress: (s) => Math.min(s.currentStreak, 7) },
  { key: "thirty_day_streak", label: "30 Day Streak", description: "Keep your streak alive for 30 days straight.", icon: "Flame", goal: 30, progress: (s) => Math.min(s.currentStreak, 30) },
  { key: "fifty_words", label: "50 Words Learned", description: "Add 50 words to your history.", icon: "BookOpen", goal: 50, progress: (s) => Math.min(s.totalWords, 50) },
  { key: "hundred_words", label: "100 Words Learned", description: "Add 100 words to your history.", icon: "Trophy", goal: 100, progress: (s) => Math.min(s.totalWords, 100) },
  { key: "night_owl", label: "Night Owl", description: "Complete a session between 10pm and 2am.", icon: "Moon", goal: 1, progress: (s) => (s.nightOwl ? 1 : 0) },
  { key: "early_bird", label: "Early Bird", description: "Complete a session between 5am and 8am.", icon: "Sunrise", goal: 1, progress: (s) => (s.earlyBird ? 1 : 0) },
  { key: "perfect_session", label: "Perfect Session", description: "Swipe Know It on all 6 words in a single session.", icon: "Target", goal: 1, progress: (s) => (s.perfectSession ? 1 : 0) },
  { key: "word_master", label: "Word Master", description: "Reach level 10 by earning 2,000 XP.", icon: "Crown", goal: 10, progress: (s) => Math.min(s.level, 10) },
  // MCQ
  { key: "first_quiz", label: "First Quiz", description: "Complete your first MCQ quiz.", icon: "Brain", goal: 1, progress: (s) => Math.min(s.mcqCount, 1) },
  { key: "quiz_streak_3", label: "Quiz Streak", description: "Complete an MCQ quiz 3 days in a row.", icon: "Zap", goal: 3, progress: (s) => Math.min(s.mcqStreakDays, 3) },
  { key: "perfect_score_mcq", label: "Perfect Score", description: "Get 5 out of 5 in an MCQ quiz.", icon: "Star", goal: 1, progress: (s) => Math.min(s.mcqPerfectCount, 1) },
  { key: "quiz_master_10", label: "Quiz Master", description: "Complete 10 MCQ quizzes total.", icon: "Trophy", goal: 10, progress: (s) => Math.min(s.mcqCount, 10) },
  { key: "sharp_mind_3", label: "Sharp Mind", description: "Get a perfect MCQ score 3 times.", icon: "Brain", goal: 3, progress: (s) => Math.min(s.mcqPerfectCount, 3) },
  { key: "speed_learner", label: "Speed Learner", description: "Complete an MCQ quiz in under 30 seconds.", icon: "Timer", goal: 1, progress: (s) => (s.mcqSpeed ? 1 : 0) },
  // Sentence builder
  { key: "first_sentence", label: "First Sentence", description: "Complete your first sentence builder session.", icon: "PenLine", goal: 1, progress: (s) => Math.min(s.sentenceCount, 1) },
  { key: "wordsmith", label: "Wordsmith", description: "Get an average rating of 5 in a sentence builder session.", icon: "Sparkles", goal: 1, progress: (s) => Math.min(s.sentencePerfectCount, 1) },
  { key: "sentence_streak_3", label: "Sentence Streak", description: "Complete a sentence builder session 3 days in a row.", icon: "Flame", goal: 3, progress: (s) => Math.min(s.sentenceStreakDays, 3) },
  { key: "prolific_writer_10", label: "Prolific Writer", description: "Complete 10 sentence builder sessions total.", icon: "BookOpen", goal: 10, progress: (s) => Math.min(s.sentenceCount, 10) },
  { key: "master_wordsmith_3", label: "Master Wordsmith", description: "Get a perfect average rating 3 times.", icon: "Crown", goal: 3, progress: (s) => Math.min(s.sentencePerfectCount, 3) },
  { key: "eloquent", label: "Eloquent", description: "Get a rating of 4 or above on all 5 sentences in a single session.", icon: "Star", goal: 1, progress: (s) => (s.sentenceEloquent ? 1 : 0) },
];

export const evaluateUnlocks = (s: AchievementStats): string[] =>
  ACHIEVEMENT_DEFS.filter((d) => d.progress(s) >= d.goal).map((d) => d.key);

const dayKey = (iso: string) => iso.slice(0, 10);
const consecutiveDays = (dates: string[]): number => {
  const set = new Set(dates.map(dayKey));
  let streak = 0;
  let cursor = new Date();
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

export const fetchAchievementData = async (userId: string) => {
  const [{ data: xp }, { data: streak }, totalWords, sessions, ach, mcq, sentence] = await Promise.all([
    supabase.from("xp").select("total_xp,level").eq("user_id", userId).maybeSingle(),
    supabase.from("streaks").select("current_streak,longest_streak").eq("user_id", userId).maybeSingle(),
    supabase.from("word_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("achievements").select("achievement_key,unlocked_at").eq("user_id", userId),
    supabase
      .from("quiz_history")
      .select("id,score,total_questions,time_taken_seconds,completed_at")
      .eq("user_id", userId)
      .eq("quiz_type", "mcq"),
    supabase
      .from("quiz_history")
      .select("id,score,completed_at")
      .eq("user_id", userId)
      .eq("quiz_type", "sentence_builder"),
  ]);

  const unlockedMap = new Map<string, string>(
    (ach.data ?? []).map((a: any) => [a.achievement_key, a.unlocked_at])
  );

  const mcqRows = mcq.data ?? [];
  const sentenceRows = sentence.data ?? [];

  // Eloquent check
  let sentenceEloquent = false;
  if (sentenceRows.length) {
    const ids = sentenceRows.map((r: any) => r.id);
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
    sentenceEloquent = Array.from(byQuiz.values()).some((rs) => rs.length >= 5 && rs.every((r) => r >= 4));
  }

  const stats: AchievementStats = {
    totalWords: totalWords.count ?? 0,
    knownWords: 0,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    level: xp?.level ?? 0,
    sessionsCount: sessions.count ?? 0,
    perfectSession: unlockedMap.has("perfect_session"),
    nightOwl: unlockedMap.has("night_owl"),
    earlyBird: unlockedMap.has("early_bird"),
    mcqCount: mcqRows.length,
    mcqPerfectCount: mcqRows.filter((r: any) => Number(r.score) >= Number(r.total_questions ?? 5)).length,
    mcqStreakDays: consecutiveDays(mcqRows.map((r: any) => r.completed_at)),
    mcqSpeed: mcqRows.some((r: any) => (r.time_taken_seconds ?? 999) <= 30),
    sentenceCount: sentenceRows.length,
    sentencePerfectCount: sentenceRows.filter((r: any) => Number(r.score) >= 5).length,
    sentenceStreakDays: consecutiveDays(sentenceRows.map((r: any) => r.completed_at)),
    sentenceEloquent,
  };

  return { stats, unlockedMap };
};
