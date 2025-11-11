# n8n Workflows Setup Guide

This folder contains 2 n8n workflows for PreventIQ automation.

---

## 📦 Workflows Included

### 1. Flow C: Campaign Send (`flow-c-campaign-send.json`)
**Purpose:** Daily automated email campaigns with Thompson Sampling variant selection

**Trigger:** Cron - Daily at 10:00 AM IST (4:30 AM UTC)

**What it does:**
1. Calls `campaign-send` Edge Function to get prepared campaigns
2. Thompson Sampling selects best email variant for each lead
3. Sends emails via Resend API
4. Stores assignment records with Resend email_id
5. Logs errors to database if any fail

---

### 2. Flow F: Report Generation (`flow-f-report-generation.json`)
**Purpose:** Generate weekly campaign performance reports with AI insights

**Trigger:** Manual (run on-demand)

**What it does:**
1. Calls `generate-report` Edge Function
2. Gets KPIs, PMF score, and Gemini AI insights
3. Formats beautiful HTML report
4. (Future) Converts to PDF and emails to admin

---

## 🚀 Setup Instructions

### Step 1: Sign up for n8n Cloud

1. Go to https://n8n.io/cloud/
2. Create free account
3. Create a new workspace

---

### Step 2: Add Credentials

You need 3 credentials in n8n:

