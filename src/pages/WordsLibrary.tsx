import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { WORDS, TOPICS, type Word } from "@/lib/data";
import { Check, X, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  word: string;
  status: "known" | "unknown";
  created_at: string;
  part_of_speech: string | null;
  definition: string | null;
  etymology: string | null;
  synonyms: string | null;
  antonyms: string | null;
  casual_use: string | null;
  professional_use: string | null;
  topic: string | null;
  difficulty: string | null;
};

const splitList = (v: string | null) =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

// Build a name -> { word, topicId, topicTitle } index
const WORD_INDEX: Record<string, { word: Word; topicId: string; topicTitle: string }> = (() => {
  const idx: Record<string, { word: Word; topicId: string; topicTitle: string }> = {};
  for (const topic of TOPICS) {
    const list = WORDS[topic.id] ?? [];
    for (const w of list) {
      const k = w.word.toLowerCase();
      if (!idx[k]) idx[k] = { word: w, topicId: topic.id, topicTitle: topic.title };
    }
  }
  return idx;
})();

const WordsLibrary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"known" | "unknown" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("word_history")
      .select("word,status,created_at,part_of_speech,definition,etymology,synonyms,antonyms,casual_use,professional_use,topic,difficulty")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(() => {
    if (!tab) return [];
    const query = searchQuery.trim().toLowerCase();
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (r.status !== tab) return false;
      const k = r.word.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      if (!query) return true;
      const topicTitle = WORD_INDEX[k]?.topicTitle ?? r.topic ?? "";
      return k.includes(query) || topicTitle.toLowerCase().includes(query);
    });
  }, [rows, tab, searchQuery]);

  const openWord = (r: Row) => {
    const meta = WORD_INDEX[r.word.toLowerCase()];
    const w: Word = {
      id: `lib-${r.word.toLowerCase()}`,
      word: r.word,
      pos: r.part_of_speech || meta?.word.pos || "",
      definition: r.definition || meta?.word.definition || "Definition not available.",
      etymology: r.etymology || meta?.word.etymology || "",
      synonyms: splitList(r.synonyms).length ? splitList(r.synonyms) : (meta?.word.synonyms ?? []),
      antonyms: splitList(r.antonyms).length ? splitList(r.antonyms) : (meta?.word.antonyms ?? []),
      casual: r.casual_use || meta?.word.casual || "",
      professional: r.professional_use || meta?.word.professional || "",
    };
    sessionStorage.setItem("flicword-current-word", JSON.stringify(w));
    navigate(`/word/${w.id}?library=1`);
  };

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Words</h1>
        <p className="text-sm text-foreground/60 mt-1">Browse what you've learned</p>
      </header>

      {/* Two large premium buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setTab("known")}
          className={`h-44 rounded-2xl flex flex-col items-center justify-center gap-3 font-semibold text-lg transition-all active:scale-[0.98] ${
            tab === "known"
              ? "bg-primary text-primary-foreground shadow-[0_0_30px_-8px_hsl(var(--primary)/0.6)] ring-2 ring-primary/60"
              : "bg-primary text-primary-foreground hover:brightness-110"
          }`}
        >
          <Check className="h-9 w-9" strokeWidth={2.5} />
          Know It
        </button>
        <button
          onClick={() => setTab("unknown")}
          className={`h-44 rounded-2xl flex flex-col items-center justify-center gap-3 font-semibold text-lg transition-all active:scale-[0.98] border-2 ${
            tab === "unknown"
              ? "border-destructive text-destructive bg-destructive/10 shadow-[0_0_30px_-8px_hsl(var(--destructive)/0.6)]"
              : "border-destructive text-destructive hover:bg-destructive/5"
          }`}
        >
          <X className="h-9 w-9" strokeWidth={2.5} />
          Don't Know
        </button>
      </div>

      {/* Search button */}
      <div className="-mx-6 px-6 mb-5">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSearchOpen((open) => !open)}
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-primary/70"
          >
            Search words
          </button>
          {searchOpen && (
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search by word or topic"
              aria-label="Search your words"
            />
          )}
        </div>
      </div>

      {/* Word list */}
      {tab && (
        <div className="space-y-2 animate-fade-in">
          {loading && <p className="text-center text-sm text-foreground/50 mt-10">Loading…</p>}
          {!loading && filtered.map((r) => {
            const meta = WORD_INDEX[r.word.toLowerCase()];
            return (
              <button
                key={r.word + r.created_at}
                onClick={() => openWord(r)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-4 bg-card border border-border/50 hover:border-primary/40 transition-all active:scale-[0.99]"
              >
                <p className="flex-1 text-left font-semibold text-foreground">{r.word}</p>
                {(meta?.topicTitle || r.topic) && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium border border-primary/40 text-primary">
                    {meta?.topicTitle ?? r.topic}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-foreground/40" />
              </button>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-12">
              No words here yet. Complete a session to see your words.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default WordsLibrary;
