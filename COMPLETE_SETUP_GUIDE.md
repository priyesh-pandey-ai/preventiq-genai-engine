# PreventIQ Setup Guide - Complete Integration

This guide walks you through connecting all components of the PreventIQ GenAI Marketing Engine to get a fully functional system where users can log in and utilize the workflows.

## Current Status ✅

The following components are already set up and working:

- ✅ **Frontend Application**: React + Vite + TypeScript with Supabase integration
- ✅ **Authentication**: Supabase Auth with login/signup pages
- ✅ **Database**: PostgreSQL with all tables created (leads, personas, variants, assignments, events, etc.)
- ✅ **Edge Functions**: All Supabase functions deployed and ready
- ✅ **n8n Workflow Definitions**: JSON files ready for import
- ✅ **Dashboard**: Real-time analytics showing leads, campaigns, and clicks

## Prerequisites

Before starting, ensure you have:

1. **Supabase Account**: Active project at https://zdgvndxdhucbakguvkgw.supabase.co
2. **n8n Account**: Cloud or self-hosted instance
3. **Brevo Account**: For email sending (free tier available)
4. **Git Repository**: Access to this repository

## Step-by-Step Setup

### Part 1: Environment Configuration ✅ DONE

The `.env` file has been updated with the correct credentials:

```env
VITE_SUPABASE_PROJECT_ID="zdgvndxdhucbakguvkgw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3ZuZHhkaHVjYmFrZ3V2a2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDUwMTUsImV4cCI6MjA3ODM4MTAxNX0.-o28hz1ChwUZZQYTvxXGmwZHvilaFz0m02PLRPmBOlY"
VITE_SUPABASE_URL="https://zdgvndxdhucbakguvkgw.supabase.co"
GEMINI_API_KEY="AIzaSyDvpKsMsKvycla1rdjVaG-0R9grVPAOa5Q"
```

### Part 2: Deploy Supabase Migrations

1. **Apply Database Migrations**:
   ```bash
   # Navigate to your project
   cd /path/to/preventiq-genai-engine
   
   # Link to your Supabase project (if not already linked)
   npx supabase link --project-ref zdgvndxdhucbakguvkgw
   
   # Apply all migrations
   npx supabase db push
   ```

2. **Verify Tables Created**:
   - Go to Supabase Dashboard → Table Editor
   - Confirm these tables exist:
     - `leads`
     - `personas` (should have 6 archetype rows)
     - `variants`
     - `assignments`
     - `events`
     - `variant_stats`
     - `sync_state`
     - `error_log`

### Part 3: Deploy Edge Functions

1. **Set Supabase Secrets**:
   ```bash
   # Set Gemini API key
   npx supabase secrets set GEMINI_API_KEY="AIzaSyDvpKsMsKvycla1rdjVaG-0R9grVPAOa5Q" --linked
   ```

2. **Deploy All Functions**:
   ```bash
   # Deploy all edge functions
   npx supabase functions deploy lead-intake --linked --no-verify-jwt
   npx supabase functions deploy generate-subjects --linked --no-verify-jwt
   npx supabase functions deploy classify-persona --linked --no-verify-jwt
   npx supabase functions deploy track-click --linked --no-verify-jwt
   npx supabase functions deploy campaign-send --linked --no-verify-jwt
   npx supabase functions deploy sync-events --linked --no-verify-jwt
   npx supabase functions deploy generate-report --linked --no-verify-jwt
   npx supabase functions deploy send-welcome-email --linked --no-verify-jwt
   ```

3. **Test Functions**:
   ```bash
   # Test lead intake
   curl -X POST https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/lead-intake \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","city":"Mumbai","org_type":"Clinic","lang":"en"}'
   ```

### Part 4: Set Up Brevo Email Service

1. **Create Brevo Account**:
   - Go to https://www.brevo.com/
   - Sign up for a free account (300 emails/day)

2. **Get API Key**:
   - Navigate to Settings → SMTP & API
   - Create a new API key
   - Copy the key (starts with `xkeysib-...`)

3. **Set Brevo Secret in Supabase**:
   ```bash
   npx supabase secrets set BREVO_API_KEY="your-brevo-api-key" --linked
   ```

4. **Create Email Template in Brevo**:
   - Go to Campaigns → Templates
   - Create a new template with ID `1` (or note the ID for later)
   - Use this HTML structure:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>{{params.name}}, Your Health Matters</h1>
     <p>{{params.content}}</p>
     <a href="{{params.cta_url}}">Take Action Now</a>
   </body>
   </html>
   ```

### Part 5: Configure n8n Workflows

1. **Set Up n8n**:
   - Sign up at https://n8n.io/ (cloud) or self-host
   - Create a new workflow space

2. **Add Credentials**:

   **Supabase PostgreSQL**:
   - Type: PostgreSQL
   - Host: `aws-1-ap-southeast-1.pooler.supabase.com`
   - Database: `postgres`
   - User: `postgres.zdgvndxdhucbakguvkgw`
   - Password: (Get from Supabase Dashboard → Settings → Database → Connection String)
   - Port: `5432`
   - SSL: Enable

   **Supabase HTTP API**:
   - Type: HTTP Request
   - Base URL: `https://zdgvndxdhucbakguvkgw.supabase.co`
   - Header: `Authorization: Bearer SERVICE_ROLE_KEY`
   - (Get SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API)

   **Brevo API**:
   - Type: Brevo (or HTTP Request)
   - API Key: (Your Brevo API key from Part 4)

