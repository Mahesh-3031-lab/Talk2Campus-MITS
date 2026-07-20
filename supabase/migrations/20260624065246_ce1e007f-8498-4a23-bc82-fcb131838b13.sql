CREATE TABLE IF NOT EXISTS public.rate_limits (
  id           bigserial PRIMARY KEY,
  key          text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        integer NOT NULL DEFAULT 1,
  UNIQUE(key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

GRANT ALL ON public.rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limits_id_seq TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.rate_limits;
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL
  USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key       text,
  p_limit     integer,
  p_window_ms bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now          timestamptz := now();
  v_window_start timestamptz := v_now - (p_window_ms || ' milliseconds')::interval;
  v_count        integer;
BEGIN
  INSERT INTO public.rate_limits(key, window_start, count)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE
    SET
      count        = CASE
                       WHEN rate_limits.window_start < v_window_start
                       THEN 1
                       ELSE rate_limits.count + 1
                     END,
      window_start = CASE
                       WHEN rate_limits.window_start < v_window_start
                       THEN v_now
                       ELSE rate_limits.window_start
                     END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '5 minutes';
$$;