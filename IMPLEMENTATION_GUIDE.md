# PreventIQ Implementation Guide - Option C (Hybrid)

**Status:** Day 2 in Progress  
**Approach:** Supabase Edge Functions (heavy logic) + n8n (orchestration)

---

## ✅ What We've Built (65% → 75%)

### 1. Database Functions ✅ (Task 1)
**File:** `supabase/migrations/20251111000001_bandit_functions.sql`

**Functions Created:**
- `increment_variant_alpha(persona_id, variant_id)` - Increment success count on click
- `increment_variant_beta(persona_id, variant_id)` - Increment failure count on send without click  
- `get_total_clicks_for_persona(persona_id)` - Get total clicks for explore/exploit threshold
- `get_variant_stats_for_persona(persona_id)` - Get all variant statistics for bandit selection
- `get_campaign_kpis(start_date, end_date)` - Aggregate sends, clicks, CTR by persona
- `calculate_pmf_score(start_date, end_date)` - Calculate Product-Market Fit score

**Next Action:** Apply migration to Supabase

```sql
-- Run this in Supabase Dashboard → SQL Editor
-- Copy the entire content of supabase/migrations/20251111000001_bandit_functions.sql
```

---

### 2. Campaign Send Edge Function ✅ (Task 2)
**File:** `supabase/functions/campaign-send/index.ts`

**What It Does:**
1. **Fetches unassigned leads** from database (max 50 per run)
2. **Classifies each lead** into archetype via `classify-persona` function
3. **Gets/creates variants** for the persona (calls `generate-subjects` if needed)
4. **Runs bandit algorithm:**
   - **Explore Phase** (< 50 total clicks): Random uniform selection
   - **Exploit Phase** (≥ 50 clicks): Thompson Sampling (Beta distribution)
5. **Returns campaign data** for n8n to send via Brevo:
   ```json
   {
     "campaigns": [
       {
         "lead_id": 123,
         "lead_email": "user@example.com",
         "persona_id": "ARCH_PRO",
         "variant_id": "ARCH_PRO_1731342000_abc123",
         "subject": "Is your heart trying to tell you something?",
         "lang": "en"
       }
     ]
   }
   ```

**Bandit Algorithm Details:**
- **Thompson Sampling:** Samples from Beta(α, β) distribution per variant
- **α (alpha):** Number of clicks + 1 (success count)
- **β (beta):** Number of non-clicks + 1 (failure count)
- **Selection:** Variant with highest sample wins

**Next Action:** Deploy to Supabase

```bash
npx supabase functions deploy campaign-send --linked --no-verify-jwt
```

---

## 🚧 What's Next (Tasks 3-10)

### 3. Event Sync Edge Function (Task 3)
**File:** `supabase/functions/sync-events/index.ts` (to be created)

**Responsibilities:**
1. Read `last_ts` from `sync_state` table
2. Return cursor for n8n to use with Brevo API
3. Accept events array from n8n
4. Process each event:
   - Match `corr_id` (Brevo message ID) to `assignment_id`
   - Insert into `events` table
   - Update `variant_stats` (increment alpha on click, beta on send)
5. Update `last_ts` in `sync_state`

**Why This Design:**
- Edge Function handles DB logic (transactional, typed)
- n8n handles API polling (Brevo rate limits, retries, scheduling)

---

### 4. Generate Report Edge Function (Task 4)
**File:** `supabase/functions/generate-report/index.ts` (to be created)

**Responsibilities:**
1. Call `get_campaign_kpis(start_date, end_date)`
2. Call `calculate_pmf_score(start_date, end_date)`
3. Format data for Gemini prompt
4. Call Gemini API for:
   - Campaign summary (~100 words)
   - 3 new subject line ideas for best persona
5. Return JSON for n8n to generate PDF

