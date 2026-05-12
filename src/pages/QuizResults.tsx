import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Star, Lightbulb } from "lucide-react";

type McqResult = {
  type: "mcq";
  difficulty: string;
  score: number;
  total: number;
  xpEarned: number;
  newlyUnlocked: string[];
  tip: string;
  wrongWords: string[];
  timeTakenSeconds: number;
};

type SentenceResult = {
  type: "sentence_builder";
  difficulty: string;
  average: number;
  total: number;
  xpEarned: number;
  newlyUnlocked: string[];
  attempts: { word: string; sentence: string; rating: number; improvement_suggestion: string }[];
};

const Stars = ({ value, size = 5 }: { value: number; size?: number }) => (
  <div className="flex items-center justify-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`${size === 8 ? "h-8 w-8" : "h-5 w-5"} ${n <= Math.round(value) ? "text-primary fill-primary" : "text-muted-foreground/40"}`}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

const mcqMessage = (score: number, total: number) => {
  if (score >= total) return "Perfect Score! You're a Word Master 🏆";
  if (score === 4) return "Excellent! Almost perfect 🌟";
  if (score === 3) return "Good effort! Keep learning 📚";
  if (score === 2) return "Keep practising! You'll get there 💪";
  return "Don't give up! Try again 🔥";
};

const QuizResults = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<McqResult | SentenceResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("flicword-quiz-result");
    if (raw) {
      try { setData(JSON.parse(raw)); } catch { /* */ }
    }
  }, []);

  if (!data) {
    return (
      <AppShell hideNav>
        <p className="text-center text-sm text-muted-foreground mt-12">No results to show.</p>
        <button
          onClick={() => navigate("/home")}
          className="mt-6 mx-auto block rounded-xl px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm press"
        >
          Back to Home
        </button>
      </AppShell>
    );
  }

  const playAgain = () => {
    if (data.type === "mcq") {
      navigate(`/quiz/mcq?difficulty=${data.difficulty}`, { replace: true });
    } else {
      navigate(`/quiz/sentence?difficulty=${data.difficulty}`, { replace: true });
    }
  };

  return (
    <AppShell hideNav>
      <h1 className="text-3xl font-bold text-center mb-2">Session Complete</h1>
      <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
        {data.type === "mcq" ? "Multiple Choice" : "Sentence Builder"} · {data.difficulty}
      </p>

      {data.type === "mcq" && (
        <>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-primary tabular-nums">
              {data.score} <span className="text-3xl text-muted-foreground">out of</span> {data.total}
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">{mcqMessage(data.score, data.total)}</p>
          </div>

          {data.tip && (
            <div
              className="rounded-2xl p-5 bg-card mb-6"
              style={{ border: "2px solid hsl(var(--primary))" }}
            >
              <p className="text-sm leading-relaxed text-foreground/90">💡 <span className="font-semibold">Tip:</span> {data.tip}</p>
            </div>
          )}
        </>
      )}

      {data.type === "sentence_builder" && (
        <>
          <div className="text-center mb-6">
            <Stars value={data.average} size={8} />
            <p className="mt-3 text-2xl font-bold text-primary tabular-nums">{data.average.toFixed(1)} / 5</p>
          </div>

          <div className="space-y-3 mb-6">
            {data.attempts.map((a, i) => (
              <div
                key={i}
                className="rounded-xl p-4 bg-card"
                style={{ borderLeft: "4px solid hsl(var(--primary))", border: "1px solid hsl(var(--border))", borderLeftWidth: "4px", borderLeftColor: "hsl(var(--primary))" }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-primary">{a.word}</h3>
                  <Stars value={a.rating} />
                </div>
                <p className="text-sm text-muted-foreground italic mb-2">"{a.sentence}"</p>
                {a.improvement_suggestion && (
                  <div className="flex gap-2 text-xs text-foreground/85 mt-2">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="leading-relaxed">{a.improvement_suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="rounded-xl p-4 bg-card border border-border text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">XP Earned</p>
        <p className="text-2xl font-bold text-primary tabular-nums">+{data.xpEarned} XP</p>
      </div>

      <button
        onClick={playAgain}
        className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press mb-3"
      >
        Play Again
      </button>
      <button
        onClick={() => navigate("/home")}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 press"
      >
        Back to Home
      </button>
    </AppShell>
  );
};

export default QuizResults;
