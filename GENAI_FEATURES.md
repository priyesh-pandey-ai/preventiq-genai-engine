# GenAI Features - Implementation Guide

## Overview
PreventIQ leverages cutting-edge AI to deliver fully automated, personalized healthcare marketing campaigns. This document outlines all AI-powered features.

## 🤖 AI-Powered Features

### 1. AI-First Persona Classification
**Edge Function**: `classify-persona`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Intelligently classify leads into 6 behavioral archetypes

**How it works**:
- Analyzes lead data: age, city, organization type, language
- Uses AI to understand behavioral patterns and motivations
- Assigns to one of 6 personas: Professional, Parent, Senior, Student, Risk-Averse, Price-Conscious
- Provides reasoning for classification (transparency)

**AI Advantage**:
- Understands nuanced patterns beyond simple age rules
- Learns from implicit signals in city and organization data
- Adapts to edge cases that deterministic rules miss
- Provides explainable AI decisions

### 2. AI-Generated Email Subject Lines
**Edge Function**: `generate-subjects`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Create compelling, persona-specific subject lines

**How it works**:
- Generates 3 unique subject line variants per persona/language
- Optimized for healthcare marketing (no false claims)
- Under 52 characters for optimal mobile display
- Language-aware (English & Hindi)

**AI Advantage**:
- Creates fresh, engaging copy continuously
- Avoids marketing fatigue with variety
- Tests different psychological triggers
- Learns which styles work best through Thompson Sampling

### 3. AI-Generated Email Body Content (NEW)
**Edge Function**: `generate-email-body`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Dynamically generate personalized email content for each lead

**How it works**:
- Takes persona, lead name, subject line, and language
- Generates fully personalized email with:
  - Warm, personalized greeting
  - 2-3 engaging paragraphs (under 150 words)
  - Persona-specific benefits and messaging
  - Compelling call-to-action
  - Professional closing
- Fallback to static templates if AI unavailable

**AI Advantage**:
- Every email is unique and fresh
- Personalized beyond "Hi [Name]" - actually speaks to persona motivations
- Emotional connection through tailored language
- Continuously improves messaging variety
- No more template fatigue

**Example Response**:
```json
{
  "email_content": {
    "greeting": "Hello Priya,",
    "body_paragraph_1": "As a busy professional, your time is precious. That's why we've designed our health screening to fit seamlessly into your schedule.",
    "body_paragraph_2": "Get data-driven insights about your health in just 30 minutes. Our comprehensive panel uses the latest diagnostics to identify risks before they become problems.",
    "call_to_action": "View Your Personalized Health Plan",
    "closing": "Invest in your health today for a more productive tomorrow."
  },
  "generated_by": "azure-openai-grok-3"
}
```

### 4. AI-Powered Lead Enrichment (NEW)
**Edge Function**: `enrich-lead`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Analyze lead profile and engagement to provide actionable insights

**How it works**:
- Analyzes lead demographics and behavior
- Reviews engagement history (emails, clicks)
- Generates insights:
  - Engagement level assessment (high/medium/low)
  - Conversion likelihood prediction
  - Best messaging strategy for this specific lead
  - Optimal send time recommendation
  - Specific actions to increase engagement

**AI Advantage**:
- Individual lead-level intelligence
- Predictive analytics for conversion
- Personalized timing recommendations
- Actionable recommendations, not just data

**Example Response**:
```json
{
  "insights": {
    "engagement_level": "medium",
    "engagement_reasoning": "Lead has opened 2 of 3 emails but hasn't clicked yet. Shows interest but needs stronger CTA.",
    "conversion_likelihood": "high",
    "conversion_reasoning": "Professional persona in metro city, matches our ideal customer profile. Recent engagement trend is positive.",
    "messaging_strategy": "Focus on time-savings and ROI. Use data-driven language with statistics.",
    "best_send_time": "morning",
    "recommended_actions": [
      "Send case study with professional testimonials",
      "Offer free 15-minute health consultation",
      "Emphasize quick appointment booking process"
    ]
  }
}
```

### 5. AI Campaign Optimization (NEW)
**Edge Function**: `optimize-campaigns`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Strategic campaign analysis and improvement recommendations

**How it works**:
- Analyzes 30-day campaign performance across all personas
- Reviews Thompson Sampling variant performance
- Identifies optimization opportunities
- Suggests new testing strategies
- Generates innovative campaign ideas

**AI Advantage**:
- Strategic insights beyond basic metrics
- Identifies non-obvious patterns
- Suggests creative campaigns humans might miss
- Provides data-backed recommendations
- Continuous learning from campaign results

**Example Response**:
```json
{
  "recommendations": {
    "top_opportunities": [
      {
        "issue": "ARCH_SEN has only 2.1% CTR vs 8.5% average",
        "impact": "high",
        "action": "Test traditional language and doctor testimonials for seniors"
      }
    ],
    "innovative_ideas": [
      {
        "idea": "AI Health Risk Assessment Quiz",
        "ai_feature": "Personalized results based on quiz answers using Gemini",
        "expected_impact": "45% higher engagement, builds trust"
      },
      {
        "idea": "Voice-based Health Reminders",
        "ai_feature": "AI-generated voice messages in regional languages",
        "expected_impact": "Better accessibility for seniors, 30% higher completion"
      }
    ],
    "success_metrics": [
      "CTR by persona and variant",
      "Time-to-click after email send",
      "Conversion rate to booked appointment"
    ]
  }
}
```

