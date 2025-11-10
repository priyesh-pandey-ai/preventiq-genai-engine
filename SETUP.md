# PreventIQ — GenAI-Powered Preventive Healthcare Marketing

**Version:** 7.0 (Supabase Build)  
**Status:** MVP Ready for Testing  
**Last Updated:** November 11, 2025

## 🎯 Project Mission

PreventIQ is a GenAI-powered marketing automation platform designed for preventive healthcare campaigns. It helps clinics, diagnostic centers, and wellness programs acquire leads, personalize messaging at scale, and prove ROI without manual effort.

## 🏗️ Architecture Overview

This MVP uses a **serverless-first architecture** centered on:
- **Frontend:** React + TypeScript + Vite + Tailwind CSS (deployed on Cloudflare Pages/Lovable)
- **Backend:** Supabase (Postgres + Edge Functions)
- **AI:** Lovable AI Gateway (Gemini 2.5 Flash)
- **Email:** Brevo (via n8n workflows)
- **Automation:** n8n Cloud (workflow orchestration)

```
Frontend (React) → Supabase Edge Functions → Database (Postgres)
                ↓
          Gemini AI (via Lovable Gateway)
                ↓
          n8n Workflows → Brevo (Email) → Events → Database
```

## 📋 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** TanStack Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Notifications:** Sonner (toast notifications)

### Backend
- **Database:** Supabase Postgres
- **Auth & Storage:** Supabase
- **Edge Functions:** Supabase Edge Functions (Deno runtime)
- **API:** RESTful via Supabase client

### AI & Automation
- **LLM:** Gemini 2.5 Flash (via Lovable AI Gateway)
- **Workflows:** n8n Cloud
- **Email Service:** Brevo

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/bun
- Supabase account
- Lovable AI API key
- n8n Cloud account (optional for full automation)

### 1. Clone and Install

```bash
git clone <YOUR_GIT_URL>
cd preventiq-genai-engine
npm install
# or
bun install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID="zdgvndxdhucbakguvkgw"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://zdgvndxdhucbakguvkgw.supabase.co"
```

### 3. Supabase Setup

#### A. Database Schema

Run the migrations in your Supabase SQL Editor:

```bash
# Migrations are in supabase/migrations/
# Run them in order:
# 1. 20251110201513_*.sql (leads table)
# 2. 20251110201935_*.sql (personas, variants, assignments, events, etc.)
# 3. 20251110202112_*.sql (if exists)
```

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref zdgvndxdhucbakguvkgw

# Push migrations
supabase db push
```

#### B. Edge Functions Setup

Set up required secrets for Edge Functions:

```bash
# Set Lovable AI API Key
supabase secrets set LOVABLE_API_KEY=your-lovable-api-key

# Set Resend API Key (optional, for welcome emails)
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

Deploy Edge Functions:

```bash
# Deploy lead-intake function
supabase functions deploy lead-intake

# Deploy generate-subjects function
supabase functions deploy generate-subjects

# Deploy other functions as needed
supabase functions deploy classify-persona
supabase functions deploy track-click
```

### 4. Run Development Server

```bash
npm run dev
# or
bun dev
```

Visit `http://localhost:5173` to see the app.

## 🧪 Testing the MVP

### Test 1: Instant Value Widget
1. Visit the homepage
2. Scroll to "See the Power of AI Marketing" section
3. Select a campaign type (e.g., "Diabetes Screening")
4. Click "Get 3 Free Subject Lines"
5. ✅ **Expected:** 3 AI-generated subject lines appear within 2-3 seconds

### Test 2: Lead Submission
1. Scroll to "Start a Free Pilot" section
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Organization: Clinic
   - Language: English
   - City: Mumbai
3. Click "Start Free Pilot"
4. ✅ **Expected:** Success toast + redirect to `/thanks` page
5. ✅ **Verify:** Check Supabase database → `leads` table → new row exists

### Test 3: Database Verification

```sql
-- Check if lead was created
SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;

-- Check personas are seeded
SELECT * FROM personas WHERE is_archetype = true;

-- Check sync state
SELECT * FROM sync_state;
```

## 📁 Project Structure

```
preventiq-genai-engine/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Navigation.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSolution.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── InstantValueWidget.tsx
│   │   ├── DemoSection.tsx
│   │   ├── Testimonials.tsx
│   │   ├── SignupSection.tsx
│   │   ├── SocialProof.tsx
│   │   ├── PrivacySection.tsx
│   │   └── Footer.tsx
│   ├── pages/              # Route pages
│   │   ├── Index.tsx
│   │   ├── Thanks.tsx
│   │   └── NotFound.tsx
│   ├── integrations/
│   │   └── supabase/       # Supabase client & types
│   │       ├── client.ts
│   │       └── types.ts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   └── App.tsx
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── lead-intake/
│   │   ├── generate-subjects/
│   │   ├── classify-persona/
│   │   ├── track-click/
│   │   └── send-welcome-email/
│   └── migrations/         # Database migrations
├── public/
├── .env
├── package.json
└── README.md
```

