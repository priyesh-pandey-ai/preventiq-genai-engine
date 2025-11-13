# Campaign Flow Fixes - Implementation Summary

## Overview
This document summarizes the fixes implemented to address the issues identified in the PreventIQ campaign automation system.

## Issues Fixed

### 1. Persona Classification Logic
**Problem**: AI-based classification was not strictly following age rules, leading to inconsistent persona assignments.

**Solution**: 
- Implemented deterministic age-based classification rules in `classify-persona/index.ts`
- Age ranges now directly map to personas:
  - 18-25 years → `ARCH_STU` (Student/Young Adult)
  - 25-40 years (metro cities) → `ARCH_PRO` (Proactive Professional)
  - 35-50 years → `ARCH_TP` (Time-poor Parent)
  - 55+ years → `ARCH_SEN` (Skeptical Senior)
  - 40+ years → `ARCH_RISK` (At-risk but Avoidant)
- AI classification now used only as fallback when age is not provided
- Added `persona_id` column to leads table to persist persona assignments

**Testing**:
```sql
-- Check persona assignments
SELECT id, name, age, persona_id, created_at 
FROM leads 
ORDER BY created_at DESC;

-- Verify age-based classification
SELECT 
  persona_id,
  COUNT(*) as lead_count,
  MIN(age) as min_age,
  MAX(age) as max_age,
  AVG(age) as avg_age
FROM leads
WHERE persona_id IS NOT NULL
GROUP BY persona_id;
```

### 2. Click Tracking URL
**Problem**: Emails contained tracking URLs with format `/track?lead=X&variant=Y` but the `track-click` function expected `/track-click/{assignment_id}` in the URL path.

**Solution**:
- Reorganized n8n workflow to create assignment record BEFORE sending email
- Updated email template to include assignment_id in tracking URL: `https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/track-click/{assignment_id}`
- This allows `track-click` function to properly record clicks and update Thompson Sampling statistics

**Workflow Flow** (new order):
1. Split Campaigns
2. Record Assignment (get assignment_id)
3. Send Email via Brevo (use assignment_id in tracking URL)
4. Log Email Sent (update assignment status)

**Testing**:
```sql
-- Check assignments with tracking URLs
SELECT 
  a.id as assignment_id,
  l.email,
  a.persona_id,
  a.variant_subject_id,
  a.status,
  a.sent_at
FROM assignments a
JOIN leads l ON l.id = a.lead_id
ORDER BY a.id DESC
LIMIT 10;

-- Check click events
SELECT 
  e.id,
  e.assignment_id,
  e.type,
  e.ts,
  a.persona_id,
  a.variant_subject_id
FROM events e
JOIN assignments a ON a.id = e.assignment_id
WHERE e.type = 'click'
ORDER BY e.ts DESC;

-- Verify Thompson Sampling stats are being updated
SELECT 
  persona_id,
  variant_id,
  alpha,
  beta,
  (alpha / (alpha + beta)) as estimated_ctr
FROM variant_stats
ORDER BY estimated_ctr DESC;
```

### 3. Email Content Personalization
**Problem**: Emails were very basic with generic content, lacking persona-specific personalization.

**Solution**:
- Created comprehensive email content templates in `shared/persona-templates.ts`
- Each persona has unique messaging:
  - **ARCH_PRO**: Data-driven, performance-focused language
  - **ARCH_TP**: Family-focused, time-saving emphasis
  - **ARCH_SEN**: Traditional, trust-building tone
  - **ARCH_STU**: Budget-conscious, social proof
  - **ARCH_RISK**: Gentle nudging, procrastination awareness
  - **ARCH_PRICE**: Discount-focused, value proposition
- Templates available in English and Hindi
- Each template includes: greeting, intro, body, CTA, closing
- Email HTML now includes styled content with centered CTA button

**Example Email Structure**:
```html
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
  <p>{{ greeting }}</p>
  <p><strong>{{ intro }}</strong></p>
  <p>{{ body }}</p>
  <p style='text-align: center; margin: 30px 0;'>
    <a href='[tracking_url]' style='background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>
      {{ cta }}
    </a>
  </p>
  <p><em>{{ closing }}</em></p>
  <p>Best regards,<br>The PreventIQ Team</p>
</div>
```

