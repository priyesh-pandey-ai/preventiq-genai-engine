# n8n Workflows for PreventIQ Campaign Automation

This folder contains n8n workflow JSON files for automating PreventIQ's email campaigns using Thompson Sampling bandit algorithm and weekly performance reports.

## Files

- **flow-c-campaign-send.json** - Daily campaign automation (runs at 9 AM daily)
- **flow-f-report-generation.json** - Weekly report generation (runs at 10 AM every Monday)

## Prerequisites

1. **n8n Cloud Account** (or self-hosted n8n)
   - Sign up at https://n8n.io/cloud

2. **Supabase Project**
   - Project ID: zdgvndxdhucbakguvkgw
   - Project URL: https://zdgvndxdhucbakguvkgw.supabase.co

3. **Brevo Account** (Email Service Provider)
   - Sign up at https://www.brevo.com (free tier: 300 emails/day)
   - Get API key from: Settings → SMTP & API → API Keys

4. **Supabase Service Role Key**
   - Get from: Supabase Dashboard > Project Settings > API > service_role key

## Setup Instructions

### Step 1: Create Supabase API Credential in n8n

1. Log in to your n8n account
2. Go to **Credentials** (from the left sidebar)
3. Click **Add Credential**
4. Search for and select **Supabase API**
5. Configure the credential:
   - **Credential Name**: `Supabase API` (or any name you prefer)
   - **Host**: `https://zdgvndxdhucbakguvkgw.supabase.co`
   - **Service Role Secret**: `<your-service-role-key>`
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3ZuZHhkaHVjYmFrZ3V2a2d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTAxNSwiZXhwIjoyMDc4MzgxMDE1fQ.XPmdKJ8g9GWx8UOKLTQ8FpZAIhDKDj-L8Kg-_XeO37U
     ```
6. Click **Save**

### Step 2: Create Brevo API Credential in n8n

**Why Brevo?** Brevo (formerly Sendinblue) offers:
- 300 free emails/day (perfect for testing)
- No domain verification required (unlike Resend)
- Simple API integration

**Setup Steps:**

1. **Get your Brevo API Key**:
   - Log in to https://app.brevo.com
   - Go to **Settings** → **SMTP & API** → **API Keys**
   - Click **Generate a new API key**
   - Give it a name like "PreventIQ n8n"
   - Copy the generated key (format: `xkeysib-...`)

2. **Create the credential in n8n**:
   - In n8n, go to **Credentials** → **Add Credential**
   - Search for and select **Header Auth**
   - Configure it:
     - **Name** (HTTP header name): `api-key`
     - **Value**: Paste your Brevo API key (format: `xkeysib-...`)
   - Click **Save**
   - When prompted for a credential name, use: `Brevo API`

**Important**: The header name must be `api-key` (not `Authorization`), as this is what Brevo's API expects.

### Step 3: Create Supabase Postgres Credential in n8n

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for and select **Postgres**
3. Configure the credential:
   - **Credential Name**: `Supabase Postgres`
   - **Host**: `aws-0-us-east-1.pooler.supabase.com`
   - **Port**: `6543`
   - **Database**: `postgres`
   - **User**: `postgres.zdgvndxdhucbakguvkgw`
   - **Password**: `gaim123`
   - **SSL**: **Enable** (check the box)
4. Click **Test Connection** (should succeed)
5. Click **Save**

### Step 4: Import Workflows

#### Import Flow C (Campaign Send)

1. In n8n, click **Workflows** in the left sidebar
2. Click **Add Workflow** button
3. Click the **⋮** (three dots) menu in the top right
4. Select **Import from File**
5. Upload `flow-c-campaign-send.json`
6. The workflow will open in the editor

#### Link Credentials to Flow C Nodes

1. Click on the **"Call campaign-send"** node
   - In the **Credential to connect with** dropdown, select `Supabase API`
2. Click on the **"Send Email via Brevo"** node
   - In the **Credential to connect with** dropdown, select `Brevo API` (the Header Auth credential you created)
3. Click on the **"Record Assignment"** node
   - In the **Credential to connect with** dropdown, select `Supabase Postgres`
4. Click on the **"Log Email"** node
   - In the **Credential to connect with** dropdown, select `Supabase Postgres`
5. Click **Save** in the top right

#### Import Flow F (Report Generation)

1. Click **Workflows** > **Add Workflow**
2. Click **⋮** > **Import from File**
3. Upload `flow-f-report-generation.json`
4. Link credentials:
   - Click on the **"Call generate-report"** node → Select `Supabase API`
   - Click on the **"Send Report Email"** node → Select `Brevo API`
5. Click **Save**

### Step 5: Activate Workflows

1. Open **Flow C: Daily Campaign Send**
2. Toggle the **Active** switch in the top right to **ON**
3. Open **Flow F: Weekly Report Generation**
4. Toggle the **Active** switch to **ON**

## Workflow Details

### Flow C: Daily Campaign Send

**Schedule**: Every day at 9:00 AM

**What it does**:
1. Triggers automatically at 9 AM daily
2. Calls the `campaign-send` Edge Function
3. Edge Function:
   - Fetches up to 10 active leads who haven't been emailed in the last 24 hours
   - **AI-First**: Calls `classify-persona` using Azure OpenAI (Grok-3) to intelligently assign personas based on lead data
   - Updates leads table with `persona_id` and `last_email_sent_at`
   - Calls `generate-subjects` (Azure OpenAI) to create 3 AI-generated subject line variants per persona/language if none exist
   - Uses Thompson Sampling algorithm to select the best-performing variant
   - **NEW**: Calls `generate-email-body` (Azure OpenAI Grok-3) to create unique, personalized email content for each lead
   - Returns campaign data with AI-generated content to n8n
4. n8n workflow:
   - Splits the campaigns array into individual items
   - **Records assignment first** (to get assignment_id)
   - Sends each email via Brevo API with **AI-generated personalized content**
   - Updates assignment with Brevo message ID and status
   - Logs email details in `events` table with 'sent' event type

**Key Features**:
- **AI-First Persona Classification**: Azure OpenAI analyzes lead behavior patterns beyond simple age rules
  * Understands nuanced signals in city, organization type, and demographics
  * Provides explainable AI decisions
  * More accurate than deterministic rules for edge cases
- **AI-Generated Email Content**: Azure OpenAI creates unique, personalized emails for each lead
  * Every email is fresh and engaging (no template fatigue)
  * Tailored to persona psychology and motivations
  * 2-3 short paragraphs with emotional connection
  * Persona-specific calls-to-action
  * Fallback to static templates if AI unavailable
- **Thompson Sampling**: Automatically learns which subject lines work best for each persona over time
- **Rate Limiting**: 7-second delay between leads + 10-lead batch size to avoid API rate limits
- **Email Tracking**: Click tracking URLs use assignment_id for accurate attribution

**Nodes** (execution order):
- **Schedule Trigger**: Cron schedule (0 9 * * *)
- **Supabase Config**: Sets the Supabase host URL
- **Call campaign-send**: HTTP Request to Edge Function (processes up to 10 leads)
- **Has Campaigns?**: Conditional check - proceeds only if campaigns were generated
- **Split Campaigns**: Splits the campaigns array into individual items for processing
- **Record Assignment**: Inserts assignment record FIRST (to get assignment_id for tracking URL)
- **Send Email via Brevo**: HTTP POST to Brevo API with persona-specific personalized content
- **Log Email Sent**: Updates assignment status and logs event in events table

### Flow F: Weekly Report Generation

**Schedule**: Every Monday at 10:00 AM

**What it does**:
1. Triggers automatically at 10 AM every Monday
2. Calls the `generate-report` Edge Function with date range (last 7 days)
3. Edge Function:
   - Queries `get_campaign_kpis` stored procedure for performance metrics per persona
   - Calculates PMF score using `calculate_pmf_score` stored procedure
   - Uses Azure OpenAI (Grok-3) to generate AI insights about best-performing persona
   - AI also suggests 3 new creative subject lines for the top persona
   - Returns structured report data with KPIs and insights
4. n8n workflow:
   - Formats report data into beautiful HTML email with tables and charts
   - Sends report to admin email (p24priyesh@gmail.com) via Brevo
   - Includes: per-persona CTR, global metrics, PMF score, AI insights, and next campaign ideas

**Key Metrics**:
- **Per Persona**: Total sends, total clicks, CTR percentage
- **Global**: Total emails sent, total clicks, average CTR across all personas
- **PMF Score**: Product-Market Fit score based on engagement patterns
- **AI Insights**: Natural language summary of what's working and why
- **Next Ideas**: AI-generated subject line suggestions for upcoming campaigns

**Nodes**:
- **Schedule Trigger**: Cron schedule (0 10 * * 1 - Mondays at 10 AM)
- **Supabase Config**: Sets Supabase host URL and calculates date range (last 7 days)
- **Call generate-report**: HTTP Request to Edge Function with date range parameters
- **Format Report HTML**: JavaScript code node that transforms JSON report data into styled HTML email
- **Send Report Email**: HTTP POST to Brevo API with formatted HTML report

## Testing

### Manual Test (Before Activating)

1. Open the workflow in n8n
2. Click **Execute Workflow** button (top right, or **Test Workflow** in some versions)
3. Check the execution log:
   - Green checkmarks = success
   - Red X = error (check error message)
4. Verify in Supabase:
   - **Flow C**: Check `email_log` table for new records
   - **Flow F**: Check your email for the report

### Check Execution History

1. Go to **Executions** in the left sidebar
2. View past workflow runs
3. Click on any execution to see detailed logs

## Troubleshooting

### Error: "Unauthorized" or "Authentication failed"

- **Solution**: Verify your Supabase API credential has the correct Host and Service Role Secret

### Error: "403 Forbidden" from Brevo

- **Possible causes**:
  1. **Invalid API key** → Regenerate API key in Brevo dashboard and update n8n credential
  2. **Wrong header name** → Header must be `api-key` (not `Authorization`)
  3. **Account suspended** → Check Brevo dashboard for account status
  4. **Daily limit exceeded** → Free tier allows 300 emails/day, upgrade if needed

### Error: "Function not found"

- **Solution**: Ensure Edge Functions are deployed to Supabase:
  ```powershell
  npx supabase functions deploy campaign-send
  npx supabase functions deploy generate-report
  npx supabase functions deploy classify-persona
  npx supabase functions deploy generate-subjects
  ```

### Error: "429 Too Many Requests" or rate limit errors

- **Cause**: Azure OpenAI rate limits
- **Solution**: Already handled in campaign-send v2 with:
  - 7-second delay between leads
  - 10-lead batch size per execution
  - Will process all leads over multiple days

### No emails sent

- **Possible causes**:
  1. No leads in database → Add test leads to `leads` table
  2. All leads emailed in last 24 hours → Wait 24 hours or update `last_email_sent_at` to NULL
  3. Brevo API key not configured → Check n8n credential for typos
  4. Leads have `is_test = true` → campaign-send filters for `is_test = false`

### Emails not arriving in inbox

- **Possible causes**:
  1. **Check spam folder** → Brevo emails may be flagged initially
  2. **Verify sender email** → Make sure `p24priyesh@gmail.com` is a valid sender
  3. **Check Brevo dashboard** → Go to Campaigns → Email → Logs to see delivery status
  4. **Email quota exceeded** → Free tier has 300 emails/day limit

### Error: "No content in Azure OpenAI response"

- **Cause**: AI model returned empty response
- **Solution**: Check Supabase Edge Function logs:
  ```powershell
  npx supabase functions logs classify-persona
  npx supabase functions logs generate-subjects
  ```
- **Fix**: Verify Azure OpenAI secrets are set:
  ```powershell
  npx supabase secrets list
  ```
  Should show: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_MODEL_NAME`

