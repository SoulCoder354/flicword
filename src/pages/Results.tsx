import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import type { Word } from "@/lib/data";
import { ChevronRight, Sparkles } from "lucide-react";
import { SESSION_XP } from "@/lib/userData";
import { toast } from "sonner";

type Stored = { topic: string; results: { id: string; known: boolean }[]; deck: Word[] };

const Results = () => {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("flicword-results");
  const data: Stored | null = raw ? JSON.parse(raw) : null;

  if (!data) {
    return (
      <AppShell>
        <div className="text-center pt-20">
          <p className="text-foreground/70 mb-4">No session yet.</p>
          <button onClick={() => navigate("/home")} className="glass-strong rounded-full px-5 py-3">Go Home</button>
        </div>
      </AppShell>
    );
  }

  const known = data.results.filter((r) => r.known).length;
  const unknown = data.results.length - known;
  const xp = SESSION_XP;
  const map = new Map(data.results.map((r) => [r.id, r.known]));

  useEffect(() => {
    toast.success(`+${SESSION_XP} XP Earned!`, {
      className: "border-yellow-300/50 shadow-[0_0_40px_hsl(45_95%_60%/0.6)]",
    });

    const showUnlocks = (keys: string[]) => {
      if (!keys?.length) return;
      import("@/lib/achievements").then(({ ACHIEVEMENT_DEFS }) => {
        keys.forEach((k, i) => {
          const def = ACHIEVEMENT_DEFS.find((d) => d.key === k);
          if (def) {
            setTimeout(() => {
              toast(`🏆 Achievement Unlocked — ${def.label}!`, {
                position: "bottom-center",
                className: "border-yellow-300/50 shadow-[0_0_40px_hsl(45_95%_60%/0.6)]",
              });
            }, 600 + i * 800);
          }
        });
      });
    };

    const raw = sessionStorage.getItem("flicword-newly-unlocked");
    if (raw) {
      try { showUnlocks(JSON.parse(raw)); } catch {}
      sessionStorage.removeItem("flicword-newly-unlocked");
    } else {
      const handler = (e: Event) => {
        showUnlocks(((e as CustomEvent).detail as string[]) || []);
        sessionStorage.removeItem("flicword-newly-unlocked");
      };
      window.addEventListener("flicword-session-saved", handler as EventListener, { once: true });
      return () => window.removeEventListener("flicword-session-saved", handler as EventListener);
    }
  }, []);

  return (
    <AppShell>
      <div className="animate-fade-in">
      <div className="text-center mt-2 mb-6 animate-scale-in">
        <div className="inline-flex items-center gap-2 glass-strong rounded-full px-5 py-2 text-sm mb-3 shadow-[0_0_40px_hsl(45_95%_60%/0.5)] border border-yellow-300/50 animate-pulse">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          <span className="font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">+{xp} XP Earned!</span>
        </div>
        <h1 className="text-3xl font-bold text-gradient drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">Session Complete!</h1>
        <p className="text-sm text-foreground/60 mt-2">Great flow. Here's how you did.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-5 text-center bg-card border border-border" style={{ borderTopWidth: "2px", borderTopColor: "hsl(var(--destructive))" }}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-destructive font-semibold">Don't Know</p>
          <p className="text-4xl font-bold mt-2 text-destructive">{unknown}</p>
        </div>
        <div className="rounded-2xl p-5 text-center bg-card border border-border" style={{ borderTopWidth: "2px", borderTopColor: "hsl(var(--primary))" }}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">Know It</p>
          <p className="text-4xl font-bold mt-2 text-primary">{known}</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-foreground/80 mb-3">All words</h2>
      <div className="space-y-2 mb-6">
        {data.deck.map((w) => {
          const isKnown = map.get(w.id);
          return (
            <button
              key={w.id}
              onClick={() => {
                sessionStorage.setItem("flicword-current-word", JSON.stringify(w));
                navigate(`/word/${w.id}`);
              }}
              className="glass rounded-2xl p-3 w-full flex items-center gap-3 hover:glass-glow transition"
            >
              <span
                className={`h-3 w-3 rounded-full shadow-glow ${isKnown ? "bg-success" : "bg-destructive"}`}
              />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{w.word}</p>
                <p className="text-xs text-foreground/50 line-clamp-1">{w.definition}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/40" />
            </button>
          );
        })}
      </div>
      </div>
    </AppShell>
  );
};

export default Results;
