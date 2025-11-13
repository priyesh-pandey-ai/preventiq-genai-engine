-- Add age and phone fields to leads table for better persona classification
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 120),
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index on age for faster persona classification queries
CREATE INDEX IF NOT EXISTS idx_leads_age ON public.leads(age);

-- Comment the new columns
COMMENT ON COLUMN public.leads.age IS 'Age of the lead in years, used for persona classification';
COMMENT ON COLUMN public.leads.phone IS 'Phone number of the lead for contact purposes';
