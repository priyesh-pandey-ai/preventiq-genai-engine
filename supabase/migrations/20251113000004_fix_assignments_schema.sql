-- Fix assignments table schema to match campaign-send implementation
-- Add variant_id column and message_id for Brevo tracking

-- Add variant_id column (references variants table)
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS variant_id TEXT REFERENCES public.variants(id);

-- Add message_id column for Brevo message tracking
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS message_id TEXT;

-- Add index on message_id for faster lookups during event sync
CREATE INDEX IF NOT EXISTS idx_assignments_message_id ON public.assignments(message_id);

-- Add index on variant_id
CREATE INDEX IF NOT EXISTS idx_assignments_variant_id ON public.assignments(variant_id);
