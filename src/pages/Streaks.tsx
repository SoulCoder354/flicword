import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Snowflake } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserStats, type UserStats } from "@/lib/userData";

const DAILY_GOAL = 10;
const WEEKS = 7;

const Streaks = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<boolean[]>(Array(WEEKS * 7).fill(false));

  useEffect(() => {
    if (!user) return;
    fetchUserStats(user.id).then(setStats);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (WEEKS * 7 - 1));
    supabase
      .from("word_history")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .then(({ data }) => {
        const days = new Set<string>();
        (data ?? []).forEach((r: any) => days.add(new Date(r.created_at).toISOString().slice(0, 10)));
        const arr: boolean[] = [];
        for (let i = WEEKS * 7 - 1; i >= 0; i--) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          arr.push(days.has(d.toISOString().slice(0, 10)));
        }
        setActivity(arr);
      });
  }, [user]);

  const dailyDone = Math.min(stats?.todayWordsCount ?? 0, DAILY_GOAL);

  return (
    <AppShell>
      <header className="text-center mt-2 mb-6">
        <p className="text-xs uppercase tracking-widest text-foreground/60">Current Streak</p>
        <h1 className="text-6xl font-bold mt-2">🔥 <span className="text-gradient">{stats?.currentStreak ?? 0}</span></h1>
        <p className="text-sm text-foreground/70 mt-1">
          {stats?.currentStreak ? "Day Streak — keep the fire alive" : "Complete a session to start your streak"}
        </p>
      </header>

      <section className="glass-strong rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="text-xs text-foreground/50">last 7 weeks</p>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {activity.map((active, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md transition-all ${active ? "bg-gradient-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "bg-foreground/10"}`}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Today", value: stats?.todayWordsCount ?? 0 },
          { label: "This Week", value: stats?.weekWordsCount ?? 0 },
          { label: "This Month", value: stats?.monthWordsCount ?? 0 },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-foreground/60 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-foreground/70">Daily Goal</span>
          <span className="font-semibold">{dailyDone} / {DAILY_GOAL}</span>
        </div>
        <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
          <div className="h-full bg-gradient-primary shadow-glow rounded-full" style={{ width: `${(dailyDone / DAILY_GOAL) * 100}%` }} />
        </div>
      </div>

    </AppShell>
  );
};

export default Streaks;
