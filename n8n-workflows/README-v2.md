# n8n Workflows Setup Guide (v2 - Simplified)

This folder contains **simplified** n8n workflows for PreventIQ automation using **HTTP Request nodes**.

---

## ⭐ Quick Start

**Use these simplified v2 workflows:**
- `flow-c-campaign-send-v2.json` - Daily campaign automation
- `flow-f-report-generation-v2.json` - Weekly report generation

**Advantages over v1:**
- ✅ Uses HTTP Request nodes (works reliably)
- ✅ Only 2 credentials needed (Supabase Service Role + Resend API)
- ✅ Simpler setup, no database connection issues
- ✅ Better error handling

---

## 📦 Workflows Included

### 1. Flow C v2: Campaign Send
**File:** `flow-c-campaign-send-v2.json` ⭐

**Purpose:** Daily automated email campaigns with Thompson Sampling variant selection

**Trigger:** Cron - Daily at 10:00 AM IST (4:30 AM UTC)

**What it does:**
1. ⏰ Cron trigger fires daily
2. 🔌 Calls `campaign-send` Edge Function via HTTP Request
3. 📧 Thompson Sampling selects best email variant for each lead
4. ✉️ Sends personalized emails via Resend API (HTTP Request)
5. 💾 Stores assignment records via Supabase REST API (direct INSERT)

**Key improvements:**
- Uses HTTP Request for all API calls
- Direct INSERT to assignments table via Supabase REST API
- Cleaner error handling

---

### 2. Flow F v2: Report Generation
**File:** `flow-f-report-generation-v2.json` ⭐

**Purpose:** Generate weekly campaign performance reports with AI insights

**Trigger:** Manual (run weekly or on-demand)

**What it does:**
1. 🎯 Manual trigger (click "Test workflow")
2. 📊 Calls `generate-report` Edge Function via HTTP Request
3. 🤖 Gets KPIs, PMF score, and Gemini AI insights
4. 🎨 Formats beautiful HTML report with:
   - Overall CTR and PMF score
   - Persona performance table
   - AI-powered insights and recommendations
   - 3 suggested subject lines for next campaign
5. 💾 Outputs HTML + key metrics

**Next steps:**
- Add "Write Binary File" node to save HTML report
- Add email node to send report to admin
- Add Slack/Discord node to post summary

---

## 🚀 Setup Instructions

### Step 1: Sign up for n8n Cloud

1. Go to https://n8n.io/cloud/
2. Create free account
3. Create a new workspace

---

### Step 2: Add Credentials (Only 2 Needed!)

#### 2.1 Supabase Service Role (HTTP Header Auth)

**Type:** HTTP Header Auth (Generic Credential)

**Configuration:**
1. In n8n, click **Credentials** → **Add Credential**
2. Search for "HTTP Header Auth"
3. Enter details:
   ```
   Name: Supabase Service Role
   Header Name: Authorization
   Header Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3ZuZHhkaHVjYmFrZ3V2a2d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTAxNSwiZXhwIjoyMDc4MzgxMDE1fQ.XPmdKJ8g9GWx8UOKLTQ8FpZAIhDKDj-L8Kg-_XeO37U
   ```
4. Click **Save**

**Used in:**
- Call campaign-send node (Edge Function invocation)
- Store Assignment node (Supabase REST API - INSERT)
- Call generate-report node (Edge Function invocation)

---

#### 2.2 Resend API

**Type:** HTTP Header Auth (Generic Credential)

**Configuration:**
1. In n8n, click **Credentials** → **Add Credential**
2. Search for "HTTP Header Auth"
3. Enter details:
   ```
   Name: Resend API
   Header Name: Authorization
   Header Value: Bearer re_GpPQkJU5_MVpcSg4d1VZYTQ5sVUU4LxZ2
   ```
4. Click **Save**

**Used in:**
- Send Email via Resend node (email sending)

---

### Step 3: Import Workflows

#### Import Flow C (Campaign Send)

1. In n8n, click **Workflows** → **Add workflow** → **Import from File**
2. Select `flow-c-campaign-send-v2.json`
3. Workflow will open in editor
4. **Link credentials to nodes:**
   - Click "Call campaign-send" node → Select "Supabase Service Role" credential
   - Click "Send Email via Resend" node → Select "Resend API" credential
   - Click "Store Assignment" node → Select "Supabase Service Role" credential
