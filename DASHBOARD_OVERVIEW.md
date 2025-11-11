# PreventIQ Dashboard - Visual Overview

## What We've Built

This document provides a visual overview of the integrated PreventIQ system.

## Landing Page Features

### 1. Instant Value Widget
- **Location**: Middle section of landing page
- **Function**: AI-powered subject line generator
- **User Flow**:
  1. User selects campaign type (e.g., "Diabetes Screening")
  2. Clicks "Get 3 Free Subject Lines"
  3. AI generates 3 personalized email subjects instantly
- **Technology**: Calls `generate-subjects` Edge Function with Gemini AI

### 2. Lead Signup Form
- **Location**: Bottom of landing page
- **Fields**:
  - Name
  - Email
  - City
  - Organization Type (Clinic, Hospital, etc.)
  - Preferred Language (English/Hindi)
- **Function**: Captures leads and stores in Supabase
- **User Flow**:
  1. User fills form
  2. Submits → Edge Function validates and stores
  3. Redirects to `/thanks` page
  4. User receives welcome email

## Authentication System

### Login/Signup Page (`/login`)
- **Features**:
  - Email/password authentication
  - Toggle between signup and login
  - Supabase Auth integration
  - Email confirmation flow
- **Security**:
  - Secure password storage
  - JWT-based sessions
  - Auto-refresh tokens

## Dashboard (`/dashboard`)

### Header
- **Left**: "PreventIQ Dashboard" title
- **Right**: Logout button
- **User Info**: Displays logged-in user's email

### KPI Cards (Top Row - 4 Cards)

#### 1. Campaigns Sent
- **Icon**: Mail (blue)
- **Data**: Total assignments count from database
- **Updates**: Real-time when campaigns are sent

#### 2. Total Leads
- **Icon**: Users (orange)
- **Data**: Count of all leads in database
- **Updates**: Real-time when new leads signup

#### 3. Click Rate
- **Icon**: Trending Up (green)
- **Data**: (Total Clicks / Total Campaigns) × 100%
- **Updates**: Real-time when clicks are tracked

#### 4. Total Clicks
- **Icon**: Bar Chart (purple)
- **Data**: Count of click events
- **Updates**: Real-time when users click email links

### Workflow Status Card (Bottom Left)

**n8n Workflows Display**:

1. **Daily Campaign Send**
   - Status: Active (green checkmark)
   - Schedule: "10:00 AM IST Daily"
   - Description: "Sends personalized emails to new leads daily"

2. **Event Sync**
   - Status: Active (green checkmark)
   - Schedule: "Every 10 minutes"
   - Description: "Syncs email opens and clicks from Brevo"

3. **Report Generation**
   - Status: Pending Setup (yellow clock)
   - Schedule: "Manual Trigger"
   - Description: "Generates PDF reports with campaign insights"

**Note Section**:
- Link to n8n workflows documentation
- Setup instructions reference

### Recent Leads Card (Bottom Right)

**Displays Latest 5 Leads**:
- Each lead shows:
  - Name (bold)
  - Email
  - City • Organization Type
  - Timestamp (e.g., "Nov 11, 21:30")
- **Empty State**: Shows icon and "No leads yet" message
- **Real-time Updates**: New leads appear instantly via Postgres subscriptions

### Setup Instructions Card (Bottom)

**Three-Step Guide**:

1. **Configure n8n Workflows**
   - Import JSON files from `n8n-workflows/` directory
   - Enable automated campaigns and tracking

2. **Set Up Brevo Integration**
   - Connect Brevo account in n8n
   - Configure email sending

3. **Test the Flow**
   - Submit test lead
   - Verify email delivery
   - Track clicks

**Action Buttons**:
- "Back to Home"
- "n8n Documentation" (opens n8n docs)

## Real-Time Features

### WebSocket Subscriptions

The dashboard uses Supabase real-time subscriptions:

```typescript
// Leads subscription
supabase
  .channel('leads-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' })
  .subscribe()

// Assignments subscription
supabase
  .channel('assignments-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' })
  .subscribe()

// Events subscription
supabase
  .channel('events-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' })
  .subscribe()
```

**What This Means**:
- When a lead signs up → Total Leads updates immediately
- When n8n sends campaign → Campaigns Sent updates immediately
- When user clicks email → Click Rate and Total Clicks update immediately
- Recent Leads list refreshes when new signups occur

## Data Flow Diagram

```
┌─────────────────┐
│  Landing Page   │
│  - Widget       │
│  - Signup Form  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Supabase Functions │
│  - lead-intake      │
│  - generate-subjects│
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
│   - leads       │
│   - personas    │
│   - variants    │
│   - assignments │
│   - events      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  n8n Workflows  │
│  - Flow C: Send │
│  - Flow D: Sync │
│  - Flow F: Report│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Brevo Email    │
│  Service        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  End User Gets  │
│  Email & Clicks │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  Updates Live   │
└─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query

### Backend
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Serverless Functions**: Supabase Edge Functions (Deno)
- **Real-time**: Supabase Realtime (WebSockets)
- **Storage**: Supabase Storage (for reports)

### Automation
- **Workflow Engine**: n8n
- **Email Service**: Brevo (formerly Sendinblue)
- **AI**: Google Gemini 2.5 Flash

### Deployment
- **Frontend**: Cloudflare Pages / Vercel / Netlify
- **Backend**: Supabase Cloud
- **Workflows**: n8n Cloud / Self-hosted

## Color Scheme

- **Primary**: Blue (#0066FF) - Primary actions, headers
- **Accent**: Orange (#FF6B35) - Secondary actions
- **Success**: Green (#10B981) - Active status, positive metrics
- **Warning**: Yellow (#F59E0B) - Pending status
- **Error**: Red (#EF4444) - Error status
- **Background**: Light gray gradient
- **Card**: White with subtle border

## Responsive Design

- **Mobile** (< 640px): Single column layout, stacked cards
- **Tablet** (640px - 1024px): 2-column grid for KPIs
- **Desktop** (> 1024px): 4-column KPIs, 2-column bottom section

## Accessibility

- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Full support
- **Screen Reader**: Semantic HTML structure
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states

## Performance

- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Components load on demand
- **Optimistic Updates**: UI updates before server confirmation
- **Caching**: React Query for API responses
- **Real-time Throttling**: Prevents excessive re-renders

## Security

- **Authentication**: JWT-based, auto-refresh
- **RLS Policies**: Row-level security on all tables
- **CORS**: Configured for production domain
- **API Keys**: Stored in Supabase secrets
- **SQL Injection**: Prevented via Supabase client
- **XSS**: React's built-in protection

## Next Steps for Production

1. **Enable JWT Verification**: Secure Edge Functions
2. **Add Rate Limiting**: Prevent API abuse
3. **Setup Error Monitoring**: Sentry integration
4. **Add Analytics**: Google Analytics 4
5. **Performance Monitoring**: Web Vitals tracking
6. **CDN Configuration**: For static assets
7. **SSL Certificate**: HTTPS enforcement
8. **Backup Strategy**: Database backups
9. **Monitoring Alerts**: Uptime monitoring
10. **Documentation**: API docs with OpenAPI

## Support Documentation

- **COMPLETE_SETUP_GUIDE.md**: Full deployment walkthrough
- **API_REFERENCE.md**: All endpoints and queries
- **n8n-workflows/README.md**: Workflow setup
- **IMPLEMENTATION_GUIDE.md**: Architecture details
- **PRD_STATUS.md**: Project status tracking