**Response Format:**
```json
{
  "kpis": [
    {
      "persona_id": "ARCH_PRO",
      "persona_label": "Proactive Professional",
      "total_sends": 250,
      "total_clicks": 45,
      "ctr": 0.18
    }
  ],
  "pmf_score": 0.12,
  "global_ctr": 0.15,
  "insights": {
    "summary": "Proactive Professionals showed highest engagement...",
    "next_ideas": [
      "Data-driven health insights await you",
      "Your personalized wellness report is ready",
      "Science-backed prevention strategies"
    ]
  }
}
```

---

### 5. Brevo Setup (Task 5)

**Steps:**
1. Sign up: https://www.brevo.com/ (Free tier: 300 emails/day)
2. Get API key: Settings → SMTP & API → API Keys
3. Create email template:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>{{params.name}}, Your Personalized Health Insights</h1>
     <p>{{params.content}}</p>
     <a href="{{params.cta_url}}">Get Your Free Health Assessment</a>
     
     <!-- Tracking pixel -->
     <img src="{{params.track_url}}" width="1" height="1" />
   </body>
   </html>
   ```
4. Configure webhook:
   - URL: `https://[YOUR_N8N_INSTANCE]/webhook/brevo-events`
   - Events: `delivered`, `opened`, `clicked`
5. Store in Supabase secrets:
   ```bash
   npx supabase secrets set BREVO_API_KEY=your-api-key --linked
   ```

---

### 6-8. n8n Workflows (Tasks 6-8)

#### Flow C: Campaign Send (Cron: Daily 10 AM IST)
```
[Cron Schedule Node]
  ↓
[HTTP Request: Call campaign-send Edge Function]
  → GET https://[PROJECT].supabase.co/functions/v1/campaign-send
  → Headers: Authorization: Bearer [SERVICE_ROLE_KEY]
  ↓
[Split In Batches Node]
  → Loop through campaigns array
  ↓
[Brevo Send Email Node]
  → Template ID: [YOUR_TEMPLATE_ID]
  → To: {{$json.lead_email}}
  → Subject: {{$json.subject}}
  → Params: {
      name: {{$json.lead_name}},
      cta_url: https://[DOMAIN]/track-click/{{$json.assignment_id}}
    }
  ↓
[PostgreSQL Insert Node]
  → INSERT INTO assignments (lead_id, persona_id, variant_subject_id, corr_id, status)
  → VALUES ($lead_id, $persona_id, $variant_id, $messageId, 'sent')
  ↓
[Error Handler: Log to error_log table]
```

#### Flow D: Event Sync (Cron: Every 10 min)
```
[Cron Schedule Node]
  ↓
[PostgreSQL Read: Get cursor]
  → SELECT last_ts FROM sync_state WHERE source = 'email_events'
  ↓
[HTTP Request: Brevo Get Events API]
  → GET https://api.brevo.com/v3/smtp/statistics/events
  → Query: startDate={{$json.last_ts}}
  ↓
[Loop: For Each Event]
  ↓
[PostgreSQL: Find assignment by messageId]
  → SELECT id, persona_id, variant_subject_id FROM assignments WHERE corr_id = {{$json.messageId}}
  ↓
[Switch Node: Event Type]
  → Case 'click':
      [PostgreSQL: INSERT INTO events]
      [PostgreSQL: CALL increment_variant_alpha()]
  → Case 'delivered':
      [PostgreSQL: UPDATE assignments SET status = 'delivered']
  → Case 'opened':
      [PostgreSQL: INSERT INTO events (type='open')]
  ↓
[PostgreSQL: Update cursor]
  → UPDATE sync_state SET last_ts = NOW() WHERE source = 'email_events'
```

#### Flow F: Manual Report (Manual Trigger)
```
[Manual Trigger]
  ↓
[HTTP Request: Call generate-report Edge Function]
  → POST https://[PROJECT].supabase.co/functions/v1/generate-report
  → Body: { start_date: "2025-11-04", end_date: "2025-11-11" }
  ↓
[Code Node: Format HTML]
  → Convert KPIs JSON to HTML table
  ↓
[WeasyPrint Node / HTTP Request to WeasyPrint API]
  → Convert HTML to PDF
  ↓
[Supabase Storage Upload]
  → Upload PDF to bucket 'reports'
  ↓
[Send Email with Link]
  → To: admin@preventiq.com
  → Attachment: PDF link
```

