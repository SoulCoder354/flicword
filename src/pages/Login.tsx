import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, profile, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);

  useEffect(() => {
    if (params.get("verified") === "1") {
      toast.success("Email verified! Welcome to Flicword 🎉");
      params.delete("verified");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    if (loading) return;
    if (user) navigate(profile?.name ? "/home" : "/onboarding", { replace: true });
  }, [user, profile, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setUnverified(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/?verified=1` },
        });
        if (error) throw error;
        // Email confirmation required: user exists but no session
        if (!data.session) {
          navigate("/verify-email", { state: { email } });
          return;
        }
        toast.success("Account created — let's get started.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/email.*not.*confirm|confirm.*email/i.test(error.message)) {
            setUnverified(true);
            throw new Error("Please verify your email first. Check your inbox for the verification link.");
          }
          throw error;
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return toast.error("Enter your email first");
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/?verified=1` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent");
    navigate("/verify-email", { state: { email } });
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-8 py-10">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        <div className="mb-4 w-full max-w-[18rem] sm:max-w-[20rem] rounded-[2rem] overflow-hidden" style={{ backgroundColor: "#122121" }}>
          <img
            src="/logo.png"
            alt="Flicword wordmark"
            className="block h-auto w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Flicword<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          Learn words that stick, one flick at a time
        </p>

        <form onSubmit={submit} className="mt-12 w-full space-y-6">
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
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 text-left">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50 py-3 text-sm outline-none transition-colors"
            />
            {mode === "signin" && (
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-glow font-medium">
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>

          {unverified && (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-left">
              <p className="text-xs text-foreground/85 leading-relaxed">
                Please verify your email first. Check your inbox for the verification link.
              </p>
              <button
                type="button"
                onClick={resendVerification}
                disabled={busy}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary-glow"
              >
                Resend verification email →
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm press disabled:opacity-60"
          >
            {mode === "signup" ? "Create Account" : "Continue"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setUnverified(false); }}
          className="mt-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "signin" ? "New to Flicword? Create an account" : "Already have an account? Sign in"}
        </button>

        <p className="mt-10 text-[11px] text-muted-foreground leading-relaxed">
          By continuing, you agree to our{" "}
          <a href="https://www.notion.so/Terms-of-Service-Flicword-356a34a1352d80b09754ecc892bd5e0d"
            target="_blank" rel="noopener noreferrer"
            className="text-primary hover:text-primary-glow underline-offset-2 transition">
            Terms of Service
          </a>{" "}and{" "}
          <a href="https://www.notion.so/Privacy-Policy-Flicword-356a34a1352d80369b57f23e908aaedb"
            target="_blank" rel="noopener noreferrer"
            className="text-primary hover:text-primary-glow underline-offset-2 transition">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
