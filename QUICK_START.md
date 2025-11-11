# PreventIQ Quick Start Guide

Welcome to PreventIQ! This guide helps you get started quickly.

## For End Users (Healthcare Providers)

### Step 1: Sign Up
1. Visit the PreventIQ landing page
2. Scroll to the "Start Free Pilot" section
3. Fill in your details:
   - Your name
   - Email address
   - City
   - Organization type (Clinic, Hospital, etc.)
   - Preferred language
4. Click "Start Free Pilot"
5. You'll be redirected to a thank you page

### Step 2: Check Your Email
- Look for a welcome email from PreventIQ
- If you don't see it, check your spam folder

### Step 3: Create Your Account (Optional)
1. Go to the `/login` page
2. Click "Create one" to sign up
3. Enter your email and create a password
4. Check your email for a confirmation link
5. Click the confirmation link to verify your account

### Step 4: Access Your Dashboard
1. Log in at `/login`
2. View your campaign analytics:
   - Total leads collected
   - Campaigns sent
   - Click rates
   - Recent activity

### Step 5: Test the System
1. From the landing page, use the "Try It Now" widget
2. Select a campaign type (e.g., "Heart Health Checkup")
3. Click "Get 3 Free Subject Lines"
4. See AI-generated email subjects instantly!

---

## For Developers & Admins

### Prerequisites Checklist
- [ ] Supabase account and project created
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] n8n account (cloud or self-hosted)
- [ ] Brevo account for email sending

### Quick Setup (5 Minutes)

#### 1. Clone and Install
```bash
git clone <repository-url>
cd preventiq-genai-engine
npm install
```

#### 2. Configure Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
# - VITE_SUPABASE_PROJECT_ID
# - GEMINI_API_KEY
```

#### 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5173`

#### 4. Build for Production
```bash
npm run build
```

### Database Setup (10 Minutes)

#### 1. Link to Supabase
```bash
npx supabase link --project-ref <your-project-id>
```

#### 2. Apply Migrations
```bash
npx supabase db push
```

#### 3. Verify Tables
Go to Supabase Dashboard → Table Editor and confirm:
- ✅ leads
- ✅ personas (6 rows)
- ✅ variants
- ✅ assignments
- ✅ events
- ✅ variant_stats
- ✅ sync_state
- ✅ error_log

### Edge Functions Setup (15 Minutes)

#### 1. Set Secrets
```bash
npx supabase secrets set GEMINI_API_KEY="your-key" --linked
npx supabase secrets set BREVO_API_KEY="your-key" --linked
```

#### 2. Deploy Functions
```bash
# Deploy all at once
npx supabase functions deploy --linked --no-verify-jwt

# Or deploy individually
npx supabase functions deploy lead-intake --linked --no-verify-jwt
npx supabase functions deploy generate-subjects --linked --no-verify-jwt
npx supabase functions deploy classify-persona --linked --no-verify-jwt
npx supabase functions deploy track-click --linked --no-verify-jwt
npx supabase functions deploy campaign-send --linked --no-verify-jwt
npx supabase functions deploy sync-events --linked --no-verify-jwt
npx supabase functions deploy generate-report --linked --no-verify-jwt
```

#### 3. Test Functions
```bash
# Test lead intake
curl -X POST https://<project-ref>.supabase.co/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","city":"Mumbai","org_type":"Clinic","lang":"en"}'
```

### n8n Workflows Setup (20 Minutes)

#### 1. Create n8n Account
- Cloud: https://n8n.io/
- Self-hosted: https://docs.n8n.io/hosting/

#### 2. Add Credentials

**PostgreSQL (Supabase)**:
```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Database: postgres
User: postgres.<project-id>
Password: <from Supabase dashboard>
Port: 5432
SSL: Enabled
```

**HTTP Request (Supabase API)**:
```
Base URL: https://<project-id>.supabase.co
Authorization: Bearer <service-role-key>
```

**Brevo**:
```
API Key: <from Brevo dashboard>
```

