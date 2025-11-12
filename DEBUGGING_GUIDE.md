# PreventIQ Debugging Guide

This guide provides step-by-step troubleshooting procedures for diagnosing and fixing common issues with the PreventIQ GenAI Engine data pipeline.

---

## Table of Contents

1. [Dashboard Shows No Data](#dashboard-shows-no-data)
2. [n8n Workflow Verification](#n8n-workflow-verification)
3. [Supabase Connection Issues](#supabase-connection-issues)
4. [Edge Function Debugging](#edge-function-debugging)
5. [Common Error Messages](#common-error-messages)

---

## Dashboard Shows No Data

If users see an empty dashboard with no campaigns, leads, or analytics:

### Step 1: Verify Database Connection

```bash
# Check if Supabase environment variables are set
cat .env | grep SUPABASE

# Expected variables:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Check Database Tables

1. Open your Supabase project dashboard
2. Navigate to **Table Editor**
3. Verify these tables exist and have data:
   - `leads` - Should contain customer records
   - `assignments` - Should contain persona assignments
   - `personas` - Should have 6 default personas
   - `variants` - Should contain email variants
   - `events` - Should track clicks and opens

### Step 3: Inspect Browser Console

1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Common issues:
   - **CORS errors**: Verify allowed origins in Supabase settings
   - **Authentication errors**: User might need to re-login
   - **Network errors**: Check internet connection

### Step 4: Test Real-time Subscriptions

```javascript
// Run in browser console
const { data, error } = await window.supabase
  .from('leads')
  .select('count')
  .single();

console.log('Leads count:', data, 'Error:', error);
```

---

## n8n Workflow Verification

The PreventIQ engine relies on n8n workflows to automate campaign sending and analytics. Follow this checklist to ensure they're properly configured.

### Pre-Flight Checklist

- [ ] **n8n instance is running and accessible**
  - Test by visiting your n8n URL in a browser
  - Ensure you can log in to the n8n dashboard

- [ ] **Workflows are imported and activated**
  - Navigate to Workflows in n8n
  - Verify these workflows exist:
    - `Flow C: Campaign Send` - Sends daily campaigns
    - `Flow D: Event Sync` - Syncs email events from Brevo
    - `Flow F: Report Generation` - Generates PDF reports

- [ ] **Each workflow shows "Active" status**
  - Click on each workflow
  - Look for green "Active" toggle in top-right
  - If inactive, click to activate

### Credentials Verification

#### Supabase Credentials

1. In n8n, go to **Credentials** → **Supabase**
2. Verify these fields are populated:
   - **Host**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key**: Your Supabase service role key (from Supabase Dashboard → Settings → API)

3. Test the connection:
   - Click **Test Connection** button
   - Should return success message

#### Brevo (Email) Credentials

1. In n8n, go to **Credentials** → **Brevo API**
2. Verify:
   - **API Key**: Valid Brevo API key from your Brevo account
   - Test by sending a test email from n8n

#### Gemini AI Credentials

1. In n8n, go to **Credentials** → **HTTP Header Auth** (for Gemini)
2. Verify:
   - **Name**: `x-goog-api-key`
   - **Value**: Your Gemini API key

### Manual Workflow Testing

Test each workflow individually to isolate failure points:

#### Test Flow C: Campaign Send

1. Open the workflow in n8n
2. Click **Execute Workflow** button
3. Check execution log for errors
4. Verify in Supabase:
   ```sql
   SELECT COUNT(*) FROM assignments;
   ```
   The count should increase after execution

#### Test Flow D: Event Sync

1. Open the workflow
2. Verify the schedule trigger is active
3. Check recent executions in the workflow history
4. Look for successful API calls to Brevo

#### Test Flow F: Report Generation

1. This is typically manually triggered
2. Click **Execute Workflow**
3. Should generate a PDF report
4. Check Supabase `reports` table for new entries

### Common n8n Issues

**Issue**: Workflow shows "Error" status
- **Fix**: Click on the failed node to see error details
- Check credentials are valid
- Verify API endpoints are correct

**Issue**: Workflow executes but no data appears
- **Fix**: Check the workflow's data flow
- Add **Function** nodes to log intermediate data
- Verify Supabase table names match exactly

**Issue**: Schedule trigger not firing
- **Fix**: Verify timezone settings in n8n
- Check if n8n server time is correct
- Ensure workflow is activated

---

## Supabase Connection Issues

### Verify Supabase Configuration

1. **Check Row Level Security (RLS)**
   - Navigate to **Authentication** → **Policies** in Supabase
   - Ensure policies exist for `leads`, `assignments`, `events` tables
   - Test queries with anon key vs service role key

2. **Test Edge Functions**
   ```bash
   # Test lead-intake function
   curl -X POST https://your-project.supabase.co/functions/v1/lead-intake \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","city":"Mumbai","org_type":"Clinic"}'
   ```

3. **Check Function Logs**
   - In Supabase Dashboard, go to **Edge Functions** → Select function
   - Click **Logs** tab
   - Look for recent invocations and errors

### Common Supabase Errors

**Error**: `401 Unauthorized`
- **Cause**: Invalid or expired API key
- **Fix**: Regenerate keys in Supabase Dashboard → Settings → API

**Error**: `PGRST116 - The schema cache cannot be loaded`
- **Cause**: Database schema issue
- **Fix**: Restart Supabase or clear cache

**Error**: `Realtime connection failed`
- **Cause**: Websocket connection blocked or misconfigured
- **Fix**: 
  - Check browser console for websocket errors
  - Verify Supabase project is on a paid plan (if using intensively)
  - Check network/firewall settings

---

## Edge Function Debugging

### Enable Detailed Logging

Add comprehensive logging to Edge Functions:

```typescript
// Add to start of function
console.log('Function invoked with:', JSON.stringify(req.body));

// Add before database operations
console.log('Executing database query...');

// Add after operations
console.log('Operation successful:', JSON.stringify(result));
```

### Test Functions Locally

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Test function locally
supabase functions serve lead-intake --env-file .env.local

# In another terminal, test the function
curl -X POST http://localhost:54321/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","city":"Mumbai","org_type":"Clinic"}'
```

### Debug lead-intake Function

**Symptom**: Form submission succeeds but no lead appears in database

1. Check function logs in Supabase Dashboard
2. Verify required fields are being sent
3. Check for unique constraint violations (duplicate emails)
4. Ensure `is_test` and `consent` fields have defaults

**Symptom**: Welcome email not sent

1. Verify `RESEND_API_KEY` is set in Supabase Edge Function secrets
2. Check `send-welcome-email` function logs
3. Verify email template exists

### Debug campaign-send Function

**Symptom**: Leads exist but no campaigns created

1. Check if leads have `is_test: false`
2. Verify personas exist in database
3. Check if `GEMINI_API_KEY` is configured
4. Review rate limiting (7-second delay between leads)

**Common Issues**:
- **Gemini API rate limit**: Reduce batch size or increase delay
- **No variants generated**: Check Gemini API key and quota
- **Classification fails**: Review persona definitions

### Debug classify-persona Function

This function assigns leads to one of 6 personas using AI.

1. Test directly:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/classify-persona \
     -H "Authorization: Bearer SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"lead_id":1,"city":"Mumbai","org_type":"Clinic","lang":"en"}'
   ```

2. Check response format:
   ```json
   {
     "archetype": "value_driven_clinic_owner",
     "confidence": 0.85
   }
   ```

3. Common issues:
   - **Wrong persona assigned**: Review prompt in function code
   - **Function times out**: Reduce timeout or optimize prompt
   - **API quota exceeded**: Check Gemini usage dashboard

---

## Common Error Messages

### Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | Network or CORS issue | Check Supabase URL and CORS settings |
| `Invalid API key` | Wrong Supabase credentials | Regenerate and update .env file |
| `Session expired` | Auth token expired | Log out and log back in |
| `Real-time updates unavailable` | Websocket connection failed | Check network and Supabase status |

### Backend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT: no such file or directory` | Missing file or wrong path | Verify file paths in function code |
| `23505: duplicate key value` | Duplicate email in leads table | Use ON CONFLICT clause or check existing records |
| `PGRST204: No Content` | No matching records | Verify query filters and table data |
| `RPC call failed` | Database function error | Check function definition in Supabase |

### n8n Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid credentials` | Wrong API key or token | Update credential and save |
| `Request failed with status code 429` | Rate limit exceeded | Add delays or reduce frequency |
| `Connection timeout` | Network or server issue | Check n8n server and target API status |
| `Cannot read property 'json'` | Unexpected API response | Add error handling nodes |

---

## Diagnostic Workflow

Use this step-by-step workflow when facing any issue:

1. **Identify the symptom**
   - What is the user seeing?
   - What should be happening?

2. **Check the logs**
   - Browser console (Frontend)
   - Supabase Edge Function logs (Backend)
   - n8n execution logs (Automation)

3. **Isolate the component**
   - Is it a frontend display issue?
   - Is it a backend data issue?
   - Is it an automation issue?

4. **Test the pipeline**
   - Manually trigger the suspected component
   - Verify each step completes successfully
   - Check data flow between components

5. **Fix and verify**
   - Apply the fix
   - Test end-to-end user flow
   - Monitor for 24 hours to ensure stability

---

## Getting Help

If you've followed this guide and still have issues:

1. **Collect diagnostic information**:
   - Browser console errors
   - Supabase function logs
   - n8n execution history
   - Screenshots of the issue

2. **Check documentation**:
   - [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
   - [API_REFERENCE.md](./API_REFERENCE.md)
   - [n8n-workflows/README.md](./n8n-workflows/README.md)

3. **Contact support**:
   - Include all diagnostic information
   - Describe steps to reproduce
   - Note what you've already tried

---

## Preventive Maintenance

To avoid issues before they occur:

- [ ] **Weekly**: Check n8n workflow execution history for failures
- [ ] **Weekly**: Review Supabase function logs for errors
- [ ] **Monthly**: Verify all API credentials are valid
- [ ] **Monthly**: Check Supabase database storage usage
- [ ] **Quarterly**: Review and update rate limiting settings
- [ ] **Quarterly**: Test disaster recovery procedures

---

## Quick Reference Commands

```bash
# Check environment variables
cat .env | grep -E "(SUPABASE|GEMINI|BREVO)"

# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Count leads in database (requires jq)
curl "https://your-project.supabase.co/rest/v1/leads?select=count" \
  -H "apikey: YOUR_ANON_KEY" | jq

# Test lead intake function
curl -X POST https://your-project.supabase.co/functions/v1/lead-intake \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Debug Test","email":"debug@test.com","city":"Test City","org_type":"Test Org"}'

# Build and test frontend
npm run build && npm run preview
```

---

**Last Updated**: 2025-11-12  
**Version**: 1.0