5. Click **Save** (give it a name like "PreventIQ - Campaign Send v2")
6. **Activate the workflow** (toggle switch in top right)

✅ **Done!** Workflow will run daily at 10 AM IST.

---

#### Import Flow F (Report Generation)

1. In n8n, click **Workflows** → **Add workflow** → **Import from File**
2. Select `flow-f-report-generation-v2.json`
3. Workflow will open in editor
4. **Link credentials:**
   - Click "Call generate-report" node → Select "Supabase Service Role" credential
5. Click **Save** (give it a name like "PreventIQ - Report Generation v2")
6. **Test it:** Click "Test workflow" in top right

✅ **Done!** You can now generate reports on-demand.

---

## 🧪 Testing

### Test Flow C (Campaign Send)

**Prerequisites:**
- At least 1 unassigned lead in database
- Verified email in Resend (p24priyesh@gmail.com)

**Steps:**
1. Open Flow C workflow in n8n
2. Click **Test workflow** (runs immediately, bypasses cron)
3. Watch execution:
   - ✅ "Call campaign-send" should return campaigns array
   - ✅ "Check if campaigns exist" should pass
   - ✅ "Split campaigns array" should create items
   - ✅ "Send Email via Resend" should return email_id
   - ✅ "Store Assignment" should insert record
4. Check results:
   - Email received at p24priyesh@gmail.com
   - Check `assignments` table for new record
   - Check Resend dashboard for email event

**If "No campaigns" returned:**
- Add test leads to database
- Check that leads don't already have assignments

---

### Test Flow F (Report Generation)

**Steps:**
1. Open Flow F workflow in n8n
2. Click **Test workflow**
3. Watch execution:
   - ✅ "Call generate-report" should return KPIs + insights
   - ✅ "Format HTML Report" should output HTML
4. View output:
   - Click "Format HTML Report" node
   - Click "Output" tab
   - Copy `html` field value
   - Paste into a `.html` file and open in browser

**Expected output:**
- Beautiful HTML report with metrics
- Persona performance table
- AI insights and recommended subject lines

---

## 📊 Monitoring

### View Workflow Executions

1. In n8n, go to **Executions** tab
2. See all workflow runs with status (Success/Error)
3. Click any execution to see detailed logs

### Flow C Monitoring

**Daily checks:**
- Did the cron trigger fire at 10 AM IST?
- How many campaigns were processed?
- Were emails sent successfully?
- Any errors in Store Assignment?

**Red flags:**
- "No campaigns" every day → Add more leads
- Email send failures → Check Resend API key
- Assignment insert errors → Check database permissions

### Flow F Monitoring

**Weekly checks:**
- Is PMF score improving?
- Which persona has best CTR?
- Are AI subject line recommendations relevant?

---

## 🎨 Customization

### Adjust Campaign Schedule

In Flow C, click "Daily at 10 AM IST" node:
- Change hour/minute for different send time
- Add multiple schedules (e.g., send at 10 AM + 6 PM)

### Customize Email Template

In Flow C, click "Send Email via Resend" node:
- Edit the `html` field in JSON body
- Change colors, add images, modify copy
- Add dynamic fields using `{{ $json.field_name }}`

### Add Report Delivery

After "Format HTML Report" node in Flow F:

**Option 1: Save to file**
1. Add "Write Binary File" node
2. Set file path: `/tmp/reports/preventiq-report-${new Date().toISOString()}.html`
3. Set data: `{{ $json.html }}`

**Option 2: Email report**
1. Add "Gmail" or "Send Email" node
2. Subject: "PreventIQ Weekly Report"
3. HTML Body: `{{ $json.html }}`
4. Attach or inline the report

**Option 3: Post to Slack**
1. Add "Slack" node
2. Channel: `#preventiq-reports`
3. Message: `{{ $json.text_summary }}`
4. Add metrics: `PMF: {{ $json.pmf_score }}, CTR: {{ $json.global_ctr }}%`

---

## 🔧 Troubleshooting

### Common Issues

#### "Authentication failed" for Supabase calls
**Solution:**
- Double-check Authorization header format: `Bearer eyJhbGc...` (must include "Bearer ")
- Verify Service Role Key is complete (starts with `eyJhbGc...`)
- Test by running Flow F manually (simpler than Flow C)

#### "Resend API authentication failed"
**Solution:**
- Check Authorization header format: `Bearer re_GpPQ...` (must include "Bearer ")
- Verify API key is active in Resend dashboard
- Test with curl first before using n8n

