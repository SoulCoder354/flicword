import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft } from "lucide-react";

const OPTIONS = [
  { id: "Easy", desc: "Simple everyday definitions" },
  { id: "Medium", desc: "Intermediate level definitions" },
  { id: "Hard", desc: "Advanced and complex definitions" },
];

const QuizDifficulty = () => {
  const navigate = useNavigate();
  const { mode = "mcq" } = useParams();

  const start = (diff: string) => {
    const target = mode === "sentence" ? "/quiz/sentence" : "/quiz/mcq";
    navigate(`${target}?difficulty=${diff}`);
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground press">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <p className="eyebrow">{mode === "sentence" ? "Sentence Builder" : "Multiple Choice"}</p>
      </header>

      <h1 className="text-3xl font-bold mb-8">Choose Difficulty</h1>

      <div className="space-y-4">
        {OPTIONS.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl p-5 bg-card border border-border"
            style={{ borderLeft: "4px solid hsl(var(--primary))" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-bold text-xl text-foreground">{o.id}</h3>
                <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
              </div>
              <button
                onClick={() => start(o.id)}
                className="rounded-full bg-primary text-primary-foreground font-semibold text-xs px-5 py-2.5 press shrink-0"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default QuizDifficulty;
