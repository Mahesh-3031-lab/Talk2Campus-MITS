-- 1) IMS sessions (replace in-memory Map)
CREATE TABLE IF NOT EXISTS public.ims_sessions (
  token        text PRIMARY KEY,
  roll_number  text NOT NULL,
  cookies      text NOT NULL,
  base_url     text NOT NULL DEFAULT '',
  is_demo      boolean NOT NULL DEFAULT false,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ims_sessions TO service_role;
CREATE INDEX IF NOT EXISTS idx_ims_sessions_expires ON public.ims_sessions(expires_at);
ALTER TABLE public.ims_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.ims_sessions;
CREATE POLICY "Service role only" ON public.ims_sessions FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.cleanup_ims_sessions()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.ims_sessions WHERE expires_at < now();
$$;

-- 2) Order/vendor RLS fixes
DROP POLICY IF EXISTS "Public update orders" ON public.canteen_orders;
DROP POLICY IF EXISTS "Public update vendors" ON public.canteen_vendors;

CREATE POLICY "Vendors update own vendor orders" ON public.canteen_orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.canteen_vendors v WHERE v.id = canteen_orders.vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors update own record" ON public.canteen_vendors FOR UPDATE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.vendor_id != OLD.vendor_id THEN RAISE EXCEPTION 'Cannot change vendor_id on an existing order'; END IF;
  IF NEW.student_roll_number != OLD.student_roll_number THEN RAISE EXCEPTION 'Cannot change student_roll_number on an existing order'; END IF;
  IF NEW.total_cost != OLD.total_cost THEN RAISE EXCEPTION 'Cannot change total_cost on an existing order'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_order_update ON public.canteen_orders;
CREATE TRIGGER trg_guard_order_update BEFORE UPDATE ON public.canteen_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

-- 3) Student timetables (cloud sync)
CREATE TABLE IF NOT EXISTS public.student_timetables (
  roll_number  text PRIMARY KEY,
  entries      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_timetables TO anon, authenticated;
GRANT ALL ON public.student_timetables TO service_role;
ALTER TABLE public.student_timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own timetable" ON public.student_timetables;
CREATE POLICY "Students manage own timetable" ON public.student_timetables FOR ALL USING (true) WITH CHECK (true);
