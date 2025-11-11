# PreventIQ API Reference

This document describes all the Supabase Edge Functions and their usage.

## Base URL

```
https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1
```

## Authentication

Most functions use `--no-verify-jwt` for simplicity in MVP. For production, add JWT verification.

## Edge Functions

### 1. Lead Intake

**Endpoint**: `POST /lead-intake`

**Description**: Captures lead submissions from the landing page form.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "city": "Mumbai",
  "org_type": "Clinic",
  "lang": "en"
}
```

**Response**:
```json
{
  "success": true,
  "lead_id": 123,
  "message": "Lead created successfully"
}
```

**Usage in Frontend**:
```typescript
const { data, error } = await supabase.functions.invoke('lead-intake', {
  body: { name, email, city, org_type, lang }
});
```

---

### 2. Generate Subjects

**Endpoint**: `POST /generate-subjects`

**Description**: Generates 3 AI-powered email subject lines for instant value widget.

**Request Body**:
```json
{
  "category": "Diabetes Screening",
  "lang": "en"
}
```

**Response**:
```json
{
  "subjects": [
    "Is your blood sugar trying to tell you something?",
    "3 silent signs of prediabetes you might be missing",
    "Free diabetes screening - know your numbers"
  ]
}
```

**Usage in Frontend**:
```typescript
const { data, error } = await supabase.functions.invoke('generate-subjects', {
  body: { category, lang: 'en' }
});
```

---

### 3. Classify Persona

**Endpoint**: `POST /classify-persona`

**Description**: Classifies a lead into one of 6 archetypes using AI.

**Request Body**:
```json
{
  "lead_id": 123,
  "org_type": "Clinic",
  "city": "Mumbai"
}
```

**Response**:
```json
{
  "persona_id": "ARCH_PRO",
  "confidence": 0.85,
  "reasoning": "Tech-savvy professional in urban area"
}
```

**Called by**: n8n workflows (not typically called from frontend)

---

### 4. Track Click

**Endpoint**: `GET /track-click/{assignment_id}`

**Description**: Records email click events and redirects to thank you page.

**Parameters**:
- `assignment_id`: Assignment ID from email link

**Response**: Redirects to `/thanks` page

**Usage in Email**:
```html
<a href="https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/track-click/123">
  Click Here
</a>
```

---

### 5. Campaign Send

**Endpoint**: `POST /campaign-send`

**Description**: Orchestrates daily campaign sends. Called by n8n Flow C.

**Request Body**:
```json
{
  "max_leads": 50
}
```

**Response**:
```json
{
  "campaigns": [
    {
      "lead_id": 123,
      "lead_email": "john@example.com",
      "lead_name": "John Doe",
      "persona_id": "ARCH_PRO",
      "variant_id": "ARCH_PRO_1731342000_abc123",
      "subject": "Is your heart trying to tell you something?",
      "lang": "en"
    }
  ],
  "total": 25
}
```

**Called by**: n8n workflow (not frontend)

---

### 6. Sync Events

**Endpoint**: `POST /sync-events`

**Description**: Processes email events from Brevo (opens, clicks, deliveries). Called by n8n Flow D.

**Request Body**:
```json
{
  "events": [
    {
      "messageId": "abc123",
      "event": "click",
      "timestamp": "2025-11-11T10:30:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "processed": 5,
  "errors": []
}
```

**Called by**: n8n workflow (not frontend)

---

### 7. Generate Report

**Endpoint**: `POST /generate-report`

**Description**: Generates campaign performance report with AI insights. Called by n8n Flow F.

**Request Body**:
```json
{
  "start_date": "2025-11-04",
  "end_date": "2025-11-11"
}
```

**Response**:
```json
{
  "kpis": [
    {
      "persona_id": "ARCH_PRO",
      "persona_label": "Proactive Professional",
      "total_sends": 250,
      "total_clicks": 45,
      "ctr": 0.18
    }
  ],
  "pmf_score": 0.12,
  "global_ctr": 0.15,
  "insights": {
    "summary": "Proactive Professionals showed highest engagement...",
    "next_ideas": [
      "Data-driven health insights await you",
      "Your personalized wellness report is ready",
      "Science-backed prevention strategies"
    ]
  }
}
```

**Called by**: n8n workflow (not frontend)

---

### 8. Send Welcome Email

**Endpoint**: `POST /send-welcome-email`

**Description**: Sends welcome email to new leads (requires Resend API key).

**Request Body**:
```json
{
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message_id": "xyz789"
}
```

**Note**: Currently requires Resend API key configuration.

---

## Database Tables (via Supabase Client)

### Leads Table

**Read Leads**:
```typescript
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .order('created_at', { ascending: false });
```

**Count Leads**:
```typescript
const { count, error } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true });
```

---

### Assignments Table

**Get Campaign Count**:
```typescript
const { count, error } = await supabase
  .from('assignments')
  .select('*', { count: 'exact', head: true });
```

---

### Events Table

**Get Click Count**:
```typescript
const { count, error } = await supabase
  .from('events')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'click');
```

**Get Recent Events**:
```typescript
const { data, error } = await supabase
  .from('events')
  .select(`
    *,
    assignment:assignments(
      lead:leads(name, email)
    )
  `)
  .order('ts', { ascending: false })
  .limit(10);
```

---

### Personas Table

**Get All Archetypes**:
```typescript
const { data, error } = await supabase
  .from('personas')
  .select('*')
  .eq('is_archetype', true);
```

---

## Real-time Subscriptions

### Listen to New Leads

```typescript
const subscription = supabase
  .channel('leads-changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'leads' },
    (payload) => {
      console.log('New lead:', payload.new);
    }
  )
  .subscribe();
```

### Listen to Campaign Events

```typescript
const subscription = supabase
  .channel('events-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'events' },
    (payload) => {
      console.log('New event:', payload.new);
    }
  )
  .subscribe();
```

---

## Error Handling

All functions follow this error format:

```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

**Common Error Codes**:
- `400`: Bad request (invalid input)
- `404`: Resource not found
- `409`: Conflict (e.g., duplicate email)
- `500`: Internal server error

---

## Rate Limits

- **Gemini API**: 60 requests/minute (free tier)
- **Brevo API**: 300 emails/day (free tier)
- **Supabase**: 500k reads, 2GB database (free tier)

---

## Testing

### cURL Examples

**Test Lead Intake**:
```bash
curl -X POST https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "city": "Delhi",
    "org_type": "Clinic",
    "lang": "en"
  }'
```

**Test Subject Generation**:
```bash
curl -X POST https://zdgvndxdhucbakguvkgw.supabase.co/functions/v1/generate-subjects \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Heart Health Checkup",
    "lang": "en"
  }'
```

---

## Security Notes

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Service Role**: Edge functions use service role key for database access
3. **CORS**: Functions are configured for public access (for MVP)
4. **API Keys**: Stored in Supabase secrets, not in code

---

## Next Steps

1. **Add JWT Verification**: Secure sensitive endpoints
2. **Implement Rate Limiting**: Prevent abuse
3. **Add Logging**: Track function performance
4. **Error Monitoring**: Set up Sentry or similar
5. **API Documentation**: Auto-generate with OpenAPI spec
