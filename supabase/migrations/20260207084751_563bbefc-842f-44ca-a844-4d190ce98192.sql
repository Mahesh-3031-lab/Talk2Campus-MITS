
-- Fix overly permissive policies
-- mits_updates: only service role should insert/update/delete (done via service key, not anon)
DROP POLICY "Service role can manage updates" ON public.mits_updates;

-- push_subscriptions: restrict to INSERT and DELETE only (no UPDATE needed)
DROP POLICY "Anyone can manage their push subscription" ON public.push_subscriptions;

CREATE POLICY "Anyone can subscribe to push notifications"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read their subscription"
  ON public.push_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can unsubscribe by endpoint"
  ON public.push_subscriptions FOR DELETE
  USING (true);
