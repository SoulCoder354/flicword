
-- Word of the Day table
CREATE TABLE public.word_of_the_day (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  part_of_speech text,
  definition text,
  etymology text,
  synonyms text,
  antonyms text,
  casual_use text,
  professional_use text,
  date date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.word_of_the_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wotd_select_all_auth"
  ON public.word_of_the_day
  FOR SELECT
  TO authenticated
  USING (true);

-- Extra detail columns on word_history
ALTER TABLE public.word_history
  ADD COLUMN IF NOT EXISTS part_of_speech text,
  ADD COLUMN IF NOT EXISTS definition text,
  ADD COLUMN IF NOT EXISTS etymology text,
  ADD COLUMN IF NOT EXISTS synonyms text,
  ADD COLUMN IF NOT EXISTS antonyms text,
  ADD COLUMN IF NOT EXISTS casual_use text,
  ADD COLUMN IF NOT EXISTS professional_use text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS difficulty text;

-- Premium flag
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