#### "campaign-send returns empty array"
**Solution:**
- Add test leads to database: `INSERT INTO leads (name, email, city, age, org_type) VALUES (...)`
- Check that leads don't already have assignments
- Verify personas table has entries

#### "Assignment insert fails"
**Solution:**
- Check that assignments table exists
- Verify all required fields are being sent (lead_id, persona_id, variant_subject_id, corr_id, status)
- Check Supabase table permissions (service_role should have INSERT access)
- Look at the error response in n8n execution logs

#### "No execution when cron should fire"
**Solution:**
- Check workflow is **activated** (toggle in top right)
- Verify n8n Cloud account is active
- Check timezone - 4:30 AM UTC = 10:00 AM IST

---

## 📁 Workflow Files

| File | Description | Status |
|------|-------------|--------|
| `flow-c-campaign-send-v2.json` | Daily campaigns (SIMPLIFIED) | ⭐ **Use This** |
| `flow-f-report-generation-v2.json` | Weekly reports (SIMPLIFIED) | ⭐ **Use This** |
| `flow-c-campaign-send.json` | Daily campaigns (v1 - HTTP Request nodes) | Legacy |
| `flow-f-report-generation.json` | Weekly reports (v1 - HTTP Request nodes) | Legacy |
| `README.md` (old) | v1 setup guide | Legacy |
| `README-v2.md` (this file) | v2 setup guide | ✅ Current |

---

## 🏗️ Architecture

### Data Flow - Campaign Send

```
┌─────────────────┐
│  Cron Trigger   │
│  (10 AM IST)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Call campaign-send         │
│  (Supabase Edge Function)   │ ◄── Native Supabase Node
└────────┬────────────────────┘
         │
         │ Returns: [{ lead_id, email, subject, variant_id, ... }]
         │
         ▼
┌─────────────────────────┐
│  Check if campaigns     │
│  exist (IF node)        │
└────────┬────────────────┘
         │
         │ Yes → campaigns.length > 0
         │
         ▼
┌─────────────────────────┐
│  Split campaigns array  │
│  (One item per lead)    │
└────────┬────────────────┘
         │
         │ For each lead...
         │
         ▼
┌──────────────────────────┐
│  Send Email via Resend   │
│  (HTTP Request)          │
└────────┬─────────────────┘
         │
         │ Returns: { id: "email_id_from_resend" }
         │
         ▼
┌──────────────────────────────┐
│  Store Assignment            │
│  (Supabase SQL Query)        │ ◄── Native Supabase Node
│  INSERT INTO assignments...  │
└──────────────────────────────┘
```

### Data Flow - Report Generation

```
┌─────────────────┐
│ Manual Trigger  │
│  (User clicks)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  Call generate-report        │
│  (Supabase Edge Function)    │ ◄── Native Supabase Node
└────────┬─────────────────────┘
         │
         │ Returns: { kpis: [...], metrics: {...}, insights: {...} }
         │
         ▼
┌─────────────────────────┐
│  Format HTML Report     │
│  (JavaScript Code)      │
└────────┬────────────────┘
         │
         │ Outputs: { html, text_summary, pmf_score, ... }
         │
         ▼
    [End / Add more nodes]
    - Save to file
    - Email report
    - Post to Slack
```

---

## ✅ Next Steps

After importing workflows:

1. ✅ **Import both workflows** (Flow C + Flow F)
2. ✅ **Add credentials** (Supabase API + Resend API)
3. ✅ **Link credentials** to all nodes
4. ✅ **Test Flow F** manually (easier to test)
5. ✅ **Add test leads** to database (at least 5-10)
6. ✅ **Test Flow C** manually (before activating cron)
7. ✅ **Activate Flow C** (enable cron trigger)
8. ✅ **Monitor daily** (check executions tab)
9. ✅ **Run Flow F weekly** (generate reports)
10. ✅ **Customize** (email templates, report delivery, etc.)

---

## 📞 Support

If you encounter issues:

1. Check this README troubleshooting section
2. Review n8n execution logs (very detailed)
3. Test Edge Functions directly via curl
4. Check Supabase Edge Function logs
5. Verify Resend dashboard for email events

---

**Happy Automating! 🚀**

*Generated for PreventIQ Campaign Engine*
*Using Thompson Sampling + Google Gemini AI*
