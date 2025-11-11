# n8n Credentials Setup Guide

This document provides step-by-step instructions for setting up all required credentials in n8n for PreventIQ workflows.

## Overview

You need to create **3 credentials** in n8n:

1. **Supabase API** - For calling Edge Functions
2. **Brevo API** (Header Auth) - For sending emails
3. **Supabase Postgres** - For database writes (assignments, email_log)

---

## Credential 1: Supabase API

### What it's used for
- Calling `campaign-send` Edge Function (Flow C)
- Calling `generate-report` Edge Function (Flow F)

### Setup Steps

1. **Log in to n8n Cloud** at https://app.n8n.cloud
2. Click **Credentials** in the left sidebar
3. Click **Add Credential** button (top right)
4. In the search box, type: `supabase`
5. Click on **Supabase API**
6. Fill in the form:

| Field | Value |
|-------|-------|
| **Credential Name** | `Supabase API` (or any friendly name) |
| **Host** | `https://zdgvndxdhucbakguvkgw.supabase.co` |
| **Service Role Secret** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3ZuZHhkaHVjYmFrZ3V2a2d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTAxNSwiZXhwIjoyMDc4MzgxMDE1fQ.XPmdKJ8g9GWx8UOKLTQ8FpZAIhDKDj-L8Kg-_XeO37U` |

7. Click **Save**

### How to get these values

- **Host**: Your Supabase project URL (Dashboard → Settings → API → Project URL)
- **Service Role Secret**: Dashboard → Settings → API → `service_role` key (⚠️ Keep this secret!)

---

## Credential 2: Brevo API (Header Auth)

### What it's used for
- Sending campaign emails (Flow C)
- Sending weekly reports (Flow F)

### Why Brevo?
- ✅ **300 free emails/day** (no credit card required)
- ✅ **No domain verification** needed for testing
- ✅ Simple API integration
- ✅ Detailed delivery tracking

### Setup Steps

#### Part A: Get Your Brevo API Key

1. **Sign up for Brevo** (if you haven't):
   - Go to https://www.brevo.com
   - Click **Sign up free**
   - Complete registration (confirm email)

2. **Generate API Key**:
   - Log in to https://app.brevo.com
   - Click **Settings** (top right gear icon)
   - Click **SMTP & API** in the left menu
   - Click **API Keys** tab
   - Click **Generate a new API key**
   - Name it: `PreventIQ n8n Integration`
   - Copy the generated key (format: `xkeysib-...`)
   - ⚠️ **Important**: Save this key somewhere safe - you can't view it again!

#### Part B: Create the Credential in n8n

1. In n8n, click **Credentials** → **Add Credential**
2. Search for: `header`
3. Click on **Header Auth**
4. Fill in the form:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `api-key` | ⚠️ Must be exactly `api-key` (lowercase, with hyphen) |
| **Value** | `xkeysib-...` | Paste your Brevo API key from Part A |

5. Click **Save**
6. When prompted for credential name, enter: `Brevo API`

### ⚠️ Common Mistakes

- ❌ **Wrong header name**: Using `Authorization` instead of `api-key`
- ❌ **Adding Bearer prefix**: Just paste the key directly (no `Bearer` prefix needed)
- ❌ **Typo in key**: Make sure you copied the entire key from Brevo

### Testing Your Brevo Credential

After importing Flow C, you can test the email sending:

1. Open Flow C workflow
2. Click on **"Send Email via Brevo"** node
3. Click **Execute Node** (this tests just this one node)
4. You should see a success response with `messageId` from Brevo
5. Check your email inbox for the test email

---

## Credential 3: Supabase Postgres

### What it's used for
- Writing assignment records to `assignments` table (Flow C)
- Writing email logs to `email_log` table (Flow C)

### Setup Steps

1. In n8n, click **Credentials** → **Add Credential**
2. Search for: `postgres`
3. Click on **Postgres**
4. Fill in the form:

| Field | Value |
|-------|-------|
| **Credential Name** | `Supabase Postgres` |
| **Host** | `aws-0-us-east-1.pooler.supabase.com` |
| **Database** | `postgres` |
| **User** | `postgres.zdgvndxdhucbakguvkgw` |
| **Password** | `gaim123` |
| **Port** | `6543` |
| **SSL** | **Enabled** (check the box) |

5. Click **Test Connection** (should show success ✅)
6. Click **Save**

### How to get these values

From your Supabase Dashboard:
- Go to **Settings** → **Database** → **Connection String**
- Select **Connection Pooling** tab
- Connection string format: `postgres://postgres.zdgvndxdhucbakguvkgw:gaim123@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- Parse it into the individual fields above