---

## 🔑 Environment Variables Checklist

### Supabase Secrets (for Edge Functions)
```bash
npx supabase secrets set GEMINI_API_KEY=AIzaSyD... --linked  # ✅ DONE
npx supabase secrets set BREVO_API_KEY=xkeysib-... --linked   # ❌ TODO
```

### n8n Credentials
- **Supabase PostgreSQL:**
  - Host: `aws-1-ap-southeast-1.pooler.supabase.com`
  - Database: `postgres`
  - User: `postgres.zdgvndxdhucbakguvkgw`
  - Password: [From Supabase Dashboard]
  - Port: `5432`

- **Supabase REST API:**
  - URL: `https://zdgvndxdhucbakguvkgw.supabase.co`
  - Service Role Key: [From Supabase Dashboard]

- **Brevo API:**
  - API Key: [From Brevo Dashboard]

---

## 📋 Deployment Checklist

### Phase 1: Database Setup
- [ ] Apply `20251111000001_bandit_functions.sql` via Supabase SQL Editor
- [ ] Verify functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%variant%';`
- [ ] Test function: `SELECT get_total_clicks_for_persona('ARCH_PRO');`

### Phase 2: Edge Functions
- [ ] Deploy campaign-send: `npx supabase functions deploy campaign-send --linked`
- [ ] Test endpoint: 
  ```bash
  curl -X POST https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/campaign-send \
    -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
  ```
- [ ] Create sync-events function
- [ ] Create generate-report function
- [ ] Deploy all functions

### Phase 3: Brevo Integration
- [ ] Sign up for Brevo account
- [ ] Create email template
- [ ] Get API key
- [ ] Configure webhook
- [ ] Set Supabase secret

### Phase 4: n8n Workflows
- [ ] Sign up for n8n Cloud (https://n8n.io/)
- [ ] Add Supabase PostgreSQL credential
- [ ] Add Supabase HTTP credential
- [ ] Add Brevo credential
- [ ] Import/Build Flow C (Campaign Send)
- [ ] Import/Build Flow D (Event Sync)
- [ ] Import/Build Flow F (Report)
- [ ] Test each workflow manually

### Phase 5: End-to-End Testing
- [ ] Submit 5 test leads via landing page
- [ ] Manually trigger Flow C
- [ ] Verify emails sent in Brevo dashboard
- [ ] Click email link
- [ ] Verify event in `events` table
- [ ] Wait for Flow D to run (or trigger manually)
- [ ] Verify `variant_stats` updated
- [ ] Trigger Flow F
- [ ] Verify PDF generated

---

## 🎯 Current Progress

| Component | Status | File Location |
|-----------|--------|---------------|
| Database Functions | ✅ Created, ❌ Not deployed | `supabase/migrations/20251111000001_bandit_functions.sql` |
| campaign-send | ✅ Created, ❌ Not deployed | `supabase/functions/campaign-send/index.ts` |
| sync-events | ❌ Not created | - |
| generate-report | ❌ Not created | - |
| Brevo Account | ❌ Not set up | - |
| n8n Workflows | ❌ Not created | - |

**Next Immediate Actions:**
1. Apply database migration via Supabase Dashboard
2. Deploy campaign-send function
3. Set up Brevo account and get API key
4. Create sync-events and generate-report functions
5. Build n8n workflows

---

## 📞 Ready to Continue?

We've built **2 out of 4 Edge Functions** and the **database layer**. 

**What would you like to do next?**
A. Apply the migration and deploy campaign-send function
B. Create the remaining Edge Functions (sync-events, generate-report)
C. Set up Brevo account together
D. Build the n8n workflows (I can provide JSON exports)

Let me know and I'll guide you through! 🚀
