import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent! Check your inbox.");
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-8 py-10">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/40 grid place-items-center mb-6 shadow-glow">
          <KeyRound className="h-9 w-9 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Enter your email and we'll send you a reset link
        </p>

        <form onSubmit={submit} className="mt-10 w-full space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 text-left">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-transparent border-b border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={busy || sent}
            className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press disabled:opacity-60"
          >
            {sent ? "Reset Link Sent" : busy ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