### 6. AI-Powered Campaign Reports
**Edge Function**: `generate-report`  
**AI Model**: Azure OpenAI (Grok-3)  
**Purpose**: Weekly intelligent insights and recommendations

**How it works**:
- Aggregates campaign KPIs by persona
- Calculates Product-Market Fit (PMF) score
- AI analyzes which personas are most engaged
- Generates strategic summary
- Suggests next campaign subject lines

**AI Advantage**:
- Natural language insights, not just numbers
- Explains "why" behind the data
- Forward-looking recommendations
- Executive-ready summaries

## 🎯 End-to-End AI Flow

```
Lead Signup
    ↓
[AI: classify-persona] → Intelligent persona assignment
    ↓
[AI: enrich-lead] → Get engagement insights & predictions
    ↓
Campaign Trigger
    ↓
[AI: generate-subjects] → Create subject line variants (if needed)
    ↓
[Thompson Sampling] → Select best variant
    ↓
[AI: generate-email-body] → Create personalized email content
    ↓
Send Email (with AI-generated content)
    ↓
Track Clicks → Update Thompson Sampling
    ↓
Weekly:
[AI: generate-report] → Strategic insights
[AI: optimize-campaigns] → Improvement recommendations
```

## 📊 AI Models Used

| Feature | AI Model | Provider | Purpose |
|---------|----------|----------|---------|
| Persona Classification | Grok-3 | Azure OpenAI | Behavioral analysis |
| Subject Line Generation | Grok-3 | Azure OpenAI | Creative copywriting |
| Email Body Generation | Grok-3 | Azure OpenAI | Personalized content |
| Lead Enrichment | Grok-3 | Azure OpenAI | Predictive analytics |
| Campaign Optimization | Grok-3 | Azure OpenAI | Strategic insights |
| Campaign Reports | Grok-3 | Azure OpenAI | Performance analysis |

## 🔧 Configuration

### Required Environment Variables

```env
# Azure OpenAI (for all AI features)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-key
AZURE_MODEL_NAME=grok-3

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Deployment

Deploy all new AI functions:
```bash
npx supabase functions deploy classify-persona --no-verify-jwt
npx supabase functions deploy generate-subjects --no-verify-jwt
npx supabase functions deploy generate-email-body --no-verify-jwt
npx supabase functions deploy enrich-lead --no-verify-jwt
npx supabase functions deploy optimize-campaigns --no-verify-jwt
npx supabase functions deploy generate-report --no-verify-jwt
```

## 🧪 Testing AI Features

### Test Email Body Generation
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-email-body \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "ARCH_PRO",
    "lead_name": "Priya",
    "lang": "en",
    "subject_line": "Your Personalized Health Screening Awaits"
  }'
```

### Test Lead Enrichment
```bash
curl -X POST https://your-project.supabase.co/functions/v1/enrich-lead \
  -H "Authorization: ******" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 123}'
```

### Test Campaign Optimization
```bash
curl -X POST https://your-project.supabase.co/functions/v1/optimize-campaigns \
  -H "Authorization: ******" \
  -H "Content-Type: application/json"
```

## 💡 AI Best Practices

1. **Fallback Strategies**: All AI features have fallbacks to prevent campaign failures
2. **Rate Limiting**: 7-second delays between AI calls to avoid rate limits
3. **Cost Management**: Batch operations where possible, cache results
4. **Quality Control**: Validate AI outputs before sending to users
5. **Continuous Learning**: Thompson Sampling automatically improves over time
6. **Transparency**: Log AI decisions for debugging and optimization

## 🚀 Future AI Enhancements

1. **Multi-modal Content**: AI-generated images for email headers
2. **Conversational AI**: Chatbot for lead qualification
3. **Predictive Send Times**: ML model for optimal send timing per lead
4. **Sentiment Analysis**: Analyze email responses
5. **Auto-segmentation**: AI-discovered micro-segments beyond 6 personas
6. **Voice Campaigns**: AI-generated voice messages in regional languages
7. **Real-time Personalization**: Dynamic email content based on current context

## 📈 Measuring AI Impact

Track these metrics to measure AI effectiveness:
- **Email Engagement**: CTR comparison (AI-generated vs templates)
- **Conversion Rate**: Leads to appointments
- **Persona Accuracy**: Manual review of AI classifications
- **Content Quality**: User feedback on email relevance
- **ROI**: Cost per conversion with AI vs without

## 🎓 AI Learning Loop

PreventIQ's AI gets smarter over time:
1. **Thompson Sampling** learns best subject lines per persona
2. **Email Body Generator** can be fine-tuned with successful examples
3. **Lead Enrichment** predictions validated against actual conversions
4. **Campaign Optimizer** learns from implemented recommendations

Every campaign makes the next one better!