---

## Credential Summary

Once complete, your n8n Credentials page should show:

| Credential Name | Type | Used In |
|----------------|------|---------|
| Supabase API | Supabase API | Flow C, Flow F |
| Brevo API | Header Auth | Flow C, Flow F |
| Supabase Postgres | Postgres | Flow C |

---

## Linking Credentials to Workflows

After importing the workflow JSON files, you need to link these credentials to the nodes.

### Flow C: Daily Campaign Send

1. **Call campaign-send** node → Select `Supabase API`
2. **Send Email via Brevo** node → Select `Brevo API`
3. **Record Assignment** node → Select `Supabase Postgres`
4. **Log Email** node → Select `Supabase Postgres`

### Flow F: Weekly Report Generation

1. **Call generate-report** node → Select `Supabase API`
2. **Send Report Email** node → Select `Brevo API`

---

## Security Best Practices

### ✅ Do's

- ✅ Use n8n's built-in credential system (credentials are encrypted)
- ✅ Rotate API keys every 90 days
- ✅ Use different credentials for dev/staging/production
- ✅ Review n8n audit logs for credential access
- ✅ Enable 2FA on your n8n account

### ❌ Don'ts

- ❌ Never commit API keys to Git
- ❌ Don't share credentials via email or Slack
- ❌ Don't use production credentials in test workflows
- ❌ Don't reuse the same API key across multiple services

---

## Troubleshooting

### Supabase API Credential Issues

**Error**: `401 Unauthorized` or `Invalid JWT`

**Solutions**:
1. Verify you're using the **service_role** key (not anon key)
2. Check that Host URL matches your Supabase project
3. Make sure there are no extra spaces in the credential fields
4. Try regenerating the service_role key in Supabase Dashboard

---

### Brevo API Credential Issues

**Error**: `403 Forbidden`

**Solutions**:
1. Verify header name is exactly `api-key` (not `Authorization`)
2. Regenerate API key in Brevo dashboard and update credential
3. Check that your Brevo account is active (not suspended)
4. Ensure you haven't exceeded 300 emails/day limit

**Error**: `401 Unauthorized`

**Solutions**:
1. Copy the API key again from Brevo (you may have missed characters)
2. Don't add `Bearer` prefix - just paste the raw key
3. Make sure you're using the API key (not SMTP password)

---

### Postgres Credential Issues

**Error**: `Connection refused` or `Timeout`

**Solutions**:
1. Verify SSL is **enabled**
2. Check that port is `6543` (pooler port, not direct `5432`)
3. Ensure your IP isn't blocked by Supabase firewall
4. Try using the direct connection instead of pooler (if pooler fails)

**Error**: `Invalid password`

**Solutions**:
1. Reset database password in Supabase Dashboard → Settings → Database
2. Update the credential in n8n with new password
3. Make sure you're using the correct user format: `postgres.zdgvndxdhucbakguvkgw`

---

## Testing All Credentials

### Quick Test Checklist

After setting up all credentials, test each one:

1. **Supabase API**:
   - Import Flow C
   - Click **Execute Workflow**
   - Should call campaign-send successfully

2. **Brevo API**:
   - In Flow C, execute just the "Send Email via Brevo" node
   - Check response has `messageId`
   - Check Brevo dashboard shows email sent

3. **Supabase Postgres**:
   - In Flow C, execute "Record Assignment" node
   - Check Supabase → Table Editor → `assignments` table
   - New record should appear

---

## Next Steps

Once all credentials are working:

1. ✅ Import both workflow JSON files
2. ✅ Link credentials to all nodes (see "Linking Credentials" section above)
3. ✅ Test Flow C manually (Execute Workflow button)
4. ✅ Test Flow F manually (Execute Workflow button)
5. ✅ Activate both workflows (toggle switch in top right)
6. ✅ Monitor executions daily in n8n Executions tab

---

## Support

If you encounter issues not covered here:

- **n8n Community Forum**: https://community.n8n.io
- **Brevo Support**: https://help.brevo.com
- **Supabase Discord**: https://discord.supabase.com
- **Project Issues**: https://github.com/priyesh-pandey-ai/preventiq-genai-engine/issues
