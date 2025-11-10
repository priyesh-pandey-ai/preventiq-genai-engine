-- Create function to increment variant alpha (for bandit algorithm)
CREATE OR REPLACE FUNCTION public.increment_variant_alpha(
  p_persona_id TEXT,
  p_variant_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.variant_stats (persona_id, variant_id, alpha, beta)
  VALUES (p_persona_id, p_variant_id, 2, 1)
  ON CONFLICT (persona_id, variant_id)
  DO UPDATE SET alpha = variant_stats.alpha + 1;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.increment_variant_alpha(TEXT, TEXT) TO service_role;