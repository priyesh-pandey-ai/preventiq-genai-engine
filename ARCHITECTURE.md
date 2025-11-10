# PreventIQ - System Architecture

**Simplified Hybrid Architecture:** Edge Functions (Supabase) + n8n Orchestration + Direct Webhooks

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PREVENTIQ SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │  React + TypeScript + Vite
│  (Landing)   │  - Lead capture form
└──────┬───────┘  - Instant value widget
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
├──────────────────┬──────────────────┬───────────────────────────┤
│  lead-intake     │ generate-subjects│  classify-persona         │
│  (Entry point)   │ (Gemini AI)      │  (Gemini AI)             │
├──────────────────┼──────────────────┼───────────────────────────┤
│ send-welcome-    │  track-click     │  campaign-send           │
│ email (Resend)   │  (URL redirect)  │  (Thompson Sampling)     │
├──────────────────┼──────────────────┼───────────────────────────┤
│  sync-events     │ generate-report  │                          │
│  (Webhooks)      │  (KPIs + Gemini) │                          │
└────────┬─────────┴─────────┬────────┴───────────────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRES DATABASE                     │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│   leads     │  personas   │  variants   │  assignments         │
├─────────────┼─────────────┼─────────────┼──────────────────────┤
│   events    │variant_stats│ sync_state  │  error_log           │
└─────────────┴─────────────┴─────────────┴──────────────────────┘
         ▲                   │
         │                   ▼
┌────────┴─────────┐  ┌──────────────┐
│  RESEND          │  │  n8n CLOUD   │
│  (Email Service) │  │  (2 Workflows)│
│                  │  │              │
│ • Sends emails   │  │ • Flow C:    │
│ • Real-time      │  │   Campaign   │
│   webhooks ──────┘  │   Send       │
│   (direct to        │              │
│    Edge Function)   │ • Flow F:    │
│                     │   Report Gen │
└─────────────────────┴──────────────┘
```

---

## 📊 Data Flow Diagrams

### 1️⃣ Lead Capture & Welcome Flow
```
User (Landing Page)
    │
    ▼
┌─────────────────────┐
│ lead-intake         │  1. Validate input
│ Edge Function       │  2. Insert to `leads` table
└──────┬──────────────┘  3. Return lead_id
       │
       ▼
┌─────────────────────┐
│ send-welcome-email  │  1. Fetch lead data
│ Edge Function       │  2. Call Resend API
└─────────────────────┘  3. Send welcome email
       │
       ▼
    Resend
    (Email delivered to user)
```

### 2️⃣ Daily Campaign Flow (Thompson Sampling Bandit)
```
n8n Cron (10 AM IST)
    │
    ▼
┌─────────────────────┐
│ campaign-send       │  1. Get unassigned leads (max 50)
│ Edge Function       │  2. For each lead:
└──────┬──────────────┘     a. Classify persona (Gemini AI)
       │                     b. Generate/fetch variants
       │                     c. Run Thompson Sampling:
       │                        - If <50 clicks: Random (explore)
       │                        - If ≥50 clicks: Beta sampling (exploit)
       │                     d. Select best variant
       │                  3. Return campaigns array
       ▼
┌─────────────────────┐
│ n8n Loop Node       │  For each campaign:
│                     │  1. Call Resend API
└──────┬──────────────┘  2. Get email_id
       │                  3. Store in `assignments` table
       ▼
    Resend
    (Emails sent to leads)
       │
       ▼
┌─────────────────────┐
│ Resend Webhooks     │  Real-time events:
│ (Direct to Edge Fn) │  • email.sent
└──────┬──────────────┘  • email.delivered
       │                  • email.opened
       │                  • email.clicked
       ▼
┌─────────────────────┐
│ sync-events         │  1. Find assignment by email_id
│ Edge Function       │  2. Insert event to `events` table
└──────┬──────────────┘  3. Update `variant_stats`:
       │                     - Clicked? Increment alpha
       │                     - Delivered? Increment beta
       ▼
   Database Updated
   (Thompson Sampling learns)
```

### 3️⃣ Click Tracking Flow
```
User clicks CTA link in email
    │
    ▼
┌─────────────────────┐
│ track-click         │  1. Find assignment by ID
│ Edge Function       │  2. Insert 'click' event
│ (/{assignment_id})  │  3. Increment variant alpha
└──────┬──────────────┘  4. Redirect to landing page
       │
       ▼
