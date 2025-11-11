# Dashboard Features Guide

## Overview

The enhanced PreventIQ Dashboard now provides **real value** to users upon login with three main sections:

### 1. Overview Tab
- **Real-time Analytics**: Live KPIs with WebSocket updates
  - Total Leads
  - Campaigns Sent  
  - Click Rate (%)
  - Total Clicks
- **Workflow Status**: Monitor n8n automation health
- **Recent Leads**: Live-updating list of new signups
- **Quick Actions**: Direct buttons to manage personas and import customers

### 2. Personas Tab ⭐ NEW
Users can now **see and customize the 6 customer archetypes** that power personalized marketing:

**Features:**
- View all 6 personas (ARCH_PRO, ARCH_TP, ARCH_SEN, ARCH_STU, ARCH_RISK, ARCH_PRICE)
- See lead count for each persona
- Edit persona details:
  - Label (e.g., "Proactive Professional")
  - Description (e.g., "25-40, tech-savvy, seeks optimization")
  - Tone defaults (e.g., "professional, friendly, caring")
- Real-time updates when personas change

**Personas Available:**
1. **Proactive Professional (ARCH_PRO)** - 25-40, tech-savvy, metro cities
2. **Time-poor Parent (ARCH_TP)** - 35-50, family-focused, hereditary concerns
3. **Skeptical Senior (ARCH_SEN)** - 55+, trusts doctors, wary of ads
4. **Student/Young Adult (ARCH_STU)** - 18-25, budget-conscious
5. **At-risk but Avoidant (ARCH_RISK)** - 40+, procrastinates on health
6. **Price-sensitive Seeker (ARCH_PRICE)** - Any age, discount-motivated

### 3. Customers Tab ⭐ NEW
Users can now **import and manage their customer database**:

**Import Options:**
- **Manual Entry**: Add customers one-by-one with form
  - Name, Email, City, Organization Type, Language
  - Instant validation and error handling
- **CSV Bulk Import**: Upload entire customer lists
  - Validates CSV format
  - Shows example format
  - Handles duplicates gracefully
  
**Customer List:**
- View all imported customers
- See which persona each customer is assigned to
- Real-time updates as new customers are added
- Filter and search capabilities

## User Value Proposition

### Before (Old Dashboard):
❌ Just stats and setup instructions  
❌ No actionable features  
❌ No way to manage data  
❌ No persona visibility  

### After (Enhanced Dashboard):
✅ **Manage Personas**: Customize the 6 archetypes for your business  
✅ **Import Customers**: Add your audience via form or CSV  
✅ **See Assignments**: View which customers match which personas  
✅ **Take Action**: Clear next steps and workflows  
✅ **Real-time Updates**: Live data via WebSocket subscriptions  

## Technical Implementation

**New Components:**
- `PersonaCard.tsx` - Displays persona with edit capability
- `PersonaEditor.tsx` - Modal to edit persona details
- `CustomerImport.tsx` - Dual interface for manual/CSV import
- `CustomerList.tsx` - Real-time customer database view
- `usePersonas.ts` - Hook for fetching and subscribing to personas

**Database Integration:**
- Connects to existing `personas` table
- Writes to existing `leads` table
- Reads from `assignments` table to show persona mappings
- Uses Supabase Realtime for live updates

**User Flow:**
1. User logs in → sees Overview tab with stats
2. User clicks "Manage Personas" → sees all 6 personas with descriptions
3. User clicks edit on a persona → customizes tone and description
4. User switches to Customers tab → imports CSV or adds manually
5. Customer data flows to leads table → n8n picks up and processes
6. Customer gets classified → assignment created → shown in customer list

## Screenshots

### Dashboard - Overview Tab
- Stats cards showing live metrics
- Workflow status indicator
- Recent leads list
- Quick action buttons

### Dashboard - Personas Tab
- Grid of 6 persona cards
- Edit buttons on each card
- Lead count per persona
- Modal editor for customization

### Dashboard - Customers Tab
- Tabbed import interface (Manual / CSV)
- Customer list with persona badges
- Real-time updates
- Search and filter

## Next Steps for Users

1. **Customize Personas**: Edit descriptions to match your target audience
2. **Import Customers**: Upload your customer list via CSV
3. **Review Assignments**: See which customers match which personas
4. **Monitor Campaigns**: Watch the Overview tab for engagement metrics
5. **Iterate**: Adjust persona tones based on performance data

---

**The dashboard now provides immediate, actionable value upon login!**