#### 2.1 Supabase Service Role

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for "HTTP Header Auth"
3. Configure:
   - **Credential Name:** `Supabase Service Role`
   - **Name:** `Authorization`
   - **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3ZuZHhkaHVjYmFrZ3V2a2d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTAxNSwiZXhwIjoyMDc4MzgxMDE1fQ.XPmdKJ8g9GWx8UOKLTQ8FpZAIhDKDj-L8Kg-_XeO37U`
4. Click **Create**

#### 2.2 Resend API

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for "HTTP Header Auth"
3. Configure:
   - **Credential Name:** `Resend API`
   - **Name:** `Authorization`
   - **Value:** `Bearer re_GpPQkJU5_MVpcSg4d1VZYTQ5sVUU4LxZ2`
4. Click **Create**

#### 2.3 Supabase Postgres (for Flow C - assignments table)

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for "Postgres"
3. Configure:
   - **Credential Name:** `Supabase Postgres`
   - **Host:** `aws-0-ap-southeast-1.pooler.supabase.com`
   - **Database:** `postgres`
   - **User:** `postgres.zdgvndxdhucbakguvkgw`
   - **Password:** `gaim123`
   - **Port:** `6543`
   - **SSL:** `allow` or `prefer`
4. Click **Create**

---

### Step 3: Import Workflows

#### Import Flow C (Campaign Send):

1. In n8n, click **Workflows** → **Add Workflow** → **Import from File**
2. Upload `flow-c-campaign-send.json`
3. The workflow will open in the editor
4. **Link credentials:**
   - Click on "Call campaign-send Edge Function" node
   - Select credential: `Supabase Service Role`
   - Click on "Send Email via Resend" node
   - Select credential: `Resend API`
   - Click on "Store Assignment in Supabase" node
   - Select credential: `Supabase Postgres`
   - Click on "Log Error to Database" node
   - Select credential: `Supabase Postgres`
5. Click **Save** (top right)
6. Click **Activate** toggle (top right) to enable the cron trigger

#### Import Flow F (Report Generation):

1. In n8n, click **Workflows** → **Add Workflow** → **Import from File**
2. Upload `flow-f-report-generation.json`
3. The workflow will open in the editor
4. **Link credentials:**
   - Click on "Call generate-report Edge Function" node
   - Select credential: `Supabase Service Role`
5. Click **Save**
6. To run manually: Click **Test workflow** or **Execute Workflow**

---

## 🧪 Testing the Workflows

### Test Flow C (Campaign Send):

**Before running, ensure you have test leads:**

```sql
-- Add test leads to Supabase (via SQL Editor)
INSERT INTO leads (name, email, city, age, org_type) VALUES
('John Doe', 'p24priyesh@gmail.com', 'Mumbai', 35, 'corporate'),
('Jane Smith', 'p24priyesh@gmail.com', 'Delhi', 42, 'msme'),
('Bob Johnson', 'p24priyesh@gmail.com', 'Bangalore', 28, 'startup');
```

**Manual test (before waiting for cron):**

1. Open Flow C workflow in n8n
2. Click **Test workflow** button
3. Watch the execution in real-time
4. Check your email inbox (p24priyesh@gmail.com)
5. Verify Resend Dashboard shows sent emails
6. Check Supabase `assignments` table for new records

**After testing, activate cron:**
- Toggle **Active** to enable daily 10 AM IST runs

---

### Test Flow F (Report Generation):

1. Open Flow F workflow in n8n
2. Click **Test workflow**
3. View the execution output
4. Copy the `html` field from the output
5. Save to a `.html` file and open in browser
6. Beautiful report should display!

---

## 📊 Monitoring

### n8n Execution History
- Go to **Executions** in n8n sidebar
- See all workflow runs (success/failure)
- Click any execution to see detailed logs

### Resend Dashboard
- Check https://resend.com/emails for sent emails
- Check https://resend.com/webhooks for webhook deliveries

### Supabase Dashboard
- Check `assignments` table for new campaign assignments
- Check `events` table for webhook events (sent, delivered, clicked)
- Check `variant_stats` table to see Thompson Sampling learning
- Check `error_log` table for any errors

---

## 🔧 Customization

### Change Campaign Time (Flow C):

1. Open Flow C in n8n editor
2. Click on "Daily at 10 AM IST" cron trigger node
3. Modify trigger time:
   - IST is UTC+5:30
   - 10:00 AM IST = 4:30 AM UTC
   - 12:00 PM IST = 6:30 AM UTC
   - 6:00 PM IST = 12:30 PM UTC
4. Save workflow

### Customize Email Template (Flow C):

1. Open Flow C → "Send Email via Resend" node
2. Edit the `html` field in JSON body
3. Modify subject line, content, styling
4. Save workflow

### Change Report Date Range (Flow F):

1. Open Flow F → "Call generate-report Edge Function" node
2. Modify `start_date` and `end_date` in JSON body:
   ```json
   {
     "start_date": "{{ $now.minus({ days: 30 }).toISO() }}",  // Last 30 days
     "end_date": "{{ $now.toISO() }}"
   }
   ```
3. Save workflow

---

## 🎯 Expected Results

### After Flow C runs successfully:

1. **Emails sent** via Resend to unassigned leads
2. **Assignments created** in Supabase with:
   - `lead_id`, `persona_id`, `variant_id`
   - `corr_id` = Resend email_id
   - `status` = 'sent'
   - `send_at` = current timestamp
3. **Resend webhooks** start firing:
   - `email.sent` → Creates event in database
   - `email.delivered` → Updates assignment status
   - `email.clicked` → Increments `variant_stats.alpha` (Thompson Sampling learns!)

### After Flow F runs successfully:

1. **HTML report generated** with:
   - Total sends, CTR, PMF score
   - Per-persona performance table
   - Gemini AI insights summary
   - Recommended new subject lines
2. **Output** available in n8n execution view

---

## 🐛 Troubleshooting

### Flow C Issues:

**"No campaigns" in output:**
- ✅ Expected if no unassigned leads in database
- Add test leads via SQL

**Email not sending:**
- Check Resend API credential is correct
- Verify `to` email is `p24priyesh@gmail.com` (your verified email)
- Check Resend dashboard for errors

**Assignment not stored:**
- Check Supabase Postgres credential
- Verify database password is correct
- Check Supabase logs for SQL errors

### Flow F Issues:

**No data in report:**
- Normal if no campaign has run yet
- Run Flow C first to generate data
- Wait for webhook events to populate stats

**Error calling generate-report:**
- Check Supabase Service Role credential
- Verify Edge Function is deployed
- Check Supabase Edge Function logs

---

## 📚 Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      FLOW C: Campaign Send                   │
└─────────────────────────────────────────────────────────────┘

Cron (10 AM IST)
    │
    ▼
Call campaign-send Edge Function
    │ (Returns: campaigns array with Thompson Sampling variants)
    ▼
Loop through campaigns
    │
    ▼
Send Email via Resend API
    │ (Returns: Resend email_id)
    ▼
Store Assignment in Supabase
    │ (corr_id = Resend email_id)
    ▼
Done!

Meanwhile...
Resend Webhook → sync-events Edge Function → Update variant_stats
(Thompson Sampling learns from clicks!)


┌─────────────────────────────────────────────────────────────┐
│                  FLOW F: Report Generation                   │
└─────────────────────────────────────────────────────────────┘

Manual Trigger
    │
    ▼
Call generate-report Edge Function
    │ (Runs SQL + calls Gemini AI)
    │
    ▼
Format as HTML
    │ (Beautiful report with charts)
    ▼
Output (save/view)
```

---

## 🎉 Success Checklist

- [ ] Both workflows imported to n8n
- [ ] All 3 credentials configured and tested
- [ ] Flow C activated (cron running)
- [ ] Test leads added to database
- [ ] Flow C manually tested (emails sent)
- [ ] Resend webhooks verified (check `events` table)
- [ ] Thompson Sampling stats updating (`variant_stats` table)
- [ ] Flow F manually tested (report generated)
- [ ] HTML report looks good in browser

---

## 🚀 Next Steps

Once both workflows are running:

1. **Deploy Frontend** to Vercel (lead capture form)
2. **Add Real Leads** via landing page
3. **Monitor Performance** daily
4. **Review Reports** weekly
5. **Optimize Variants** based on Thompson Sampling insights
6. **Scale Up** as needed!

---

**Need Help?**
- Check Supabase Edge Function logs
- Check n8n execution history
- Check Resend webhook deliveries
- Review DEPLOYMENT.md and ARCHITECTURE.md

Happy automating! 🎯
