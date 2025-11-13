# Thompson Sampling Guide

## What is Thompson Sampling?

Thompson Sampling is a **multi-armed bandit algorithm** used to optimize which email subject line variants work best for each persona. Instead of just picking the best-performing variant, it balances:

1. **Exploitation** - Use variants that have worked well
2. **Exploration** - Try variants that haven't been tested much yet

This ensures we don't get stuck with a suboptimal variant just because it was lucky early on.

## How It Works

### Core Concept

For each persona and variant combination, we track:
- **Alpha (α)** - Number of successes (clicks) + 1
- **Beta (β)** - Number of failures (no click) + 1

These form a **Beta distribution** that represents our uncertainty about the true click-through rate (CTR).

### Algorithm Flow

```
For each email campaign:
1. Get variants for the persona
2. Sample from Beta(α, β) for each variant
3. Pick variant with highest sampled value
4. Send email with that variant
5. Track result:
   - If clicked → increment α (success)
   - If not clicked → increment β (failure)
```

### Example

**Variant A**: α=10, β=5 (estimated CTR: 10/15 = 66%)  
**Variant B**: α=3, β=2 (estimated CTR: 3/5 = 60%)

Thompson Sampling might pick B even though A has higher CTR because:
- B has fewer trials (more uncertainty)
- B's sampled value could be higher due to uncertainty
- This helps us learn if B might actually be better

### Database Schema

```sql
-- variant_stats table
CREATE TABLE variant_stats (
  persona_id TEXT,
  variant_id TEXT,
  alpha DOUBLE PRECISION DEFAULT 1,
  beta DOUBLE PRECISION DEFAULT 1,
  PRIMARY KEY (persona_id, variant_id)
);
```

### Functions

**increment_variant_alpha(persona_id, variant_id)**
- Called when email is clicked
- Increases alpha by 1 (records success)

**increment_variant_beta(persona_id, variant_id)**
- Called when email is sent but not clicked
- Increases beta by 1 (records failure)

**get_variant_stats_for_persona(persona_id)**
- Returns all variants with their stats
- Calculates estimated CTR: α / (α + β)

## How to Test Thompson Sampling

### Step 1: Check Current Variant Stats

```sql
-- View current stats for all personas
SELECT 
  vs.persona_id,
  p.label as persona_name,
  vs.variant_id,
  v.content as subject_line,
  vs.alpha,
  vs.beta,
  (vs.alpha / (vs.alpha + vs.beta))::NUMERIC(5,4) as estimated_ctr,
  (vs.alpha + vs.beta - 2) as total_trials
FROM variant_stats vs
JOIN personas p ON p.id = vs.persona_id
JOIN variants v ON v.id = vs.variant_id
ORDER BY vs.persona_id, estimated_ctr DESC;
```

### Step 2: Send Test Campaigns

```bash
# Option A: From UI
# Click "Process Campaign Leads" in WorkflowTriggers

# Option B: Via API
curl -X POST https://your-project.supabase.co/functions/v1/campaign-send \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json"
```

### Step 3: Simulate Clicks

```bash
# Get assignment ID from email tracking URL
# Click the CTA button in the test email

# Or manually track a click
curl -X GET https://your-project.supabase.co/functions/v1/track-click/ASSIGNMENT_ID
```

### Step 4: Sync Events from Brevo

```bash
# Option A: From UI
# Click "Sync Email Events" in WorkflowTriggers

# Option B: Via API
curl -X POST https://your-project.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### Step 5: Verify Stats Updated

```sql
-- Check that alpha incremented for clicked variants
SELECT * FROM variant_stats 
WHERE persona_id = 'ARCH_PRO' 
ORDER BY estimated_ctr DESC;
```

### Step 6: Check Campaign KPIs

```sql
-- View performance over last 7 days
SELECT * FROM get_campaign_kpis(
  NOW() - INTERVAL '7 days',
  NOW()
);
```

## Testing Checklist

- [ ] Create 3-5 subject line variants for a persona
- [ ] Send 10+ test emails to different test leads
- [ ] Click CTA buttons in 5 of the emails
- [ ] Run "Sync Email Events" to update stats
- [ ] Verify `variant_stats` shows alpha/beta updates
- [ ] Check that high-performing variants get selected more often
- [ ] Verify new/untested variants still get explored

## Expected Behavior

**Early Stage (< 50 total trials per persona)**
- All variants get tried fairly equally
- Exploration is high
- Stats are uncertain

**Mid Stage (50-200 trials)**
- Better variants start getting selected more
- Weak variants get tried less
- Uncertainty decreases

**Late Stage (> 200 trials)**
- Best variant selected ~80% of time
- Other variants still explored ~20%
- Adapts if performance changes

## Monitoring Queries

**Check if sampling is working:**
```sql
-- Variants should have different alpha/beta values if clicked/not-clicked
SELECT persona_id, variant_id, alpha, beta 
FROM variant_stats 
WHERE alpha > 1 OR beta > 1;
```

**View recent assignments to see variant selection:**
```sql
SELECT 
  a.id,
  a.lead_id,
  a.persona_id,
  a.variant_id,
  v.content as subject,
  a.status,
  a.send_at
FROM assignments a
JOIN variants v ON v.id = a.variant_id
ORDER BY a.id DESC
LIMIT 20;
```

**Check click events:**
```sql
SELECT 
  e.id,
  e.assignment_id,
  e.type,
  a.persona_id,
  a.variant_id,
  e.ts
FROM events e
JOIN assignments a ON a.id = e.assignment_id
WHERE e.type = 'click'
ORDER BY e.id DESC
LIMIT 20;
```

## Troubleshooting

**Problem**: All variants have α=1, β=1 (not updating)
- **Fix**: Check sync-events is calling increment_variant_alpha/beta
- **Fix**: Verify events table has click records
- **Fix**: Ensure assignments have correct variant_id

**Problem**: Only one variant ever selected
- **Fix**: Add more variants for the persona
- **Fix**: Ensure variants have is_active=true
- **Fix**: Check generate-subjects is creating diverse options

**Problem**: Stats don't change after clicks
- **Fix**: Run sync-events edge function
- **Fix**: Check Brevo webhook is configured
- **Fix**: Verify message_id links assignments to Brevo events

## Further Reading

- [Thompson Sampling Paper](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf)
- [Multi-Armed Bandit Algorithms](https://en.wikipedia.org/wiki/Multi-armed_bandit)
- [Beta Distribution](https://en.wikipedia.org/wiki/Beta_distribution)
