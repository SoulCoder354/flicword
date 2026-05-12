import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  daily_goal: number;
  reminder_enabled: boolean;
  reminder_time: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from("users")
      .select("id,name,email,avatar_url,daily_goal,reminder_enabled,reminder_time")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as any) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        refreshProfile: async () => session?.user && fetchProfile(session.user.id),
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);

export const ProtectedRoute = ({ children, requireName = true }: { children: ReactNode; requireName?: boolean }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="glass rounded-2xl px-5 py-3 text-sm text-foreground/70">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  if (requireName && profile && !profile.name) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};
