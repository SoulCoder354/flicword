CREATE TABLE public.quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_type text NOT NULL,
  difficulty text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 5,
  time_taken_seconds integer,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY qh_select_own ON public.quiz_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY qh_insert_own ON public.quiz_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY qh_delete_own ON public.quiz_history FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_quiz_history_user ON public.quiz_history(user_id, completed_at DESC);

CREATE TABLE public.sentence_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid REFERENCES public.quiz_history(id) ON DELETE CASCADE,
  word text NOT NULL,
  sentence_written text NOT NULL,
  rating integer NOT NULL DEFAULT 0,
  improvement_suggestion text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sentence_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY sa_select_own ON public.sentence_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sa_insert_own ON public.sentence_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sa_delete_own ON public.sentence_attempts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_sentence_attempts_user ON public.sentence_attempts(user_id, created_at DESC);