Landing Page (with UTM params)
```

### 4️⃣ Report Generation Flow
```
n8n Manual Trigger
    │
    ▼
┌─────────────────────┐
│ generate-report     │  1. Call get_campaign_kpis()
│ Edge Function       │     - Total leads, emails sent, clicks
└──────┬──────────────┘     - Per-persona CTR
       │                  2. Call calculate_pmf_score()
       │                  3. Format data for Gemini
       │                  4. Get AI insights
       │                  5. Return complete report JSON
       ▼
┌─────────────────────┐
│ n8n WeasyPrint Node │  Generate PDF from HTML
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Supabase Storage    │  Upload PDF
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ n8n Email Node      │  Send PDF link to admin
└─────────────────────┘
```

---

## 🔑 Key Design Decisions

### ✅ Why Edge Functions?
- **Serverless:** No server management, auto-scaling
- **Postgres RPC:** Direct database function calls (no ORM overhead)
- **Deno runtime:** Secure, fast, modern TypeScript
- **JWT auth:** Built-in authentication with Supabase

### ✅ Why Resend (not Brevo)?
- **Simpler API:** One HTTP request to send email
- **Direct webhooks:** No polling, real-time events
- **Better DX:** Cleaner docs, React Email support
- **Free tier:** 3,000 emails/month (vs Brevo 300/day)

### ✅ Why n8n (Hybrid Approach)?
- **Orchestration:** Perfect for cron jobs and complex workflows
- **Visual:** Non-technical users can modify workflows
- **Integrations:** 350+ pre-built nodes
- **Cost:** Free tier sufficient for MVP

### ✅ Why NOT n8n for Webhooks?
- **Unnecessary hop:** Resend → n8n → Edge Function → Database
- **Simpler direct:** Resend → Edge Function → Database
- **Fewer points of failure:** Less complexity
- **Faster:** No middleware latency

### ✅ Why Gemini 2.5 Flash?
- **Fast:** 1-2 second response time
- **Cheap:** $0.075 per 1M tokens (input)
- **Smart:** Good at persona classification and creative subject lines
- **JSON mode:** Structured output for easy parsing

---

## 🔐 Security Model

### Supabase Edge Functions
- **Row Level Security (RLS):** All tables protected
- **Service Role Key:** Used only by Edge Functions (not exposed to frontend)
- **Anon Key:** Frontend uses anon key for public endpoints
- **JWT Verification:** Disabled for public endpoints (lead-intake, track-click)

### Resend Webhooks
- **HTTPS only:** All webhook traffic encrypted
- **Signature verification (optional):** Svix headers for webhook authentication
- **IP allowlist (future):** Restrict to Resend IPs

### n8n Workflows
- **Credential store:** API keys stored securely in n8n vault
- **HTTPS endpoints:** All workflow webhooks use HTTPS
- **Access control:** Only authorized users can edit workflows

---

## 📈 Thompson Sampling Algorithm

### How It Works
```
For each persona:
    total_clicks = get_total_clicks_for_persona(persona_id)
    
    IF total_clicks < 50:
        # EXPLORE: Random selection
        selected_variant = random.choice(variants)
    ELSE:
        # EXPLOIT: Thompson Sampling
        FOR each variant:
            alpha = variant.alpha  # Successes (clicks)
            beta = variant.beta    # Failures (delivered but not clicked)
            
            # Sample from Beta distribution
            theta = Beta(alpha + 1, beta + 1).sample()
            
        # Select variant with highest theta
        selected_variant = argmax(theta)
```

### Why This Works
1. **Early exploration:** Random selection until 50 clicks (gather data)
2. **Smart exploitation:** Beta distribution models click-through rate uncertainty
3. **Automatic balancing:** Good variants get more trials, bad variants fade out
4. **Adaptive learning:** Continuously improves as more data arrives

---

## 🗄️ Database Schema

### Core Tables
```sql
-- Lead information
leads (id, name, email, city, age, org_type, created_at)

-- 6 persona archetypes
personas (id, archetype, description)

-- Email variants (subject lines, CTA text)
variants (id, subject, cta_text, persona_id)

-- Lead-variant assignments
assignments (id, lead_id, variant_id, persona_id, email_id, sent_at, status)

