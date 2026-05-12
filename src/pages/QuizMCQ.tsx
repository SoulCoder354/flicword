import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { completeQuiz } from "@/lib/quiz";

type Question = {
  definition: string;
  correct_answer: string;
  options: string[];
  difficulty: string;
};

const QuizMCQ = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const difficulty = params.get("difficulty") ?? "Medium";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tip, setTip] = useState("");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const startedAt = useRef<number>(Date.now());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", { body: { difficulty } });
      if (error) throw error;
      if (!Array.isArray(data?.questions) || !data.questions.length) throw new Error("Bad payload");
      setQuestions(data.questions);
      setTip(data.improvement_tip ?? "");
      setIdx(0);
      setScore(0);
      setPicked(null);
      setWrongWords([]);
      startedAt.current = Date.now();
    } catch (e: any) {
      setError(e?.message ?? "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [difficulty]);

  const current = questions[idx];

  const onPick = (opt: string) => {
    if (picked || !current) return;
    setPicked(opt);
    const correct = opt === current.correct_answer;
    let nextScore = score;
    let nextWrongs = wrongWords;
    if (correct) {
      nextScore = score + 1;
      setScore(nextScore);
    } else {
      nextWrongs = [...wrongWords, current.correct_answer];
      setWrongWords(nextWrongs);
    }
    setTimeout(
      async () => {
        if (idx + 1 >= questions.length) {
          // finish
          const time = Math.round((Date.now() - startedAt.current) / 1000);
          if (user) {
            try {
              const { xpEarned, newlyUnlocked } = await completeQuiz({
                userId: user.id,
                quizType: "mcq",
                difficulty,
                score: nextScore,
                totalQuestions: questions.length,
                timeTakenSeconds: time,
              });
              sessionStorage.setItem(
                "flicword-quiz-result",
                JSON.stringify({
                  type: "mcq",
                  difficulty,
                  score: nextScore,
                  total: questions.length,
                  xpEarned,
                  newlyUnlocked,
                  tip,
                  wrongWords: nextWrongs,
                  timeTakenSeconds: time,
                }),
              );
            } catch (e) {
              console.error(e);
            }
          }
          navigate("/quiz/results", { replace: true });
        } else {
          setIdx(idx + 1);
          setPicked(null);
        }
      },
      correct ? 1000 : 1500,
    );
  };

  const progressPct = useMemo(
    () => (questions.length ? ((idx + (picked ? 1 : 0)) / questions.length) * 100 : 0),
    [idx, picked, questions.length],
  );

  if (loading) {
    return (
      <AppShell hideNav>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Preparing your quiz...</p>
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
            Couldn't load quiz right now. Please check your connection and try again.
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

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/home")} className="text-muted-foreground hover:text-foreground press">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <p className="eyebrow flex-1">Quiz · {difficulty}</p>
        <span className="text-sm font-bold text-primary tabular-nums">{score}/{questions.length}</span>
      </header>

      <div className="h-1 rounded-full bg-border overflow-hidden mb-2">
        <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground mb-6 tabular-nums">
        Question {idx + 1} of {questions.length}
      </p>

      <div
        className="rounded-2xl p-6 bg-card mb-6"
        style={{ border: "2px solid hsl(var(--primary))" }}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">Definition</p>
        <p className="text-lg font-semibold leading-relaxed text-foreground">{current.definition}</p>
      </div>

      <div className="space-y-3">
        {current.options.map((opt) => {
          const isCorrect = opt === current.correct_answer;
          const isPicked = picked === opt;
          let bg = "bg-card";
          let border = "border-border";
          let icon = null as React.ReactNode;
          if (picked) {
            if (isCorrect) {
              bg = "bg-success/15";
              border = "border-success";
              icon = <Check className="h-5 w-5 text-success" strokeWidth={2.25} />;
            } else if (isPicked) {
              bg = "bg-destructive/15";
              border = "border-destructive";
              icon = <X className="h-5 w-5 text-destructive" strokeWidth={2.25} />;
            }
          }
          return (
            <button
              key={opt}
              onClick={() => onPick(opt)}
              disabled={!!picked}
              className={`w-full rounded-2xl px-5 py-4 text-left flex items-center justify-between gap-3 border-2 transition-colors press ${bg} ${border} disabled:cursor-default`}
            >
              <span className="font-semibold text-foreground">{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>
    </AppShell>
  );
};

export default QuizMCQ;
