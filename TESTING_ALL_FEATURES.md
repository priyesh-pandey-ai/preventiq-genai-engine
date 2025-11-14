# Complete Feature Testing Guide

## Overview

This guide covers testing all implemented AI features in the PreventIQ platform.

## Prerequisites

```bash
# 1. Apply all migrations
npx supabase db push

# 2. Deploy all edge functions
npx supabase functions deploy --no-verify-jwt

# 3. Set environment variables
# AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
# AZURE_OPENAI_KEY=your-key
# BREVO_API_KEY=xkeysib-...
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-key
```

## 1. Lead Intake (Form Submission)

### What It Does
Captures new leads from landing page form submissions.

### How to Test

**From Landing Page:**
```
1. Go to your landing page
2. Fill out form: Name, Email, City, Organization Type
3. Submit
4. Check database: SELECT * FROM leads ORDER BY id DESC LIMIT 1;
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "city": "Mumbai",
    "org_type": "Technology",
    "lang": "en"
  }'
```

**Expected Result:**
- Lead appears in database
- Lead has no persona_id yet (null)
- Lead shows in Customer List in dashboard

**Note:** The lead-intake function is working correctly. It stores leads in the database. If it didn't trigger from your form, check that the form is calling the correct endpoint.

---

## 2. AI Persona Classification

### What It Does
Uses Azure OpenAI to analyze lead profile and assign appropriate persona.

### How to Test

**From UI:**
```
1. Go to Customer List
2. Find an unassigned lead (no persona badge)
3. Click "AI Classify" button
4. Wait for toast notification
5. Persona badge should appear
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/classify-persona \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1,
    "city": "Mumbai",
    "org_type": "Technology",
    "age": 35,
    "lang": "en"
  }'
```

**Expected Result:**
- Lead gets assigned persona_id (e.g., ARCH_PRO)
- Database updated: `UPDATE leads SET persona_id = 'ARCH_PRO' WHERE id = 1`
- UI shows colored persona badge
- AI provides classification reasoning

**Verify:**
```sql
SELECT id, name, persona_id FROM leads WHERE persona_id IS NOT NULL;
```

---

## 3. AI Lead Enrichment (Insights)

### What It Does
Analyzes lead profile to predict conversion likelihood, recommend messaging strategy, and suggest best send time.

### How to Test

**From UI:**
```
1. Go to Customer List
2. Find any lead (assigned or unassigned)
3. Click "AI Insights" button
4. Wait for processing
5. Purple "AI Insights" section appears below lead card
6. Shows: Conversion likelihood, Engagement level, Strategy, Best send time
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/enrich-lead \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1
  }'
```

**Expected Result:**
- AI insights now **persisted in database** (ai_insights column)
- Insights visible in UI immediately
- Insights remain after page refresh
- Shows conversion prediction and recommendations

**Verify Persistence:**
```sql
SELECT id, name, ai_insights FROM leads WHERE ai_insights IS NOT NULL;
```

**New in this update:** AI insights are now stored in the `ai_insights` JSONB column in the leads table, so they persist across sessions and page refreshes!

---

## 4. AI Campaign Optimization

### What It Does
Analyzes 30-day campaign performance and provides strategic recommendations.

### How to Test

**From UI:**
```
1. Go to WorkflowTriggers section
2. Click "AI Campaign Optimization" button
3. Wait for AI analysis
4. Toast shows key recommendations
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/optimize-campaigns \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

**Expected Result:**
- Returns top 3 optimization opportunities
- Suggests testing strategies
- Generates 5 innovative campaign ideas
- Provides success metrics recommendations

---

## 5. AI Email Body Generation

### What It Does
Generates unique, personalized email content for each lead based on their persona.

### How to Test

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-email-body \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "ARCH_PRO",
    "lead_name": "Priya Sharma",
    "lang": "hi",
    "subject_line": "Your Health Matters"
  }'
```

**Expected Result:**
- Returns JSON with greeting, body paragraphs, CTA, closing
- Content is in requested language (Hindi or English)
- Tailored to persona psychology
- No template fatigue - unique every time

**New Fix:** Now handles control characters in JSON (newlines, tabs) that were causing parse errors with Hindi content.

---

## 6. Send Email (Campaign)

### What It Does
Sends personalized email via Brevo with AI-generated content and tracking.

### How to Test

**From UI (Per-Lead):**
```
1. Go to Customer List
2. Find lead with persona assigned
3. Click "Send Email" button
4. Check your email inbox
5. Email arrives with AI content and tracking link
```

**From UI (Batch):**
```
1. Go to WorkflowTriggers
2. Click "Process Campaign Leads"
3. Processes up to 10 leads not emailed in 24h
4. Emails sent to all eligible leads
```

**Via API:**
```bash
# Send to specific lead
curl -X POST https://your-project.supabase.co/functions/v1/campaign-send \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [1, 2, 3]}'

# Send to all eligible (24h interval)
curl -X POST https://your-project.supabase.co/functions/v1/campaign-send \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

**Expected Result:**
- Email sent via Brevo API
- Assignment record created with variant_id and message_id
- Lead's last_email_sent_at updated
- Email contains AI-generated personalized content
- Tracking URL: `/functions/v1/track-click/{assignment_id}`

**Verify:**
```sql
SELECT id, lead_id, persona_id, variant_id, message_id, status 
FROM assignments 
ORDER BY id DESC LIMIT 10;