3. **Import Workflows**:
   
   Import these JSON files from the `n8n-workflows/` directory:
   
   - `flow-c-campaign-send.json` - Daily campaign automation
   - `flow-f-report-generation.json` - Report generation

4. **Configure Workflow Settings**:
   
   **Flow C: Campaign Send**:
   - Update Schedule: Set to `0 9 * * *` (9:00 AM IST = 10:00 AM IST with DST adjustment)
   - Update Supabase host to your project URL
   - Update Brevo template ID if different from `1`
   
   **Flow F: Report Generation**:
   - Keep as manual trigger
   - Update date ranges as needed

5. **Activate Workflows**:
   - Click "Active" toggle for Flow C
   - Flow F remains manual

### Part 6: Frontend Deployment

1. **Build the Application**:
   ```bash
   npm install
   npm run build
   ```

2. **Deploy** (Choose one):
   
   **Option A: Cloudflare Pages**:
   ```bash
   # Install Wrangler
   npm install -g wrangler
   
   # Deploy
   wrangler pages publish dist
   ```
   
   **Option B: Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   
   **Option C: Netlify**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

### Part 7: Testing End-to-End Flow

1. **Test Lead Submission**:
   - Visit your deployed frontend
   - Fill out the signup form on the landing page
   - Submit the form
   - Check Supabase Dashboard → Table Editor → `leads` for the new entry

2. **Test Subject Generation**:
   - On the landing page, scroll to "Try It Now"
   - Select a campaign type
   - Click "Get 3 Free Subject Lines"
   - Verify 3 AI-generated subject lines appear

3. **Test Authentication**:
   - Go to `/login` page
   - Sign up with email and password
   - Check email for confirmation link
   - Confirm email and log in
   - Verify dashboard loads with real data

4. **Test Campaign Flow** (requires n8n):
   - Manually trigger "Flow C: Campaign Send" in n8n
   - Check that new assignments are created in the database
   - Verify emails are sent via Brevo
   - Click the email link
   - Check that events are recorded in the `events` table

5. **Monitor Dashboard**:
   - Log in to `/dashboard`
   - Verify these metrics update in real-time:
     - Total Leads count
     - Campaigns Sent count
     - Click Rate percentage
     - Recent Leads list
   - Check Workflow Status card shows correct status

## User Journey After Setup

Once setup is complete, here's what happens:

1. **User Discovers**: Visits landing page
2. **User Tests**: Generates sample subject lines (instant value)
3. **User Signs Up**: Submits lead form → stored in database
4. **Automation Kicks In**:
   - n8n Flow C classifies the lead into an archetype
   - Selects best email variant using bandit algorithm
   - Sends personalized email via Brevo
5. **User Engages**: Receives email, clicks link
6. **Tracking**: Click recorded in events table
7. **Analytics**: Dashboard shows updated metrics
8. **Reporting**: Admin can trigger Flow F to generate insights

## Troubleshooting

### Frontend Issues

**Problem**: Dashboard shows 0 for all metrics
- **Check**: RLS policies allow anon role to read from tables
- **Fix**: Add read policies for authenticated users in Supabase Dashboard

**Problem**: Authentication fails
- **Check**: `.env` has correct Supabase credentials
- **Fix**: Restart dev server after updating `.env`

### n8n Issues

**Problem**: Workflows fail to connect to Supabase
- **Check**: PostgreSQL credentials are correct
- **Fix**: Use connection pooler URL, not direct database URL

**Problem**: Emails not sending
- **Check**: Brevo API key is valid
- **Fix**: Verify API key in Brevo dashboard, regenerate if needed

### Database Issues

**Problem**: Tables don't exist
- **Check**: Migrations were applied
- **Fix**: Run `npx supabase db push` again

**Problem**: No personas in table
- **Check**: Seed data was inserted
- **Fix**: Manually run INSERT statements from migration files

## Next Steps

After completing the setup:

1. **Create Test Campaign**: Submit 5-10 test leads
2. **Monitor Results**: Watch dashboard for updates
3. **Analyze Performance**: Trigger report generation after 1 week
4. **Iterate**: Use insights to improve subject lines and targeting
5. **Scale Up**: Increase lead acquisition and campaign frequency

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **n8n Docs**: https://docs.n8n.io/
- **Brevo API**: https://developers.brevo.com/
- **Project README**: See `README.md` for development setup

## Summary

You now have:
- ✅ Working frontend with authentication
- ✅ Connected Supabase backend
- ✅ Deployed Edge Functions
- ✅ Configured n8n workflows (2 flows)
- ✅ Email sending via Brevo
- ✅ Real-time analytics dashboard
- ✅ End-to-end campaign automation

Users can log in, view their dashboard with live metrics, and the system will automatically process leads and send personalized campaigns!
