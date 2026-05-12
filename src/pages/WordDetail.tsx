import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WORDS, WORD_OF_WEEK, ADVANCED_WORDS, getWordOfDay, type Word } from "@/lib/data";
import { ArrowLeft, Volume2, Send, Star, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const findWord = (id: string): Word | null => {
  if (id === "wow") return getWordOfDay();
  if (id === "wotd-today") {
    const raw = sessionStorage.getItem("flicword-wotd");
    if (raw) {
      try {
        const w = JSON.parse(raw);
        return {
          id: "wotd-today",
          word: w.word,
          pos: w.part_of_speech ?? "",
          definition: w.definition ?? "",
          etymology: w.etymology ?? "",
          synonyms: typeof w.synonyms === "string" ? w.synonyms.split(",").map((s: string) => s.trim()).filter(Boolean) : (w.synonyms ?? []),
          antonyms: typeof w.antonyms === "string" ? w.antonyms.split(",").map((s: string) => s.trim()).filter(Boolean) : (w.antonyms ?? []),
          casual: w.casual_use ?? "",
          professional: w.professional_use ?? "",
        };
      } catch {/* ignore */}
    }
    return getWordOfDay();
  }
  const adv = ADVANCED_WORDS.find((w) => w.id === id);
  if (adv) return adv;
  const stored = sessionStorage.getItem("flicword-current-word");
  if (stored) { const w = JSON.parse(stored) as Word; if (w.id === id) return w; }
  for (const list of Object.values(WORDS)) {
    const f = list.find((w) => w.id === id);
    if (f) return f;
  }
  return null;
};

const dash = (v?: string) => (v && v.trim().length ? v : "—");

const WordDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromLibrary = params.get("library") === "1";
  const word = findWord(id);
  const [sentence, setSentence] = useState("");
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; improved: string } | null>(null);

  if (!word) return <AppShell><p className="text-center pt-20 text-foreground/60">Word not found.</p></AppShell>;

  const speak = () => { const u = new SpeechSynthesisUtterance(word.word); speechSynthesis.cancel(); speechSynthesis.speak(u); };

  const checkSentence = async () => {
    if (!sentence.trim()) {
      toast.error("Write a sentence first");
      return;
    }
    setScoring(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("score-sentence", {
        body: { word: word.word, sentence: sentence.trim() },
      });
      if (error) throw error;
      setResult({
        score: Number(data?.score) || 0,
        feedback: String(data?.feedback ?? ""),
        improved: String(data?.improved ?? ""),
      });
    } catch (e: any) {
      toast.error("Couldn't score that — try again");
    } finally {
      setScoring(false);
    }
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="glass h-10 w-10 rounded-full grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="text-xs italic text-foreground/60">{word.pos}</p>
        <div className="w-10" />
      </header>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight">{word.word}</h1>
        <button onClick={speak} className="glass-strong h-12 w-12 rounded-full grid place-items-center hover:glass-glow transition">
          <Volume2 className="h-5 w-5 text-primary" />
        </button>
      </div>

      <section className="glass-strong rounded-2xl p-5 mb-4 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/80 font-semibold mb-1">Definition</p>
          <p className="text-sm leading-relaxed">{dash(word.definition)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/80 font-semibold mb-1">Etymology</p>
          <p className="text-xs italic text-foreground/70">{dash(word.etymology)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60 font-semibold mb-1.5">Synonyms</p>
            <div className="flex flex-wrap gap-1.5">
              {word.synonyms.map((s) => <span key={s} className="glass rounded-full px-2.5 py-0.5 text-xs">{s}</span>)}
              {word.synonyms.length === 0 && <span className="text-xs text-foreground/40">—</span>}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60 font-semibold mb-1.5">Antonyms</p>
            <div className="flex flex-wrap gap-1.5">
              {word.antonyms.map((s) => <span key={s} className="glass rounded-full px-2.5 py-0.5 text-xs">{s}</span>)}
              {word.antonyms.length === 0 && <span className="text-xs text-foreground/40">—</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-4 mb-3">
        <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">Casual Use</p>
        <p className="text-sm italic text-foreground/85">"{dash(word.casual)}"</p>
      </section>
      <section className="glass rounded-2xl p-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Professional Use</p>
        <p className="text-sm italic text-foreground/85">"{dash(word.professional)}"</p>
      </section>

      {!fromLibrary && (
      <div>
        <div className="glass-strong rounded-2xl p-2 flex items-end gap-2">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder={`Write your own sentence using "${word.word}"...`}
            rows={2}
            className="flex-1 bg-transparent resize-none px-3 py-2 text-sm placeholder:text-foreground/40 outline-none"
          />
          <button
            onClick={checkSentence}
            disabled={scoring}
            className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow hover:scale-105 transition disabled:opacity-60"
            aria-label="Score sentence"
          >
            {scoring ? <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" /> : <Send className="h-4 w-4 text-primary-foreground" />}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-foreground/50 text-center flex items-center justify-center gap-1">
          AI will rate your sentence out of 5 <Star className="h-3 w-3 text-yellow-400" />
        </p>

        {result && (
          <div className="mt-4 glass-strong rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Score: {result.score} / 5</p>
              <div className="ml-auto flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= result.score ? "text-yellow-400 fill-yellow-400" : "text-foreground/20"}`}
                  />
                ))}
              </div>
            </div>
            {result.feedback && <p className="text-xs text-foreground/80 leading-relaxed">{result.feedback}</p>}
            {result.improved && (
              <p className="mt-2 text-xs italic text-foreground/70 border-l-2 border-primary/50 pl-2">
                Try: "{result.improved}"
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </AppShell>
  );
};

export default WordDetail;
