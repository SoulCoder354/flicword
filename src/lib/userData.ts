import { supabase } from "@/integrations/supabase/client";

export const LEVEL_XP = 200; // xp per level

export type UserStats = {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  todayWordsCount: number;
  weekWordsCount: number;
  monthWordsCount: number;
  totalWordsCount: number;
  achievementsUnlocked: number;
};

const startOf = (offsetDays: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const [{ data: xp }, { data: streak }, todayCount, weekCount, monthCount, totalCount, ach] = await Promise.all([
    supabase.from("xp").select("total_xp,level").eq("user_id", userId).maybeSingle(),
    supabase.from("streaks").select("current_streak,longest_streak,last_session_date").eq("user_id", userId).maybeSingle(),
    supabase.from("word_history").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", startOf(0)),
    supabase.from("word_history").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", startOf(6)),
    supabase.from("word_history").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", startOf(29)),
    supabase.from("word_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("achievements").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return {
    totalXp: xp?.total_xp ?? 0,
    level: xp?.level ?? 0,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    lastSessionDate: streak?.last_session_date ?? null,
    todayWordsCount: todayCount.count ?? 0,
    weekWordsCount: weekCount.count ?? 0,
    monthWordsCount: monthCount.count ?? 0,
    totalWordsCount: totalCount.count ?? 0,
    achievementsUnlocked: ach.count ?? 0,
  };
};

export const SESSION_XP = 50;

export type SessionWordResult = {
  word: string;
  known: boolean;
  part_of_speech?: string;
  definition?: string;
  etymology?: string;
  synonyms?: string[] | string;
  antonyms?: string[] | string;
  casual_use?: string;
  professional_use?: string;
};

export const completeSession = async (
  userId: string,
  topic: string,
  difficulty: string,
  results: SessionWordResult[]
) => {
  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: userId, topic, difficulty })
    .select("id")
    .single();
  if (sErr || !session) throw sErr;

  const toStr = (v: unknown) => Array.isArray(v) ? v.join(", ") : (v as string | undefined) ?? null;
  const rows = results.map((r) => ({
    user_id: userId,
    word: r.word,
    status: r.known ? "known" : "unknown",
    session_id: session.id,
    part_of_speech: r.part_of_speech ?? null,
    definition: r.definition ?? null,
    etymology: r.etymology ?? null,
    synonyms: toStr(r.synonyms),
    antonyms: toStr(r.antonyms),
    casual_use: r.casual_use ?? null,
    professional_use: r.professional_use ?? null,
    topic,
    difficulty,
  }));
  if (rows.length) await supabase.from("word_history").insert(rows);

  const xpEarned = SESSION_XP;

  // XP update
  const { data: xpRow } = await supabase.from("xp").select("total_xp").eq("user_id", userId).maybeSingle();
  const newTotal = (xpRow?.total_xp ?? 0) + xpEarned;
  await supabase.from("xp").upsert(
    { user_id: userId, total_xp: newTotal, level: Math.floor(newTotal / LEVEL_XP) },
    { onConflict: "user_id" }
  );

  const knownCount = results.filter((r) => r.known).length;

  // Streak update
  const today = new Date().toISOString().slice(0, 10);
  const { data: stRow } = await supabase
    .from("streaks")
    .select("current_streak,longest_streak,last_session_date")
    .eq("user_id", userId)
    .maybeSingle();
  let current = stRow?.current_streak ?? 0;
  const last = stRow?.last_session_date;
  if (last === today) {
    // already counted today
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    current = last === yesterday ? current + 1 : 1;
  }
  const longest = Math.max(stRow?.longest_streak ?? 0, current);
  await supabase.from("streaks").upsert(
    { user_id: userId, current_streak: current, longest_streak: longest, last_session_date: today },
    { onConflict: "user_id" }
  );

  // Achievement checks
  const totalCount = await supabase
    .from("word_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const sessionsCount = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const totalWords = totalCount.count ?? 0;
  const totalSessions = sessionsCount.count ?? 0;

  const hour = new Date().getHours();
  const isNightOwl = hour >= 22 || hour < 2;
  const isEarlyBird = hour >= 5 && hour < 8;
  const perfect = knownCount === results.length && results.length > 0;
  const newLevel = Math.floor(newTotal / LEVEL_XP);

  const toUnlock: string[] = [];
  if (totalWords >= 1) toUnlock.push("first_word");
  if (totalSessions >= 1) toUnlock.push("first_session");
  if (totalWords >= 50) toUnlock.push("fifty_words");
  if (totalWords >= 100) toUnlock.push("hundred_words");
  if (current >= 7) toUnlock.push("seven_day_streak");
  if (current >= 30) toUnlock.push("thirty_day_streak");
  if (perfect) toUnlock.push("perfect_session");
  if (isNightOwl) toUnlock.push("night_owl");
  if (isEarlyBird) toUnlock.push("early_bird");
  if (newLevel >= 10) toUnlock.push("word_master");

  let newlyUnlocked: string[] = [];
  if (toUnlock.length) {
    const { data: existing } = await supabase
      .from("achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .in("achievement_key", toUnlock);
    const existingKeys = new Set((existing ?? []).map((e: any) => e.achievement_key));
    newlyUnlocked = toUnlock.filter((k) => !existingKeys.has(k));
    if (newlyUnlocked.length) {
      await supabase
        .from("achievements")
        .insert(newlyUnlocked.map((k) => ({ user_id: userId, achievement_key: k })));
    }
  }

  return { sessionId: session.id, xpEarned, newlyUnlocked };
};
