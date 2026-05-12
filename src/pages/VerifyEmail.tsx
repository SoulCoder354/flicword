import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COOLDOWN = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email ?? "";
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown > 0 || !email) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/?verified=1` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verification email resent");
    setCooldown(COOLDOWN);
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-8 py-10">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/40 grid place-items-center mb-6 shadow-glow">
          <Mail className="h-9 w-9 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Verify Your Email</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          We sent a verification link to{" "}
          <span className="text-foreground font-semibold">{email}</span>.
          Check your inbox and click the link to activate your account.
        </p>

        <button
          onClick={resend}
          disabled={cooldown > 0 || busy}
          className="mt-10 w-full rounded-xl py-4 bg-transparent border border-primary text-primary font-semibold text-sm press disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s...` : busy ? "Sending..." : "Resend Email"}
        </button>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