-- Email engagement events
events (id, assignment_id, event_type, event_data, created_at)

-- Thompson Sampling statistics
variant_stats (id, variant_id, alpha, beta, last_updated)

-- Sync state tracking
sync_state (id, last_cursor, last_synced_at)

-- Error logging
error_log (id, source, error_message, error_data, created_at)
```

### PostgreSQL Functions
```sql
-- Bandit algorithm functions
increment_variant_alpha(variant_id)    -- Increment clicks
increment_variant_beta(variant_id)     -- Increment non-clicks
get_total_clicks_for_persona(persona_id)  -- Get explore/exploit threshold
get_variant_stats_for_persona(persona_id) -- Get all variant stats

-- Reporting functions
get_campaign_kpis(start_date, end_date)   -- Aggregate metrics
calculate_pmf_score()                      -- Product-Market Fit score
```

---

## 🚀 Deployment Architecture

### Production Stack
```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                              │
├─────────────────────────────────────────────────────────────┤
│ Frontend:    Vercel (auto-deploy from main branch)         │
│ Backend:     Supabase (zdgvndxdhucbakguvkgw)               │
│ Database:    Postgres (Supabase managed)                   │
│ Functions:   Deno (Supabase Edge Functions)                │
│ Email:       Resend (webhook → Edge Function)              │
│ Workflows:   n8n Cloud (2 workflows)                       │
│ AI:          Google Gemini 2.5 Flash                       │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://zdgvndxdhucbakguvkgw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Gemini AI
GEMINI_API_KEY=AIzaSyDvpKsMsKvycla1rdjVaG-0R9grVPAOa5Q

# Resend
RESEND_API_KEY=re_GpPQkJU5_MVpcSg4d1VZYTQ5sVUU4LxZ2
```

---

## 📊 Monitoring & Observability

### What to Monitor

1. **Edge Functions:**
   - Execution time (target: <2s)
   - Error rate (target: <1%)
   - Invocation count

2. **Database:**
   - Active connections
   - Query performance
   - Table sizes

3. **Resend:**
   - Delivery rate (target: >98%)
   - Bounce rate (target: <2%)
   - Webhook delivery success

4. **n8n:**
   - Workflow execution success rate
   - Execution duration
   - Error logs

5. **Thompson Sampling:**
   - Variant CTR trends
   - Explore/exploit ratio
   - PMF score over time

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lead capture latency | <500ms | TBD |
| Email send latency | <3s | TBD |
| Webhook processing | <200ms | TBD |
| Report generation | <5s | TBD |
| Database query time | <100ms | TBD |
| Campaign prep time | <30s | TBD |

---

## 🔄 Workflow Summary

| Workflow | Type | Frequency | Purpose |
|----------|------|-----------|---------|
| **Flow C** | n8n Cron | Daily 10 AM IST | Prepare & send campaigns |
| **Flow F** | n8n Manual | On-demand | Generate PDF reports |
| **Webhooks** | Direct | Real-time | Process email events |

**Total n8n workflows: 2** (simplified from original 3)

---

## 📝 API Endpoints

### Public Endpoints (No Auth)
```
POST /functions/v1/lead-intake
POST /functions/v1/generate-subjects
GET  /functions/v1/track-click/{id}
```

### Private Endpoints (Service Role Key)
```
POST /functions/v1/campaign-send
POST /functions/v1/sync-events
POST /functions/v1/generate-report
POST /functions/v1/classify-persona
POST /functions/v1/send-welcome-email
```

---

## 🎉 Architecture Benefits

✅ **Simple:** Direct webhook flow, no unnecessary middleware  
✅ **Fast:** Edge functions + direct webhooks = low latency  
✅ **Scalable:** Serverless auto-scales to demand  
✅ **Cost-effective:** Pay-per-use, generous free tiers  
✅ **Maintainable:** Clear separation of concerns  
✅ **Observable:** Built-in monitoring in Supabase + n8n  
✅ **Intelligent:** Thompson Sampling learns from data  

---

**Total Services:** 4 (Supabase, Resend, n8n, Gemini)  
**Total Workflows:** 2 (Campaign Send, Report)  
**Total Edge Functions:** 8  
**Total Database Tables:** 8  
**Total PostgreSQL Functions:** 6  

**Architecture Status:** ✅ Production-Ready
