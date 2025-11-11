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

3. **Supabase Service Role Key**
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

### Step 2: Create Resend API Credential in n8n

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for and select **Header Auth**
3. You'll see two fields - fill them in:
   - **Name** (the HTTP header name): `Authorization`
   - **Value** (the header value): `Bearer re_GpPQkJU5_MVpcSg4d1VZYTQ5sVUU4LxZ2`
4. Click **Save**
5. Give it a friendly name like `Resend API` when prompted

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
2. Click on the **"Send Email via Resend"** node
   - In the **Credential to connect with** dropdown, select `Resend API` (the Header Auth credential)
3. Click on the **"Record Assignment"** node
   - In the **Credential to connect with** dropdown, select `Supabase Postgres`
4. Click on the **"Log Email"** node
   - In the **Credential to connect with** dropdown, select `Supabase Postgres`
5. Click **Save** in the top right

#### Import Flow F (Report Generation)

1. Click **Workflows** > **Add Workflow**
2. Click **⋮** > **Import from File**
3. Upload `flow-f-report-generation.json`
4. Click on the **"Call generate-report"** node
   - Select the `Supabase API` credential
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
   - Fetches active leads who haven't been emailed in the last 24 hours
   - Groups leads by persona
   - For each persona with ≥50 clicks in variant_stats:
     - Uses Thompson Sampling to select the best subject line variant
   - For personas with <50 clicks:
     - Randomly selects a subject line variant
   - Calls `generate-subjects` Edge Function to create 3 AI-generated subject lines
   - Sends emails via Resend API
   - Records email in email_log table

**Nodes**:
- **Schedule Trigger**: Cron schedule (0 9 * * *)
- **Supabase Config**: Sets the Supabase host URL
- **Call campaign-send**: HTTP Request to Edge Function with Supabase API authentication

### Flow F: Weekly Report Generation

**Schedule**: Every Monday at 10:00 AM

**What it does**:
1. Triggers automatically at 10 AM every Monday
2. Calls the `generate-report` Edge Function
3. Edge Function:
   - Calculates performance metrics for the past week
   - Per persona: email count, total clicks, click-through rate (CTR), best performing variant
   - Overall stats: total emails sent, total clicks, average CTR
   - Sends report to admin email (p24priyesh@gmail.com) via Resend

**Nodes**:
- **Schedule Trigger**: Cron schedule (0 10 * * 1 - Mondays at 10 AM)
- **Supabase Config**: Sets the Supabase host URL
- **Call generate-report**: HTTP Request to Edge Function with Supabase API authentication

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

### Error: "Function not found"

- **Solution**: Ensure Edge Functions are deployed to Supabase:
  ```powershell
  npx supabase functions deploy campaign-send
  npx supabase functions deploy generate-report
  ```

### No emails sent

- **Possible causes**:
  1. No leads in database → Add test leads to `leads` table
  2. All leads emailed in last 24 hours → Wait 24 hours or update `last_email_sent_at` to NULL
  3. Resend API key not configured → Check Supabase secrets:
     ```powershell
     npx supabase secrets list
     ```

### Workflow not triggering automatically

- **Solution**: Make sure the workflow is **Active** (toggle in top right should be ON/green)

## Architecture

```
n8n Cloud
  ↓ (HTTP Request with Supabase API auth)
Supabase Edge Function (campaign-send or generate-report)
  ↓
Supabase PostgreSQL Database
  ↓
Resend API (sends emails)
  ↓
Email delivered to leads
  ↓ (click tracking webhook)
Supabase Edge Function (sync-events)
  ↓
variant_stats table updated (Thompson Sampling data)
```

## Next Steps

1. **Add Test Leads**: Insert 10-20 test leads into the `leads` table covering all 6 personas
2. **Monitor Executions**: Check n8n Executions tab after 9 AM to verify Flow C runs successfully
3. **Wait for Data**: After a week of campaign sends, check the Monday 10 AM report from Flow F
4. **Optimize**: Analyze variant performance in `variant_stats` table to see Thompson Sampling in action

## Support

- **n8n Documentation**: https://docs.n8n.io
- **Supabase Documentation**: https://supabase.com/docs
- **Project Repository**: https://github.com/priyesh-pandey-ai/preventiq-genai-engine
