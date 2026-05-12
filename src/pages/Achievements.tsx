import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import * as Icons from "lucide-react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ACHIEVEMENT_DEFS, fetchAchievementData, type AchievementStats } from "@/lib/achievements";

type Filter = "all" | "unlocked" | "locked";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const Achievements = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [unlockedMap, setUnlockedMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;
    fetchAchievementData(user.id).then(({ stats, unlockedMap }) => {
      setStats(stats);
      setUnlockedMap(unlockedMap);
    });
  }, [user]);

  const items = ACHIEVEMENT_DEFS.map((d) => {
    const unlocked = unlockedMap.has(d.key);
    const progress = stats ? d.progress(stats) : 0;
    return { ...d, unlocked, progress, unlockedAt: unlockedMap.get(d.key) };
  }).filter((a) => (filter === "all" ? true : filter === "unlocked" ? a.unlocked : !a.unlocked));

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-gradient">Achievements</h1>
        <p className="text-sm text-foreground/60 mt-1">
          {unlockedMap.size} of {ACHIEVEMENT_DEFS.length} Unlocked
        </p>
      </header>

      <div className="flex gap-2 mb-5">
        {(["all", "unlocked", "locked"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 capitalize text-xs font-semibold rounded-full py-2 transition ${
              filter === f ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass text-foreground/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((a) => {
          const Icon = (Icons as any)[a.icon] || Icons.Award;
          const pct = Math.min(100, Math.round((a.progress / a.goal) * 100));
          return (
            <div
              key={a.key}
              className={`glass rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden ${
                a.unlocked ? "glass-glow" : ""
              }`}
            >
              {a.unlocked && <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />}
              <div
                className={`relative h-14 w-14 rounded-xl grid place-items-center shrink-0 ${
                  a.unlocked ? "bg-gradient-primary shadow-glow" : "bg-foreground/10"
                }`}
              >
                <Icon className={`h-6 w-6 ${a.unlocked ? "text-primary-foreground" : "text-foreground/40"}`} />
                {!a.unlocked && <Lock className="absolute -top-1 -right-1 h-3.5 w-3.5 text-foreground/50 bg-background rounded-full p-0.5" />}
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`font-semibold text-sm ${a.unlocked ? "" : "text-foreground/70"}`}>{a.label}</h3>
                  <span className="text-[10px] font-semibold tabular-nums text-foreground/60 shrink-0">
                    {Math.min(a.progress, a.goal)} / {a.goal}
                  </span>
                </div>
                <p className="text-xs text-foreground/55 mt-0.5 leading-snug">{a.description}</p>
                <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      a.unlocked ? "bg-gradient-primary shadow-glow" : "bg-foreground/40"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {a.unlocked && a.unlockedAt && (
                  <p className="text-[10px] text-primary/80 mt-1.5 font-medium">Unlocked {formatDate(a.unlockedAt)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm italic text-primary/60 mt-8">
        More achievements coming soon... 🏆
      </p>
    </AppShell>
  );
};

export default Achievements;