### 4. Campaign Processing Logic
**Problem**: Campaign only processed unassigned leads (max 10 per run), leaving many leads without persona assignments or emails.

**Solution**:
- Changed query to select leads based on `last_email_sent_at` instead of assignment status
- Leads are now processed if:
  - `last_email_sent_at` is NULL (never emailed), OR
  - `last_email_sent_at` is older than 24 hours
- All leads get persona assignments stored in `leads.persona_id`
- `leads.last_email_sent_at` is updated after each email sent
- This ensures all leads eventually get classified and emailed

**Database Changes**:
```sql
-- New columns in leads table
ALTER TABLE leads 
  ADD COLUMN persona_id TEXT REFERENCES personas(id),
  ADD COLUMN last_email_sent_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX idx_leads_persona_id ON leads(persona_id);
CREATE INDEX idx_leads_last_email_sent_at ON leads(last_email_sent_at);
```

## Testing the Complete Flow

### 1. Add Test Leads with Different Ages
```sql
INSERT INTO leads (name, email, city, org_type, age, lang, is_test) VALUES
  ('Student User', 'student@test.com', 'Mumbai', 'College', 22, 'en', false),
  ('Professional User', 'pro@test.com', 'Bangalore', 'Tech Company', 32, 'en', false),
  ('Parent User', 'parent@test.com', 'Delhi', 'School', 42, 'en', false),
  ('Senior User', 'senior@test.com', 'Chennai', 'Hospital', 60, 'en', false),
  ('Risk User', 'risk@test.com', 'Pune', 'Clinic', 48, 'en', false),
  ('Hindi User', 'hindi@test.com', 'Mumbai', 'Hospital', 35, 'hi', false);
```

### 2. Trigger Campaign Workflow
- Manually run the "Flow C: Daily Campaign Send" workflow in n8n
- OR wait for scheduled trigger (9 AM daily)
- OR call the campaign-send Edge Function directly:
```bash
curl -X POST https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/campaign-send \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Verify Persona Assignments
```sql
SELECT 
  name,
  age,
  persona_id,
  last_email_sent_at,
  (SELECT label FROM personas WHERE id = leads.persona_id) as persona_label
FROM leads
WHERE is_test = false
ORDER BY created_at DESC;
```

### 4. Check Email Logs
```sql
SELECT 
  l.name,
  l.email,
  a.persona_id,
  v.content as subject_line,
  a.sent_at,
  a.corr_id as brevo_message_id
FROM assignments a
JOIN leads l ON l.id = a.lead_id
LEFT JOIN variants v ON v.id = a.variant_subject_id
WHERE a.status = 'sent'
ORDER BY a.sent_at DESC;
```

### 5. Test Click Tracking
1. Check your email inbox for the campaign emails
2. Click the "Learn More" (or persona-specific CTA) button
3. Verify click was recorded:
```sql
SELECT 
  l.email,
  a.persona_id,
  e.type,
  e.ts
FROM events e
JOIN assignments a ON a.id = e.assignment_id
JOIN leads l ON l.id = a.lead_id
ORDER BY e.ts DESC;
```

### 6. Verify Thompson Sampling Updates
```sql
-- Check variant stats (alpha should increase on clicks)
SELECT 
  vs.persona_id,
  vs.variant_id,
  vs.alpha as clicks_plus_one,
  vs.beta as non_clicks_plus_one,
  (vs.alpha - 1) as actual_clicks,
  v.content as subject_line
FROM variant_stats vs
LEFT JOIN variants v ON v.id = vs.variant_id
ORDER BY vs.persona_id, vs.alpha DESC;
```

## Business Logic Validation

### Persona Distribution
Expected distribution based on age ranges:
```sql
SELECT 
  p.label,
  COUNT(l.id) as lead_count,
  ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER (), 2) as percentage
