import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Volume2, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { completeSession, type SessionWordResult } from "@/lib/userData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_SIZE = 6;

type AiWord = {
  word: string;
  part_of_speech: string;
  definition: string;
  etymology: string;
  synonyms: string[];
  antonyms: string[];
  casual_use: string;
  professional_use: string;
  difficulty?: string;
  topic?: string;
};

const SwipeWords = () => {
  const { topic = "general" } = useParams();
  const topicName = decodeURIComponent(topic);
  const [params] = useSearchParams();
  const difficulty = params.get("difficulty") || "medium";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState<AiWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [results, setResults] = useState<{ word: AiWord; known: boolean }[]>([]);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const current = deck[index];

  // Fetch words on mount — no rate limits, no ads.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("generate-words", {
          body: { topic: topicName, difficulty },
        });
        if (cancelled) return;
        if (fnErr) throw fnErr;
        if (!Array.isArray(data?.words) || data.words.length === 0) throw new Error("Bad payload");
        setDeck(data.words.slice(0, SESSION_SIZE));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load words");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, topicName, difficulty]);

  const finish = (next: { word: AiWord; known: boolean }[]) => {
    sessionStorage.setItem(
      "flicword-results",
      JSON.stringify({
        topic: topicName,
        results: next.map((r, i) => ({ id: `ai-${i}`, known: r.known })),
        deck: next.map((r, i) => ({
          id: `ai-${i}`,
          word: r.word.word,
          pos: r.word.part_of_speech,
          definition: r.word.definition,
          etymology: r.word.etymology,
          synonyms: r.word.synonyms,
          antonyms: r.word.antonyms,
          casual: r.word.casual_use,
          professional: r.word.professional_use,
        })),
      })
    );
    sessionStorage.removeItem("flicword-newly-unlocked");
    if (user) {
      const payload: SessionWordResult[] = next.map((r) => ({
        word: r.word.word,
        known: r.known,
        part_of_speech: r.word.part_of_speech,
        definition: r.word.definition,
        etymology: r.word.etymology,
        synonyms: r.word.synonyms,
        antonyms: r.word.antonyms,
        casual_use: r.word.casual_use,
        professional_use: r.word.professional_use,
      }));
      completeSession(user.id, topicName, difficulty, payload)
        .then((res) => {
          sessionStorage.setItem("flicword-newly-unlocked", JSON.stringify(res.newlyUnlocked ?? []));
          window.dispatchEvent(new CustomEvent("flicword-session-saved", { detail: res.newlyUnlocked ?? [] }));
        })
        .catch(() => toast.error("Could not save session"));
    }
    navigate("/results");
  };

  const advance = (next: { word: AiWord; known: boolean }[]) => {
    setResults(next);
    setExiting(null);
    setDrag({ x: 0, y: 0 });
    if (next.length >= deck.length) {
      finish(next);
      return;
    }
    setIndex((i) => i + 1);
  };

  const commit = (known: boolean) => {
    if (!current) return;
    setExiting(known ? "right" : "left");
    setTimeout(() => {
      const next = [...results, { word: current, known }];
      advance(next);
    }, 250);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y });
  };
  const onPointerUp = () => {
    if (Math.abs(drag.x) > 110) commit(drag.x > 0);
    else setDrag({ x: 0, y: 0 });
    startRef.current = null;
  };

  const speak = () => {
    if (!current) return;
    const u = new SpeechSynthesisUtterance(current.word);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  if (loading) {
    return (
      <AppShell hideNav>
        <div className="fixed inset-0 grid place-items-center px-6 bg-background">
          <div className="text-center">
            <div className="relative h-20 w-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <Loader2 className="absolute inset-0 m-auto h-7 w-7 text-primary opacity-0" />
            </div>
            <p className="text-lg font-semibold text-foreground">Preparing your words…</p>
            <p className="text-xs text-muted-foreground mt-2">{topicName} · {difficulty}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell hideNav>
        <div className="fixed inset-0 grid place-items-center px-6 bg-background">
          <div className="max-w-sm w-full text-center">
            <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-4" />
            <p className="text-base font-semibold mb-2">Couldn't load words right now.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Please check your connection and try again.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold border border-border text-foreground/80 press"
              >
                Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-full px-5 py-2.5 text-sm font-semibold border border-primary text-primary press"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const rot = drag.x / 18;
  const tint =
    drag.x > 30 ? "shadow-[0_0_60px_hsl(var(--success)/0.6)]"
    : drag.x < -30 ? "shadow-[0_0_60px_hsl(var(--destructive)/0.6)]" : "";
  const exitTransform =
    exiting === "right" ? "translate(120vw,-60px) rotate(25deg)"
    : exiting === "left" ? "translate(-120vw,-60px) rotate(-25deg)" : "";

  return (
    <AppShell hideNav>
      <header className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="glass h-10 w-10 rounded-full grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="glass rounded-full px-4 py-1.5 text-sm font-semibold tabular-nums">
          {index + 1} / {deck.length}
        </div>
        <div className="w-10" />
      </header>

      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden mb-6">
        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(index / deck.length) * 100}%` }} />
      </div>

      <div className="relative flex items-center justify-center" style={{ height: "60vh" }}>
        {current && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`glass-strong rounded-3xl p-8 w-full h-full max-w-sm absolute select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center text-center ${tint}`}
            style={{
              transform: exiting ? exitTransform : `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rot}deg)`,
              transition: exiting || !startRef.current ? "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)" : "none",
              touchAction: "none",
            }}
          >
            <h2 className="text-5xl font-bold tracking-tight text-foreground">
              {current.word}
            </h2>
            <p className="text-sm italic text-foreground/60 mt-3">{current.part_of_speech}</p>
            <button
              onClick={speak}
              className="mt-8 glass h-14 w-14 rounded-full grid place-items-center hover:glass-glow transition"
            >
              <Volume2 className="h-6 w-6 text-primary" />
            </button>

            <div
              className="absolute top-6 left-6 px-3 py-1 rounded-lg border-2 border-destructive text-destructive font-bold text-sm rotate-[-15deg]"
              style={{ opacity: Math.max(0, -drag.x / 100) }}
            >NOPE</div>
            <div
              className="absolute top-6 right-6 px-3 py-1 rounded-lg border-2 border-success text-success font-bold text-sm rotate-[15deg]"
              style={{ opacity: Math.max(0, drag.x / 100) }}
            >KNOW IT</div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 max-w-md mx-auto">
        <button
          onClick={() => commit(false)}
          className="flex-1 rounded-xl py-4 font-semibold text-destructive border border-destructive/60 bg-transparent press text-sm"
        >
          Don't Know
        </button>
        <button
          onClick={() => commit(true)}
          className="flex-1 rounded-xl py-4 font-semibold bg-primary text-primary-foreground press text-sm"
        >
          Know It
        </button>
      </div>
    </AppShell>
  );
};

export default SwipeWords;
