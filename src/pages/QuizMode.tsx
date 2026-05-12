import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Target, PenLine } from "lucide-react";

const Card = ({
  onClick, icon: Icon, title, desc,
}: { onClick: () => void; icon: any; title: string; desc: string }) => (
  <button
    onClick={onClick}
    className="w-full rounded-2xl p-6 text-left bg-card border border-border hover:border-primary/60 transition-colors press"
    style={{ borderLeft: "4px solid hsl(var(--primary))" }}
  >
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-xl grid place-items-center bg-primary/10 border border-primary/30 shrink-0">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-xl text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  </button>
);

const QuizMode = () => {
  const navigate = useNavigate();
  return (
    <AppShell>
      <header className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground press">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <p className="eyebrow">Quiz</p>
      </header>

      <h1 className="text-3xl font-bold mb-2">Choose your quiz</h1>
      <p className="text-sm text-muted-foreground mb-8">Pick how you want to test yourself.</p>

      <div className="space-y-4">
        <Card
          onClick={() => navigate("/quiz/difficulty/mcq")}
          icon={Target}
          title="Multiple Choice"
          desc="Test your knowledge — pick the right word from 4 options"
        />
        <Card
          onClick={() => navigate("/quiz/difficulty/sentence")}
          icon={PenLine}
          title="Sentence Builder"
          desc="Put your skills to the test — write a sentence using the given word"
        />
      </div>
    </AppShell>
  );
};

export default QuizMode;
