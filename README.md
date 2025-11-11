# PreventIQ GenAI Marketing Engine

**AI-Powered Preventive Healthcare Marketing Automation**

PreventIQ helps clinics, diagnostic centers, and wellness programs acquire leads, personalize messaging at scale, and prove ROI without manual effort.

---

## 🚀 Quick Start

### For Users
1. Visit the landing page
2. Try the AI subject line generator (no signup required)
3. Sign up for a free pilot campaign
4. Log in to view your dashboard with real-time analytics

### For Developers
```bash
# Clone and install
git clone <repo-url>
cd preventiq-genai-engine
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

**See [QUICK_START.md](./QUICK_START.md) for detailed instructions.**

---

## ✨ Features

### Landing Page
- **Instant Value Widget**: Generate AI-powered email subject lines
- **Lead Capture**: Intelligent form with validation
- **Responsive Design**: Mobile-first approach

### Dashboard
- **Real-Time Analytics**: Live KPIs updated via WebSockets
  - Total Leads
  - Campaigns Sent
  - Click Rate
  - Total Clicks
- **Workflow Status**: Monitor n8n automation status
- **Recent Leads**: Live-updating list of signups
- **Setup Guide**: Embedded deployment instructions

### Backend Automation
- **AI Classification**: Automatic lead archetype classification (6 personas)
- **Smart Variants**: Thompson Sampling bandit algorithm for A/B testing
- **Email Campaigns**: Automated personalized email delivery
- **Event Tracking**: Click and engagement tracking
- **Report Generation**: AI-powered campaign insights

---

## 🏗️ Architecture

```
React Frontend → Supabase Backend → n8n Workflows → External APIs
                    ↓                      ↓              ↓
              PostgreSQL DB          Automation      Gemini AI
              Edge Functions         Orchestration   Brevo Email
              Realtime Updates
```

**Tech Stack**:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Realtime)
- **Automation**: n8n workflows
- **AI**: Google Gemini 2.5 Flash
- **Email**: Brevo (formerly Sendinblue)

---

## 📚 Documentation

**Start Here**:
- [QUICK_START.md](./QUICK_START.md) - Get up and running in 5 minutes
- [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) - Full deployment guide

**Reference**:
- [API_REFERENCE.md](./API_REFERENCE.md) - All endpoints and queries
- [DASHBOARD_OVERVIEW.md](./DASHBOARD_OVERVIEW.md) - UI component guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Project status

**Technical**:
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Architecture details
- [n8n-workflows/README.md](./n8n-workflows/README.md) - Workflow documentation
- [PRD_STATUS.md](./PRD_STATUS.md) - Feature completion tracking

---

## 🎯 User Journey

1. **Discover**: User visits landing page
2. **Test**: Generates sample AI subject lines (instant value)
3. **Sign Up**: Submits lead form → stored in database
4. **Automation**: n8n classifies and sends personalized email
5. **Engage**: User clicks email link → tracked
6. **Analytics**: User logs in to view campaign performance
7. **Insights**: Admin generates AI-powered report

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Supabase account
- n8n instance (cloud or self-hosted)
- Brevo account (for email)
- Google Gemini API key

### Installation
```bash
npm install
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-api-key
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📦 Deployment

### Frontend
Deploy to Cloudflare Pages, Vercel, or Netlify:
```bash
npm run build
# Then deploy the dist/ folder
```

### Backend
Deploy Supabase Edge Functions and migrations:
```bash
npx supabase link --project-ref your-project-id
npx supabase db push
npx supabase functions deploy --linked --no-verify-jwt
```

### Workflows
Import n8n workflow JSON files from `n8n-workflows/` directory.

**See [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) for step-by-step instructions.**

---

## 🧪 Testing

### Frontend
```bash
# Manual testing
npm run dev
# Visit http://localhost:5173
```

### Edge Functions
```bash
# Test lead intake
curl -X POST https://your-project.supabase.co/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","city":"Mumbai","org_type":"Clinic","lang":"en"}'
```

### End-to-End
1. Submit lead via landing page
2. Check database for new row
3. Trigger n8n campaign flow
4. Verify email received
5. Click email link
6. Check dashboard updates

---

## 📊 Features Status

✅ **Complete**:
- Landing page with AI widget
- User authentication
- Real-time dashboard
- Database schema
- Edge Functions
- n8n workflow definitions
- Comprehensive documentation

⏳ **Requires Setup** (follow setup guide):
- Supabase deployment
- n8n workflow import
- Brevo email configuration
- Production deployment

---

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Support

- **Documentation**: See markdown files in repository root
- **Issues**: Create a GitHub issue
- **Email**: Contact project maintainer

---

## 🎉 Acknowledgments

Built with:
- [Supabase](https://supabase.com)
- [n8n](https://n8n.io)
- [Google Gemini](https://ai.google.dev)
- [Brevo](https://www.brevo.com)
- [shadcn/ui](https://ui.shadcn.com)

---

**Made with ❤️ for preventive healthcare**
