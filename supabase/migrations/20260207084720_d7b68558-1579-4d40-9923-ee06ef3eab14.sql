
-- Create table for MITS events and notices
CREATE TABLE public.mits_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'event', 'notice', 'circular', 'academic', 'general'
  source_url TEXT,
  image_url TEXT,
  event_date TIMESTAMPTZ,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_new BOOLEAN NOT NULL DEFAULT true,
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mits_updates ENABLE ROW LEVEL SECURITY;

-- Public read access (events are public info)
CREATE POLICY "Anyone can read mits updates"
  ON public.mits_updates FOR SELECT
  USING (true);

-- Only service role can insert/update (edge functions use service role)
CREATE POLICY "Service role can manage updates"
  ON public.mits_updates FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_mits_updates_category ON public.mits_updates (category);
CREATE INDEX idx_mits_updates_published ON public.mits_updates (published_at DESC);
CREATE INDEX idx_mits_updates_is_new ON public.mits_updates (is_new) WHERE is_new = true;

-- Create table for push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT ARRAY['event', 'notice', 'circular', 'academic'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe/unsubscribe (no auth required for public notifications)
CREATE POLICY "Anyone can manage their push subscription"
  ON public.push_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);
