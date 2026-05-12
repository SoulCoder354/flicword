import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flame, RefreshCw, ChevronRight, ArrowRight, LogOut, AlertTriangle, Brain } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchUserStats, type UserStats } from "@/lib/userData";
import { supabase } from "@/integrations/supabase/client";

const DAILY_GOAL = 10;

const QUOTES = [
  "A word after a word after a word is power. — Margaret Atwood",
  "Language is the dress of thought. — Samuel Johnson",
  "One word can change a sentence. One sentence can change a life.",
  "The limits of my language mean the limits of my world. — Wittgenstein",
  "Words are, in my not-so-humble opinion, our most inexhaustible source of magic. — J.K. Rowling",
  "Vocabulary is the foundation of all communication.",
  "Read. Learn. Repeat.",
];

type AiTopic = { name: string; emoji: string; description: string };
type Wotd = {
  word: string;
  part_of_speech: string | null;
  definition: string | null;
  etymology: string | null;
  synonyms: string | null;
  antonyms: string | null;
  casual_use: string | null;
  professional_use: string | null;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};
const quoteOfDay = () => QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [unknownCount, setUnknownCount] = useState(0);

  const [topics, setTopics] = useState<AiTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [wotd, setWotd] = useState<Wotd | null>(null);
  const [wotdLoading, setWotdLoading] = useState(true);
  const [wotdError, setWotdError] = useState<string | null>(null);

  const quote = useMemo(() => quoteOfDay(), []);

  const loadTopics = useCallback(async (excludePrev: AiTopic[] = []) => {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-topics", {
        body: { exclude: excludePrev.map((t) => t.name) },
      });
      if (error) throw error;
      if (!Array.isArray(data?.topics)) throw new Error("Bad payload");
      setTopics(data.topics);
    } catch (e: any) {
      setTopicsError(e?.message ?? "Failed to load topics");
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const loadWotd = useCallback(async () => {
    setWotdLoading(true);
    setWotdError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-word-of-the-day", { body: {} });
      if (error) throw error;
      if (!data?.word?.word) throw new Error("Bad payload");
      setWotd(data.word);
    } catch (e: any) {
      setWotdError(e?.message ?? "Failed to load word of the day");
    } finally {
      setWotdLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUserStats(user.id).then(setStats);
    supabase
      .from("word_history")
      .select("word,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const rows = data ?? [];
        const seen = new Set<string>();
        const recentWords: string[] = [];
        for (const r of rows) {
          const k = (r as any).word.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          recentWords.push((r as any).word);
          if (recentWords.length >= 5) break;
        }
        setRecent(recentWords);
        setUnknownCount(rows.filter((r: any) => r.status === "unknown").length);
      });
    loadTopics();
    loadWotd();
  }, [user, loadTopics, loadWotd]);

  const onRefreshTopics = () => {
    if (topicsLoading) return;
    loadTopics(topics);
  };

  const goTopic = (name: string) => navigate(`/difficulty/${encodeURIComponent(name)}`);

  const dailyDone = Math.min(stats?.todayWordsCount ?? 0, DAILY_GOAL);
  const goalPct = (dailyDone / DAILY_GOAL) * 100;

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            {greeting()},
            <br />
            <span className="text-foreground">{profile?.name ?? "there"}</span>
          </h1>
          <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-primary border border-primary/40 rounded-full px-2.5 py-1">
            Level {stats?.level ?? 0} · {stats?.totalXp ?? 0} XP
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-primary">
            <Flame className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-bold text-lg tabular-nums">{stats?.currentStreak ?? 0}</span>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2 press" aria-label="Sign out">
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Daily Stats Row */}
      <section className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Words Today", value: stats?.todayWordsCount ?? 0 },
          { label: "Streak", value: stats?.currentStreak ?? 0 },
          { label: "Total XP", value: stats?.totalXp ?? 0 },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-primary tabular-nums">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Continue Learning */}
      {unknownCount > 0 && (
        <section className="mb-8">
          <div className="card-featured rounded-2xl p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base">Continue Learning</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{unknownCount} word{unknownCount === 1 ? "" : "s"} to review</p>
            </div>
            <button
              onClick={() => navigate("/words")}
              className="bg-primary text-primary-foreground font-semibold text-xs rounded-full px-4 py-2 press shrink-0"
            >
              Review Now
            </button>
          </div>
        </section>
      )}

      {/* Topics */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow">Today's Topics</h2>
          <button
            disabled={topicsLoading}
            onClick={onRefreshTopics}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow disabled:opacity-30 press"
            aria-label="Refresh topics"
          >
            <RefreshCw className={`h-5 w-5 ${topicsLoading ? "animate-spin" : ""}`} strokeWidth={2.25} />
          </button>
        </div>

        {topicsLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl p-6 bg-card border border-border animate-pulse h-[88px]" />
            ))}
          </div>
        )}

        {!topicsLoading && topicsError && (
          <div className="rounded-2xl p-5 border border-primary/40 bg-card text-center">
            <AlertTriangle className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-sm text-foreground/80 mb-3">
              Couldn't load topics right now. Please check your connection and try again.
            </p>
            <button
              onClick={() => loadTopics()}
              className="rounded-full px-5 py-2 text-sm font-semibold border border-primary text-primary press"
            >
              Retry
            </button>
          </div>
        )}

        {!topicsLoading && !topicsError && (
          <div className="space-y-3">
            {topics.map((t) => (
              <button
                key={t.name}
                onClick={() => goTopic(t.name)}
                className="rounded-2xl p-6 w-full flex items-center gap-4 press hover:border-primary/60 transition-colors text-left bg-card border border-border"
                style={{ borderLeft: "4px solid hsl(var(--primary))" }}
              >
                <span className="text-3xl shrink-0" aria-hidden>{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl leading-tight text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quiz CTA */}
      <section className="mb-8">
        <button
          onClick={() => navigate("/quiz")}
          className="w-full rounded-2xl py-5 px-6 bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-3 press shadow-glow"
        >
          <Brain className="h-6 w-6" strokeWidth={2} />
          Quiz
        </button>
      </section>

      {/* Word of the Day */}
      <section className="mb-8">
        <h2 className="eyebrow mb-4">Word of the Day</h2>

        {wotdLoading && (
          <div className="card-featured-top rounded-2xl p-6 animate-pulse h-[180px]" />
        )}

        {!wotdLoading && wotdError && (
          <div className="card-featured-top rounded-2xl p-5 text-center">
            <p className="text-sm text-foreground/80 mb-3">Couldn't load the word of the day.</p>
            <button
              onClick={() => loadWotd()}
              className="rounded-full px-5 py-2 text-sm font-semibold border border-primary text-primary press"
            >
              Retry
            </button>
          </div>
        )}

        {!wotdLoading && !wotdError && wotd && (
          <div className="card-featured-top rounded-2xl p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Advanced · C1/C2</p>
            <h3 className="text-4xl font-bold tracking-tight text-primary">{wotd.word}</h3>
            {wotd.part_of_speech && <p className="text-xs italic text-muted-foreground mt-1">{wotd.part_of_speech}</p>}
            {wotd.definition && <p className="text-sm text-foreground/85 mt-4 leading-relaxed line-clamp-2">{wotd.definition}</p>}
            <button
              onClick={() => {
                sessionStorage.setItem("flicword-wotd", JSON.stringify(wotd));
                navigate(`/word/wotd-today`);
              }}
              className="mt-5 inline-flex items-center gap-1.5 text-primary hover:text-primary-glow text-sm font-semibold press"
            >
              Explore <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </section>

      {/* Recent Words */}
      {recent.length > 0 && (
        <section className="mb-8">
          <h2 className="eyebrow mb-4">Recent Words</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {recent.map((w) => (
              <button
                key={w}
                onClick={() => navigate("/words")}
                className="shrink-0 min-w-[120px] bg-card border border-border rounded-xl px-4 py-3 text-left press hover:border-primary/40 transition-colors"
              >
                <div className="text-sm font-semibold text-foreground truncate">{w}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Daily Goal */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="eyebrow">Daily Goal</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{dailyDone} / {DAILY_GOAL}</span>
        </div>
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
        </div>
      </section>

      {/* Motivational Quote */}
      <section>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-sm italic text-muted-foreground leading-relaxed">"{quote}"</p>
        </div>
      </section>
    </AppShell>
  );
};

export default Home;
