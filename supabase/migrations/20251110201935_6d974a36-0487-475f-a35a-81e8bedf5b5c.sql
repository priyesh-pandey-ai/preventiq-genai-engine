-- Create personas table for the 6 archetypes
CREATE TABLE IF NOT EXISTS public.personas (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  lang TEXT DEFAULT 'en',
  channels TEXT[] DEFAULT ARRAY['email'],
  tone_defaults TEXT[] DEFAULT ARRAY['professional', 'friendly'],
  is_archetype BOOLEAN DEFAULT FALSE
);

-- Seed with the 6 required archetypes
INSERT INTO public.personas (id, label, description, is_archetype) VALUES
('ARCH_PRO', 'Proactive Professional', '25-40, tech-savvy, seeks optimization and data.', TRUE),
('ARCH_TP', 'Time-poor Parent', '35-50, family-focused, concerned about hereditary risks.', TRUE),
('ARCH_SEN', 'Skeptical Senior', '55+, trusts doctors, wary of online ads.', TRUE),
('ARCH_STU', 'Student/Young Adult', '18-25, budget-conscious, influenced by social proof.', TRUE),
('ARCH_RISK', 'At-risk but Avoidant', '40+, knows they should get checked but procrastinates.', TRUE),
('ARCH_PRICE', 'Price-sensitive Seeker', 'Any age, primary motivation is a discount or free offer.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create variants table for AI-generated content
CREATE TABLE IF NOT EXISTS public.variants (
  id TEXT PRIMARY KEY,
  persona_id TEXT REFERENCES public.personas(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'email',
  tone TEXT,
  lang TEXT DEFAULT 'en',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create assignments table (maps leads to campaigns)
CREATE TABLE IF NOT EXISTS public.assignments (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  persona_id TEXT REFERENCES public.personas(id),
  variant_subject_id TEXT,
  variant_body_id TEXT,
  corr_id TEXT UNIQUE,
  status TEXT DEFAULT 'queued',
  send_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Create events table for tracking engagement
CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT REFERENCES public.assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  ts TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uniq_assignment_type UNIQUE (assignment_id, type)
);

-- Create variant_stats table for bandit algorithm
CREATE TABLE IF NOT EXISTS public.variant_stats (
  persona_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  alpha DOUBLE PRECISION DEFAULT 1,
  beta DOUBLE PRECISION DEFAULT 1,
  PRIMARY KEY(persona_id, variant_id)
);

-- Create sync_state table for stateful cursors
CREATE TABLE IF NOT EXISTS public.sync_state (
  source TEXT PRIMARY KEY,
  last_ts TIMESTAMPTZ DEFAULT now()
);

-- Seed initial cursor
INSERT INTO public.sync_state (source) VALUES ('email_events')
ON CONFLICT (source) DO NOTHING;

-- Create error_log table
CREATE TABLE IF NOT EXISTS public.error_log (
  id BIGSERIAL PRIMARY KEY,
  workflow_name TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Create service role policies for all tables
CREATE POLICY "Service role full access personas" ON public.personas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access variants" ON public.variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access assignments" ON public.assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access events" ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access variant_stats" ON public.variant_stats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access sync_state" ON public.sync_state FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access error_log" ON public.error_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_lead_id ON public.assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_assignments_persona_id ON public.assignments(persona_id);
CREATE INDEX IF NOT EXISTS idx_assignments_corr_id ON public.assignments(corr_id);
CREATE INDEX IF NOT EXISTS idx_events_assignment_id ON public.events(assignment_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON public.events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_variants_persona_id ON public.variants(persona_id);