### Workflow not triggering automatically

- **Solution**: Make sure the workflow is **Active** (toggle in top right should be ON/green)

## Architecture

```
n8n Cloud
  ↓ (HTTP Request with Supabase API auth)
Supabase Edge Function (campaign-send)
  ↓ (processes up to 10 leads with 7s delays)
  ├─ Checks persona_id in leads table
  │   └─ If missing: calls classify-persona Edge Function
  │       ├─ Age-based deterministic rules (primary)
  │       └─ Azure OpenAI Grok-3 (fallback when no age)
  ├─ Updates leads table: persona_id, last_email_sent_at
  ├─ Checks for existing variants
  │   └─ If missing: calls generate-subjects Edge Function (Azure OpenAI)
  ├─ Selects best variant using Thompson Sampling
  └─ Generates persona-specific email content
  ↓
campaign-send returns to n8n with campaign data
  ↓
n8n workflow:
  ├─ Split Campaigns (loop over each lead)
  ├─ Record Assignment (INSERT into assignments, get ID)
  ├─ Send Email via Brevo (with assignment_id in tracking URL)
  └─ Log Email Sent (UPDATE assignment, INSERT event)
  ↓
Brevo delivers emails to leads
  ↓ (click tracking: user clicks link with assignment_id)
track-click Edge Function
  ↓ (INSERT into events, call increment_variant_alpha)
variant_stats table (alpha/beta values for bandit algorithm)
```

