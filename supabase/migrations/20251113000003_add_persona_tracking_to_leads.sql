-- Add persona_id and last_email_sent_at to leads table for better tracking
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS persona_id TEXT REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- Create index on persona_id for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_persona_id ON public.leads(persona_id);

-- Create index on last_email_sent_at for campaign filtering
CREATE INDEX IF NOT EXISTS idx_leads_last_email_sent_at ON public.leads(last_email_sent_at);

-- Comment the new columns
COMMENT ON COLUMN public.leads.persona_id IS 'Assigned persona archetype for this lead';
COMMENT ON COLUMN public.leads.last_email_sent_at IS 'Timestamp of last campaign email sent to this lead';