SELECT id, name, last_email_sent_at 
FROM leads 
WHERE last_email_sent_at IS NOT NULL;
```

---

## 7. Click Tracking

### What It Does
Tracks when users click CTA button in email and updates Thompson Sampling stats.

### How to Test

```
1. Receive email from campaign
2. Click "View Your Personalized Health Plan" button
3. Redirected to landing page
4. Click event recorded
```

**Verify Click Recorded:**
```sql
SELECT * FROM events WHERE type = 'click' ORDER BY id DESC LIMIT 10;
```

**Check Thompson Sampling Updated:**
```sql
SELECT * FROM variant_stats WHERE alpha > 1;
```

---

## 8. Email Event Sync

### What It Does
Syncs email events (delivered, opened, clicked) from Brevo to database.

### How to Test

**From UI:**
```
1. Go to WorkflowTriggers
2. Click "Sync Email Events" button
3. Wait for sync to complete
4. Check events table
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

**Verify Events Synced:**
```sql
SELECT 
  e.id,
  e.type,
  e.assignment_id,
  a.lead_id,
  e.ts
FROM events e
JOIN assignments a ON a.id = e.assignment_id
ORDER BY e.id DESC
LIMIT 20;
```

---

## 9. Thompson Sampling (Variant Selection)

### What It Does
Selects best-performing email subject line variants using multi-armed bandit algorithm.

### How to Test

See `THOMPSON_SAMPLING_GUIDE.md` for complete testing instructions.

**Quick Test:**
```sql
-- View current variant stats
SELECT * FROM get_variant_stats_for_persona('ARCH_PRO');

-- Send 10 emails (Thompson Sampling picks variants)
-- Click 5 of them
-- Sync events
-- Check stats updated:

SELECT persona_id, variant_id, alpha, beta,
       (alpha / (alpha + beta)) as estimated_ctr
FROM variant_stats
WHERE persona_id = 'ARCH_PRO';
```

---

## 10. AI Report Generation

### What It Does
Generates weekly performance report with AI analysis.

### How to Test

**From UI:**
```
1. Go to WorkflowTriggers
2. Click "Generate Analytics Report"
3. Wait for generation
4. Report appears in UI
```

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-report \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

**Expected Result:**
- Campaign KPIs (sends, clicks, CTR per persona)
- PMF Score calculation
- Top performing personas
- AI-generated insights and recommendations

---

## Complete End-to-End Test Flow

```
1. Lead submits form → lead-intake
2. Lead appears in dashboard
3. Click "AI Classify" → classify-persona
4. Persona assigned (e.g., ARCH_PRO)
5. Click "AI Insights" → enrich-lead
6. AI insights shown AND stored in database
7. Click "Send Email" → campaign-send
   - Creates assignment
   - Generates AI email body
   - Sends via Brevo
   - Updates lead timestamp
8. Check email inbox
9. Click CTA in email → track-click
10. Click "Sync Email Events" → sync-events
11. Verify Thompson Sampling stats updated
12. Click "Generate Report" → generate-report
13. View performance analytics
```

---

## Troubleshooting Common Issues

### Lead Intake Not Working
- **Check:** Form POST URL matches edge function endpoint
- **Check:** CORS headers configured
- **Check:** Database policies allow service_role inserts

### AI Insights Not Persisting
- **Fix Applied:** Migration adds `ai_insights` column
- **Run:** `npx supabase db push`
- **Deploy:** `npx supabase functions deploy enrich-lead --no-verify-jwt`

### Email Body Generation Parse Error
- **Fix Applied:** Better handling of control characters
- **Deploy:** `npx supabase functions deploy generate-email-body --no-verify-jwt`
- **Note:** Now strips newlines, tabs, and other control chars from JSON

### Email Not Sending
- **Check:** BREVO_API_KEY environment variable set
- **Check:** Brevo sender email verified (p24priyesh@gmail.com)
- **Check:** `variant_id` column exists in assignments table
- **Run:** Migration 20251113000004

### Thompson Sampling Not Updating
- **Check:** Events being synced from Brevo
- **Check:** `variant_stats` table exists
- **Check:** `increment_variant_alpha` function exists
- **Verify:** Click events in events table

---

## Database Health Checks

```sql
-- Check all features are working
SELECT 
  (SELECT COUNT(*) FROM leads) as total_leads,
  (SELECT COUNT(*) FROM leads WHERE persona_id IS NOT NULL) as classified_leads,
  (SELECT COUNT(*) FROM leads WHERE ai_insights IS NOT NULL) as leads_with_insights,
  (SELECT COUNT(*) FROM leads WHERE last_email_sent_at IS NOT NULL) as leads_emailed,
  (SELECT COUNT(*) FROM assignments) as total_emails_sent,
  (SELECT COUNT(*) FROM events WHERE type = 'click') as total_clicks,
  (SELECT COUNT(*) FROM variant_stats WHERE alpha > 1) as variants_with_clicks;
```

All features are now fully functional and testable!