**Thompson Sampling Flow**:
1. User clicks email link → `https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/track-click/{assignment_id}`
2. track-click Edge Function receives assignment_id
3. Edge Function looks up persona_id and variant_id from assignments table
4. Edge Function inserts click event into events table
5. Edge Function increments alpha (success count) in variant_stats table
6. Next campaign run: Thompson Sampling uses updated click data to select best variants
7. Over time: System learns which subject lines work best for each persona

## Next Steps

1. **Test Flow C Manually**:
   - Open Flow C workflow in n8n
   - Click **Execute Workflow** (or **Test Workflow**)
   - Should process 10 leads in ~70 seconds (7s delay × 10)
   - Check your Gmail for 10 test emails with different subject lines
   - Verify Supabase tables:
     - `assignments`: Should have 10 new records
     - `email_log`: Should have 10 new records with Brevo message IDs
     - `leads`: `last_email_sent_at` updated for 10 leads

2. **Verify Email Delivery**:
   - Go to https://app.brevo.com → Campaigns → Email → Logs
   - You should see 10 sent emails
   - Check delivery status (Sent, Delivered, Opened, Clicked)

3. **Run Flow C Again** (Process Remaining Leads):
   - Execute Flow C again to process the next 10 leads
   - Repeat until all 18 test leads have been emailed
   - Each run processes up to 10 leads with 7s delays

