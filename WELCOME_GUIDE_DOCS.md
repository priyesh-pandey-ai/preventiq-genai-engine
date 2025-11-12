# WelcomeGuide Component - Visual Documentation

## Overview

The WelcomeGuide component is displayed on the Dashboard when a user has no campaign data (totalLeads = 0 and totalCampaigns = 0). It provides a friendly onboarding experience to help users get started with PreventIQ.

## Component Structure

### Header Section
- **Icon**: Rocket icon in a gradient circle
- **Title**: "Welcome to PreventIQ!"
- **Subtitle**: "Let's get you started with your first campaign"

### Error Alert (Conditional)
If there's an error fetching dashboard data, a red alert box appears with:
- **Warning Icon**: AlertCircle icon
- **Error Title**: "Connection Error"
- **Error Message**: The specific error from the API
- **Help Text**: Link to debugging guide

### Getting Started Steps

#### Step 1: Set Up Your Customer Personas
- **Icon**: Users icon with number "1" badge
- **Description**: Instructions about the 6 core customer archetypes
- **Action Button**: "View Personas" - navigates to Personas tab
- **Visual**: Primary color accent

#### Step 2: Import Your Customers
- **Icon**: Mail icon with number "2" badge
- **Description**: Instructions for CSV import or manual entry
- **Action Button**: "Import Customers" - navigates to Customers tab
- **Visual**: Accent color

#### Step 3: Watch Your Campaigns Take Off
- **Icon**: BarChart3 icon with number "3" badge
- **Description**: Explains automated workflow behavior
- **Visual**: Healthcare green accent
- **Note**: No action button - this is informational

### Quick Tips Section
- **Icon**: CheckCircle2 icon
- **Background**: Light primary color background
- **Content**: Bulleted list of helpful tips:
  - Start with small batch for testing
  - Review and customize AI personas
  - Check workflow status
  - Monitor Recent Leads section

## Display Logic

The WelcomeGuide appears when:
```typescript
!dashboardStats.loading && 
dashboardStats.totalLeads === 0 && 
dashboardStats.totalCampaigns === 0
```

Once the user has:
- Imported at least one customer, OR
- Created at least one campaign

The WelcomeGuide automatically hides and the standard dashboard analytics appear.

## User Flow

1. **User logs in for the first time**
   → Dashboard shows WelcomeGuide instead of empty stats

2. **User clicks "View Personas"**
   → Navigates to Personas tab
   → User can review/customize the 6 default personas

3. **User clicks "Import Customers"**
   → Navigates to Customers tab
   → User uploads CSV or adds customers manually

4. **Customers are imported**
   → Dashboard automatically refreshes
   → WelcomeGuide disappears
   → Standard analytics appear with real data

## Error Handling

### Scenario 1: Database Connection Error
- WelcomeGuide displays with error alert
- Error message: "Failed to fetch leads: [specific error]"
- User can click link to DEBUGGING_GUIDE.md

### Scenario 2: Real-time Subscription Error
- WelcomeGuide may still display
- Console logs subscription error
- Stats show: "Real-time updates unavailable. Data may not be current."

### Scenario 3: Partial Data Load
- If leads exist but campaigns don't (or vice versa)
- WelcomeGuide still displays until BOTH have data
- This ensures complete onboarding

## Accessibility

- Semantic HTML structure
- ARIA-friendly icon usage
- Keyboard navigable buttons
- Clear visual hierarchy
- Color contrast meets WCAG 2.1 AA standards

## Responsive Design

- **Mobile**: Single column layout, stacked steps
- **Tablet**: Optimized spacing, readable at all sizes
- **Desktop**: Full width with centered max-width container

## Integration Points

### Dashboard.tsx
```typescript
{!dashboardStats.loading && 
 dashboardStats.totalLeads === 0 && 
 dashboardStats.totalCampaigns === 0 && (
  <WelcomeGuide 
    hasError={!!dashboardStats.error}
    errorMessage={dashboardStats.error || undefined}
    onNavigateToPersonas={...}
    onNavigateToCustomers={...}
  />
)}
```

### useDashboardData.ts
Enhanced error handling:
- Detailed error messages for each API call
- Real-time subscription status monitoring
- User-friendly error text instead of technical jargon

## Visual Design

**Color Scheme:**
- Primary: Teal/cyan gradient (#22d3ee, #06b6d4)
- Accent: Purple/pink accent
- Healthcare green: Success states
- Background: Light gradient with subtle pattern

**Typography:**
- Heading: Bold, large font (3xl)
- Subheading: Regular weight, medium size (lg)
- Body: Regular, readable (sm-base)
- Muted text: Lower contrast for secondary info

**Spacing:**
- Generous padding (p-8 on card)
- Consistent gap between sections (space-y-4, gap-4)
- Hover effects on interactive elements

## Future Enhancements

Potential improvements:
1. **Progress Tracking**: Show percentage complete
2. **Video Tutorials**: Embed quick video guides
3. **Interactive Tour**: Highlight UI elements on first visit
4. **Sample Data**: Pre-populate with demo campaign
5. **Checklist Persistence**: Remember completed steps

## Related Files

- `/src/components/WelcomeGuide.tsx` - Main component
- `/src/pages/Dashboard.tsx` - Integration point
- `/src/hooks/useDashboardData.ts` - Data fetching logic
- `/DEBUGGING_GUIDE.md` - Troubleshooting reference

---

**Last Updated**: 2025-11-12
**Component Version**: 1.0
