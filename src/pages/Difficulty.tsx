import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft } from "lucide-react";

const OPTIONS = [
  { id: "easy", title: "Easy", desc: "Common everyday words", color: "hsl(var(--success))" },
  { id: "medium", title: "Medium", desc: "Intermediate level words", color: "hsl(var(--accent))" },
  { id: "hard", title: "Hard", desc: "Advanced and complex words", color: "hsl(var(--primary))" },
];

const Difficulty = () => {
  const { topic = "business" } = useParams();
  const topicName = decodeURIComponent(topic);
  const navigate = useNavigate();
  const [selected, setSelected] = useState("medium");

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 mb-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground press">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <p className="eyebrow">{topicName}</p>
      </header>

      <h1 className="text-3xl font-bold mb-8">Choose Difficulty</h1>

      <div className="space-y-3 mb-10">
        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              className="w-full rounded-2xl p-5 text-left transition-colors press border"
              style={{
                backgroundColor: active ? "hsl(var(--card))" : "hsl(var(--card) / 0.6)",
                borderColor: active ? o.color : "hsl(var(--border))",
                borderLeftWidth: active ? "3px" : "2px",
                borderLeftColor: o.color,
              }}
            >
              <h3 className="text-lg font-bold text-foreground">{o.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate(`/swipe/${encodeURIComponent(topic)}?difficulty=${selected}`)}
        className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press"
      >
        Start Session
      </button>
    </AppShell>
  );
};

export default Difficulty;