#### 3. Import Workflows
1. Open n8n
2. Click "Add workflow"
3. Click "..." → "Import from file"
4. Select `n8n-workflows/flow-c-campaign-send.json`
5. Repeat for `flow-f-report-generation.json`

#### 4. Activate Flow C
- Open "Flow C: Daily Campaign Send"
- Click "Active" toggle
- Verify schedule is set to 9:00 AM IST

---

## Testing Your Setup

### Test 1: Lead Submission ✅
1. Visit landing page
2. Fill signup form
3. Submit
4. Check Supabase → leads table
5. Verify new row exists

### Test 2: Subject Generation ✅
1. Scroll to "Try It Now" widget
2. Select campaign type
3. Click "Get 3 Free Subject Lines"
4. Verify 3 subjects appear

### Test 3: Authentication ✅
1. Go to `/login`
2. Sign up with email/password
3. Check email for confirmation
4. Confirm and log in
5. Verify dashboard loads

### Test 4: Dashboard Metrics ✅
1. Log in to dashboard
2. Verify metrics show:
   - Total Leads > 0
   - Recent Leads list populated
3. Submit another lead from landing page
4. Watch dashboard update in real-time

### Test 5: Campaign Flow (Requires n8n) ✅
1. Manually trigger "Flow C: Campaign Send"
2. Check assignments table for new rows
3. Check email inbox for campaign
4. Click email link
5. Verify events table has click event
6. Check dashboard metrics updated

---

## Common Issues & Solutions

### Issue: Build Fails
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Dashboard Shows 0 Metrics
**Solution**:
- Check RLS policies allow authenticated users to read
- Verify Supabase credentials in `.env`
- Check browser console for errors

### Issue: Edge Functions Not Found
**Solution**:
```bash
# Verify deployment
npx supabase functions list --linked

# Redeploy if needed
npx supabase functions deploy <function-name> --linked
```

### Issue: n8n Can't Connect to Supabase
**Solution**:
- Use connection pooler URL (not direct)
- Verify credentials are correct
- Test connection in n8n credential settings

### Issue: Emails Not Sending
**Solution**:
- Verify Brevo API key is valid
- Check Brevo dashboard for errors
- Verify template ID is correct
- Check n8n execution logs

---

## Getting Help

### Documentation
- **Setup Guide**: `COMPLETE_SETUP_GUIDE.md`
- **API Reference**: `API_REFERENCE.md`
- **Dashboard Overview**: `DASHBOARD_OVERVIEW.md`
- **n8n Workflows**: `n8n-workflows/README.md`

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **n8n Docs**: https://docs.n8n.io
- **Brevo API**: https://developers.brevo.com
- **Gemini API**: https://ai.google.dev/docs

### Support Channels
- GitHub Issues: Report bugs and request features
- Email: Contact project maintainer
- Documentation: Check all MD files in repository

---

## Success Criteria

You've successfully set up PreventIQ when:

✅ Frontend loads without errors  
✅ Users can sign up via landing page  
✅ Subject generation widget works  
✅ Authentication flow completes  
✅ Dashboard shows real-time metrics  
✅ n8n workflows are active  
✅ Emails send via Brevo  
✅ Clicks are tracked  
✅ Reports can be generated  

---

## Next Steps

1. **Add Test Data**: Submit 5-10 test leads
2. **Run Campaign**: Trigger Flow C manually
3. **Track Results**: Monitor dashboard for updates
4. **Generate Report**: Trigger Flow F after 1 week
5. **Analyze Insights**: Review AI-generated recommendations
6. **Iterate**: Improve subject lines and targeting
7. **Scale**: Increase lead acquisition efforts

---

## Production Deployment

### Frontend Deployment Options

**Cloudflare Pages**:
```bash
npm run build
wrangler pages publish dist
```

**Vercel**:
```bash
npm run build
vercel --prod
```

**Netlify**:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Post-Deployment Checklist
- [ ] Update CORS settings in Supabase
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable monitoring
- [ ] Configure analytics
- [ ] Set up error tracking
- [ ] Schedule database backups
- [ ] Document production URLs

---

Congratulations! You're now ready to use PreventIQ for AI-powered preventive healthcare marketing! 🎉
