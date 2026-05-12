import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, AlertTriangle, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { completeQuiz, type SentenceAttemptInput } from "@/lib/quiz";

type Word = { word: string; part_of_speech: string; difficulty: string };

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center justify-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`h-5 w-5 ${n <= value ? "text-primary fill-primary" : "text-muted-foreground/40"}`}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

const QuizSentence = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const difficulty = params.get("difficulty") ?? "Medium";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [sentence, setSentence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ rating: number; quick_feedback: string; improvement_suggestion: string } | null>(null);
  const attempts = useRef<SentenceAttemptInput[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sentence-words", { body: { difficulty } });
      if (error) throw error;
      if (!Array.isArray(data?.words) || !data.words.length) throw new Error("Bad payload");
      setWords(data.words);
      setIdx(0);
      setSentence("");
      setResult(null);
      attempts.current = [];
    } catch (e: any) {
      setError(e?.message ?? "Failed to load words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [difficulty]);

  const current = words[idx];

  const submit = async () => {
    if (!current || !sentence.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-sentence", {
        body: { word: current.word, sentence: sentence.trim() },
      });
      if (error) throw error;
      const r = {
        rating: Math.max(1, Math.min(5, Math.round(Number(data?.rating) || 1))),
        quick_feedback: data?.quick_feedback ?? "",
        improvement_suggestion: data?.improvement_suggestion ?? "",
      };
      setResult(r);
      attempts.current.push({
        word: current.word,
        sentence: sentence.trim(),
        rating: r.rating,
        improvement_suggestion: r.improvement_suggestion,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to evaluate");
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    if (idx + 1 >= words.length) {
      const ratings = attempts.current.map((a) => a.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length);
      if (user) {
        try {
          const { xpEarned, newlyUnlocked } = await completeQuiz({
            userId: user.id,
            quizType: "sentence_builder",
            difficulty,
            score: Math.round(avg * 10) / 10,
            totalQuestions: words.length,
            sentenceAttempts: attempts.current,
          });
          sessionStorage.setItem(
            "flicword-quiz-result",
            JSON.stringify({
              type: "sentence_builder",
              difficulty,
              average: Math.round(avg * 10) / 10,
              total: words.length,
              xpEarned,
              newlyUnlocked,
              attempts: attempts.current,
            }),
          );
        } catch (e) {
          console.error(e);
        }
      }
      navigate("/quiz/results", { replace: true });
    } else {
      setIdx(idx + 1);
      setSentence("");
      setResult(null);
    }
  };

  if (loading) {
    return (
      <AppShell hideNav>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Preparing your words...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell hideNav>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <AlertTriangle className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
          <p className="text-sm text-foreground/80 mb-6">
            Couldn't load right now. Please check your connection and try again.
          </p>
          <button
            onClick={load}
            className="rounded-full px-6 py-2.5 text-sm font-semibold border border-primary text-primary press"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (!current) return null;
  const progressPct = ((idx + (result ? 1 : 0)) / words.length) * 100;

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/home")} className="text-muted-foreground hover:text-foreground press">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <p className="eyebrow flex-1">Sentence Builder · {difficulty}</p>
      </header>

      <div className="h-1 rounded-full bg-border overflow-hidden mb-2">
        <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground mb-6 tabular-nums">Word {idx + 1} of {words.length}</p>

      <div
        className="rounded-2xl p-8 bg-card mb-6 text-center"
        style={{ border: "2px solid hsl(var(--primary))" }}
      >
        <h2 className="text-4xl font-bold text-primary tracking-tight">{current.word}</h2>
        <p className="text-xs italic text-muted-foreground mt-2">{current.part_of_speech}</p>
      </div>

      <textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        disabled={!!result || submitting}
        placeholder="Write a sentence using this word..."
        className="w-full rounded-2xl bg-card text-foreground placeholder:text-muted-foreground p-4 min-h-[120px] resize-none outline-none disabled:opacity-80"
        style={{ border: "2px solid hsl(var(--primary) / 0.5)" }}
      />

      {!result && (
        <button
          onClick={submit}
          disabled={!sentence.trim() || submitting}
          className="mt-4 w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press disabled:opacity-50"
        >
          {submitting ? "Evaluating..." : "Submit"}
        </button>
      )}

      {result && (
        <div className="mt-5 text-center">
          <Stars value={result.rating} />
          <p className="text-sm text-foreground/80 mt-3">{result.quick_feedback}</p>
          <button
            onClick={next}
            className="mt-6 w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press"
          >
            {idx + 1 >= words.length ? "See Results" : "Next Word"}
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default QuizSentence;
