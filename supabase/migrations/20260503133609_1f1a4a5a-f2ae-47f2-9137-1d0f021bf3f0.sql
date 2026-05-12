
-- USERS profile table
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- SESSIONS
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  difficulty text,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.sessions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_sessions_user ON public.sessions(user_id, completed_at DESC);

-- WORD HISTORY
CREATE TABLE public.word_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  status text NOT NULL CHECK (status IN ('known','unknown')),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.word_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh_select_own" ON public.word_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wh_insert_own" ON public.word_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wh_update_own" ON public.word_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wh_delete_own" ON public.word_history FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_wh_user ON public.word_history(user_id, created_at DESC);

-- STREAKS
CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_session_date date
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_select_own" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert_own" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update_own" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- XP
CREATE TABLE public.xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 0
);
ALTER TABLE public.xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_select_own" ON public.xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_insert_own" ON public.xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "xp_update_own" ON public.xp FOR UPDATE USING (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_select_own" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ach_insert_own" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FEEDBACK
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_select_own" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fb_insert_own" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  INSERT INTO public.xp (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
