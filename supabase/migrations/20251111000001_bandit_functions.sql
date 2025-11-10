-- Migration: Add database functions for Thompson Sampling bandit algorithm
-- Created: 2025-11-11
-- Description: Functions to manage variant statistics for multi-armed bandit

-- Function to increment alpha (success count) when a click happens
CREATE OR REPLACE FUNCTION increment_variant_alpha(
  p_persona_id TEXT,
  p_variant_id TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO variant_stats (persona_id, variant_id, alpha, beta)
  VALUES (p_persona_id, p_variant_id, 2, 1)  -- Start with alpha=2 (1 base + 1 click)
  ON CONFLICT (persona_id, variant_id)
  DO UPDATE SET alpha = variant_stats.alpha + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment beta (failure count) when a send happens without click
CREATE OR REPLACE FUNCTION increment_variant_beta(
  p_persona_id TEXT,
  p_variant_id TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO variant_stats (persona_id, variant_id, alpha, beta)
  VALUES (p_persona_id, p_variant_id, 1, 2)  -- Start with beta=2 (1 base + 1 non-click)
  ON CONFLICT (persona_id, variant_id)
  DO UPDATE SET beta = variant_stats.beta + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get total clicks for a persona (for explore/exploit threshold)
CREATE OR REPLACE FUNCTION get_total_clicks_for_persona(p_persona_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM((alpha - 1)::INTEGER), 0)::INTEGER
  FROM variant_stats
  WHERE persona_id = p_persona_id;
$$ LANGUAGE sql STABLE;

-- Function to get variant statistics for bandit selection
CREATE OR REPLACE FUNCTION get_variant_stats_for_persona(p_persona_id TEXT)
RETURNS TABLE (
  variant_id TEXT,
  alpha DOUBLE PRECISION,
  beta DOUBLE PRECISION,
  estimated_ctr DOUBLE PRECISION,
  total_trials INTEGER
) AS $$
  SELECT 
    variant_id,
    alpha,
    beta,
    (alpha / (alpha + beta))::DOUBLE PRECISION as estimated_ctr,
    ((alpha + beta - 2)::INTEGER) as total_trials
  FROM variant_stats
  WHERE persona_id = p_persona_id
  ORDER BY estimated_ctr DESC;
$$ LANGUAGE sql STABLE;

-- Function to get campaign KPIs for reporting
CREATE OR REPLACE FUNCTION get_campaign_kpis(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  persona_id TEXT,
  persona_label TEXT,
  total_sends BIGINT,
  total_clicks BIGINT,
  ctr DOUBLE PRECISION
) AS $$
  SELECT 
    p.id as persona_id,
    p.label as persona_label,
    COUNT(DISTINCT a.id) as total_sends,
    COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END) as total_clicks,
    CASE 
      WHEN COUNT(DISTINCT a.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END)::FLOAT / COUNT(DISTINCT a.id)::FLOAT)
      ELSE 0 
    END as ctr
  FROM personas p
  LEFT JOIN assignments a ON a.persona_id = p.id 
    AND a.send_at BETWEEN p_start_date AND p_end_date
  LEFT JOIN events e ON e.assignment_id = a.id
  WHERE p.is_archetype = TRUE
  GROUP BY p.id, p.label
  ORDER BY ctr DESC;
$$ LANGUAGE sql STABLE;

-- Function to calculate PMF score
-- Formula: (Number of Personas with CTR > Global Median CTR) / Total Personas * Global CTR
CREATE OR REPLACE FUNCTION calculate_pmf_score(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_median_ctr DOUBLE PRECISION;
  v_global_ctr DOUBLE PRECISION;
  v_personas_above_median INTEGER;
  v_total_personas INTEGER;
  v_pmf_score DOUBLE PRECISION;
BEGIN
  -- Get global CTR
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT a.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END)::FLOAT / COUNT(DISTINCT a.id)::FLOAT)
      ELSE 0 
    END INTO v_global_ctr
  FROM assignments a
  LEFT JOIN events e ON e.assignment_id = a.id
  WHERE a.send_at BETWEEN p_start_date AND p_end_date;

  -- Get median CTR
  WITH persona_ctrs AS (
    SELECT 
      p.id,
      CASE 
        WHEN COUNT(DISTINCT a.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END)::FLOAT / COUNT(DISTINCT a.id)::FLOAT)
        ELSE 0 
      END as ctr
    FROM personas p
    LEFT JOIN assignments a ON a.persona_id = p.id 
      AND a.send_at BETWEEN p_start_date AND p_end_date
    LEFT JOIN events e ON e.assignment_id = a.id
    WHERE p.is_archetype = TRUE
    GROUP BY p.id
  )
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ctr) INTO v_median_ctr
  FROM persona_ctrs;

  -- Count personas above median
  WITH persona_ctrs AS (
    SELECT 
      p.id,
      CASE 
        WHEN COUNT(DISTINCT a.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END)::FLOAT / COUNT(DISTINCT a.id)::FLOAT)
        ELSE 0 
      END as ctr
    FROM personas p
    LEFT JOIN assignments a ON a.persona_id = p.id 
      AND a.send_at BETWEEN p_start_date AND p_end_date
    LEFT JOIN events e ON e.assignment_id = a.id
    WHERE p.is_archetype = TRUE
    GROUP BY p.id
  )
  SELECT 
    COUNT(CASE WHEN ctr > v_median_ctr THEN 1 END),
    COUNT(*)
  INTO v_personas_above_median, v_total_personas
  FROM persona_ctrs;

  -- Calculate PMF score
  IF v_total_personas > 0 THEN
    v_pmf_score := (v_personas_above_median::FLOAT / v_total_personas::FLOAT) * v_global_ctr;
  ELSE
    v_pmf_score := 0;
  END IF;

  RETURN v_pmf_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION increment_variant_alpha TO service_role;
GRANT EXECUTE ON FUNCTION increment_variant_beta TO service_role;
GRANT EXECUTE ON FUNCTION get_total_clicks_for_persona TO service_role;
GRANT EXECUTE ON FUNCTION get_variant_stats_for_persona TO service_role;
GRANT EXECUTE ON FUNCTION get_campaign_kpis TO service_role;
GRANT EXECUTE ON FUNCTION calculate_pmf_score TO service_role;