4. **Test Click Tracking**:
   - Open one of the emails you received
   - Click the "Learn More" link
   - Should redirect through `track-click` Edge Function
   - Verify `variant_stats` table has incremented click count

5. **Wait for Thompson Sampling to Learn**:
   - After 50+ clicks per persona, Thompson Sampling activates
   - System will automatically favor better-performing variants
   - Monitor `variant_stats` table to see alpha/beta values evolve

6. **Test Flow F** (Weekly Report):
   - After running Flow C a few times, you'll have campaign data
   - Manually execute Flow F workflow
   - Check your email for the formatted HTML report
   - Report should show: KPIs per persona, global metrics, AI insights, next campaign ideas

7. **Activate Automated Schedules**:
   - Toggle Flow C to **Active** → Runs daily at 9 AM
   - Toggle Flow F to **Active** → Runs Mondays at 10 AM

8. **Monitor Production**:
   - Check n8n **Executions** tab daily for errors
   - Review Brevo dashboard for delivery rates
   - Query Supabase `variant_stats` to see learning progress

## Support

- **n8n Documentation**: https://docs.n8n.io
- **Supabase Documentation**: https://supabase.com/docs
- **Brevo API Documentation**: https://developers.brevo.com/docs
- **Azure OpenAI Documentation**: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- **Project Repository**: https://github.com/priyesh-pandey-ai/preventiq-genai-engine

## Technical Notes

### Why Brevo Instead of Resend?

- **Resend** requires domain verification (DNS records) or limits to verified emails only
- **Brevo** allows 300 free emails/day without domain verification
- **Brevo** is perfect for testing with `p24priyesh@gmail.com` and `+` aliases
- **Production**: You can verify `preventiq.com` domain later for both services

### Why Azure OpenAI (Grok-3)?

- **Google Gemini** free tier has 10 requests/minute limit (too restrictive)
- **Azure OpenAI** offers higher rate limits and enterprise-grade reliability
- **Grok-3** model provides high-quality persona classification and subject line generation
- **Cost**: Relatively affordable for production use (~$0.01-0.02 per campaign run)

### Thompson Sampling Algorithm

- **Cold Start** (<50 clicks): Randomly selects variants to gather initial data
- **Exploitation Phase** (≥50 clicks): Uses Beta distribution to balance exploration vs exploitation
- **Alpha/Beta Values**: Stored in `variant_stats` table, updated on each click
- **Benefit**: Automatically learns and optimizes without manual A/B test management

### Rate Limiting Strategy

- **Problem**: Azure OpenAI has rate limits (varies by tier)
- **Solution**: 
  - 7-second delay between leads in `campaign-send` Edge Function
  - 10-lead batch size per workflow execution
  - Workflow runs daily → Gradually processes all leads
- **Example**: 100 leads = 10 days to fully process (10 leads/day)