## 🔌 API Endpoints (Edge Functions)

### 1. Lead Intake
**Endpoint:** `POST /functions/v1/lead-intake`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "city": "Mumbai",
  "org_type": "Clinic",
  "lang": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead registered successfully",
  "lead_id": 123
}
```

### 2. Generate Subjects
**Endpoint:** `POST /functions/v1/generate-subjects`

**Request:**
```json
{
  "category": "Diabetes Screening",
  "lang": "en"
}
```

**Response:**
```json
{
  "subjects": [
    "Is your blood sugar trying to tell you something?",
    "3 silent diabetes signs you shouldn't ignore",
    "Free diabetes screening this week only"
  ]
}
```

## 📊 Database Schema

### Core Tables

1. **leads** - Landing page submissions
2. **personas** - 6 archetypes (ARCH_PRO, ARCH_TP, ARCH_SEN, etc.)
3. **variants** - AI-generated creative content
4. **assignments** - Maps leads to campaigns
5. **events** - Tracks engagement (opens, clicks)
6. **variant_stats** - Bandit algorithm statistics
7. **sync_state** - Stateful cursors for cron jobs
8. **error_log** - Error tracking

See `supabase/migrations/` for complete schema.

## 🤖 n8n Workflows (Optional)

For full automation, set up these workflows in n8n Cloud:

### Flow A: Lead Intake (Webhook)
- **Trigger:** Webhook at `/webhook/lead-intake`
- **Action:** Insert into Supabase `leads` table

### Flow B: Click Redirect (Webhook)
- **Trigger:** GET `/c/:assignment_id`
- **Action:** Log event, redirect to `/thanks`

### Flow C: Daily Send (Cron)
- **Schedule:** Daily 10:00 AM IST
- **Actions:** Classify leads → Generate variants → Send via Brevo

### Flow D: Event Sync (Cron)
- **Schedule:** Every 10 minutes
- **Actions:** Fetch Brevo events → Update database

### Flow E: Weekly Report (Manual)
- **Trigger:** Manual
- **Actions:** Generate PDF report with insights

## 🚢 Deployment

### Frontend (Lovable/Cloudflare Pages)

Via Lovable:
1. Visit [Lovable Project](https://lovable.dev/projects/3eb065f9-8331-4f68-9839-0fe20194b8ba)
2. Click **Share → Publish**
3. Add environment variables in Project Settings

Via Cloudflare Pages:
1. Connect GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables

### Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy lead-intake
supabase functions deploy generate-subjects
supabase functions deploy classify-persona
supabase functions deploy track-click
```

## 🔧 Environment Variables

### Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

### Edge Function Secrets
- `LOVABLE_API_KEY` - For Gemini AI via Lovable Gateway
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase
- `RESEND_API_KEY` - Optional, for welcome emails

## 📖 Key Features

✅ **Instant Value Widget** - Generate 3 AI subject lines without signup  
✅ **Lead Capture** - Form submission with Supabase integration  
✅ **Persona Engine** - 6 predefined archetypes  
✅ **AI Content Generation** - Gemini-powered subject lines & copy  
✅ **Event Tracking** - Click/open tracking infrastructure  
✅ **Privacy-First** - HIPAA-compliant, no medical data collection  
✅ **Responsive Design** - Mobile-first, accessible UI  

## 🐛 Troubleshooting

### Edge Function not responding
```bash
# Check function logs
supabase functions logs lead-intake

# Test function locally
supabase functions serve lead-intake
```

### Database connection issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Check Supabase project status at supabase.com
- Ensure RLS policies allow service role access

### AI generation fails
- Verify `LOVABLE_API_KEY` is set in Supabase secrets
- Check API quota/credits in Lovable dashboard
- Review function logs for rate limiting errors

## 📚 Documentation

- [PRD Document](./docs/PRD.md) - Complete product requirements
- [Supabase Docs](https://supabase.com/docs)
- [n8n Docs](https://docs.n8n.io)
- [Lovable Docs](https://docs.lovable.dev)

## 🤝 Contributing

This is an MVP project. For contributions:
1. Create a feature branch
2. Test thoroughly
3. Submit PR with description

## 📄 License

Proprietary - PreventIQ

## 🎉 MVP Success Criteria

- [x] Landing page with instant value widget
- [x] Lead submission to Supabase
- [x] AI-powered subject line generation
- [x] Database schema with all tables
- [x] Edge Functions deployed
- [ ] n8n workflows configured
- [ ] Email sending via Brevo
- [ ] Click tracking working
- [ ] PDF report generation

---

**Project Owner:** priyesh-pandey-ai  
**Repository:** preventiq-genai-engine  
**Current Branch:** main
