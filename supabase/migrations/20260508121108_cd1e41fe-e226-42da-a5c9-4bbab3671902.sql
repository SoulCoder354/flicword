CREATE TABLE public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  call_count integer NOT NULL DEFAULT 0,
  hour_window timestamptz NOT NULL,
  function_name text,
  success boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_api_usage_window ON public.api_usage(key_name, hour_window);
CREATE INDEX idx_api_usage_created ON public.api_usage(created_at DESC);