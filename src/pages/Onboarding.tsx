import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
    if (!loading && profile?.name) navigate("/home", { replace: true });
  }, [loading, user, profile, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    await supabase.from("users").upsert(
      { id: user.id, email: user.email, name: name.trim() },
      { onConflict: "id" }
    );
    await refreshProfile();
    navigate("/home", { replace: true });
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-8">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        <p className="eyebrow mb-4">Welcome</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">What should we call you?</h1>
        <p className="mt-3 text-sm text-muted-foreground">We'll greet you with this name in the app.</p>

        <form onSubmit={submit} className="mt-10 w-full space-y-8">
          <input
            type="text"
            required
            autoFocus
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-transparent border-b border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50 py-3 text-center text-base outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
