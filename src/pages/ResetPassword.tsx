import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash; the SDK auto-handles it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    navigate("/home", { replace: true });
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-8 py-10">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/40 grid place-items-center mb-6 shadow-glow">
          <Lock className="h-9 w-9 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">New Password</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Choose a strong password to secure your account
        </p>

        <form onSubmit={submit} className="mt-10 w-full space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 text-left">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50 py-3 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 text-left">Confirm</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press disabled:opacity-60"
          >
            {busy ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