FROM personas p
LEFT JOIN leads l ON l.persona_id = p.id AND l.is_test = false
WHERE p.is_archetype = true
GROUP BY p.id, p.label
ORDER BY lead_count DESC;
```

### Email Cadence
Verify 24-hour interval between emails:
```sql
SELECT 
  email,
  last_email_sent_at,
  NOW() - last_email_sent_at as time_since_last_email,
  CASE 
    WHEN last_email_sent_at IS NULL THEN 'Never emailed'
    WHEN NOW() - last_email_sent_at > INTERVAL '24 hours' THEN 'Ready for email'
    ELSE 'Too soon'
  END as email_status
FROM leads
WHERE is_test = false
ORDER BY last_email_sent_at DESC NULLS FIRST;
```

### Campaign Performance by Persona
```sql
SELECT 
  a.persona_id,
  COUNT(DISTINCT a.id) as emails_sent,
  COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END) as clicks,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.type = 'click' THEN e.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT a.id), 0) * 100, 
    2
  ) as ctr_percentage
FROM assignments a
LEFT JOIN events e ON e.assignment_id = a.id
WHERE a.status = 'sent'
GROUP BY a.persona_id
ORDER BY ctr_percentage DESC;
```

## Deployment Steps

### 1. Deploy Database Migration
```bash
npx supabase db push
# Or apply migration manually:
# supabase/migrations/20251113000003_add_persona_tracking_to_leads.sql
```

### 2. Deploy Edge Functions
```bash
npx supabase functions deploy classify-persona --no-verify-jwt
npx supabase functions deploy campaign-send --no-verify-jwt
```

### 3. Update n8n Workflow
1. In n8n, open "Flow C: Daily Campaign Send" workflow
2. Click ⋮ menu → Export
3. Replace with updated `n8n-workflows/flow-c-campaign-send.json`
4. Verify credentials are still linked:
   - Supabase API credential on "Call campaign-send" node
   - Brevo API credential on "Send Email via Brevo" node
   - Supabase Postgres credential on "Record Assignment" and "Log Email Sent" nodes
5. Test the workflow manually
6. Activate the workflow

### 4. Backfill Persona Assignments (Optional)
If you want to assign personas to existing leads without sending emails:
```sql
-- This would require a one-time script or manual edge function call
-- to classify existing leads without triggering emails
```

## Monitoring

### Key Metrics to Track
1. **Persona Assignment Rate**: % of leads with persona_id
2. **Email Delivery Rate**: % of assignments with status='sent'
3. **Click-Through Rate by Persona**: CTR for each persona
4. **Thompson Sampling Convergence**: Alpha/beta values stabilizing
5. **Error Rate**: Check error_log table for failures

### Alerting Queries
```sql
-- Leads without personas (should be 0 or decreasing)
SELECT COUNT(*) FROM leads WHERE is_test = false AND persona_id IS NULL;

-- Failed assignments (should be minimal)
SELECT COUNT(*) FROM assignments WHERE status = 'queued' AND send_at < NOW() - INTERVAL '1 hour';

-- Recent errors
SELECT * FROM error_log WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC;
```

## Rollback Plan

If issues arise, you can rollback:

1. **Revert n8n Workflow**: Import the backup `flow-c-campaign-send.json.bak` (if kept)
2. **Revert Edge Functions**: Deploy previous versions from git
3. **Database Changes**: The new columns are additive and won't break existing functionality
4. **Clean Up Test Data**:
```sql
DELETE FROM events WHERE assignment_id IN (SELECT id FROM assignments WHERE lead_id IN (SELECT id FROM leads WHERE is_test = true));
DELETE FROM assignments WHERE lead_id IN (SELECT id FROM leads WHERE is_test = true);
DELETE FROM leads WHERE is_test = true;
```

## Known Limitations

1. **Rate Limiting**: Still processes max 10 leads per run with 7-second delays
2. **Language Support**: Only English and Hindi templates
3. **Age Requirement**: Leads without age data fall back to AI classification
4. **Persona Migration**: Existing leads without age data may be misclassified

## Future Enhancements

1. Add more language templates
2. Implement A/B testing for email templates (not just subject lines)
3. Add lead scoring based on engagement
4. Implement dynamic content blocks based on city/org_type
5. Add unsubscribe functionality
6. Implement email preference center
