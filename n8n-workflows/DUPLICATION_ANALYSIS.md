# N8N Workflow Duplication Analysis

## Issue Summary

The original `flow-c-campaign-send.json` workflow has **DUPLICATE** email sending functionality that causes emails to be sent TWICE to the same lead.

## Root Cause

The `campaign-send` edge function was updated (commit 7568c9f) to send emails directly via Brevo API. However, the n8n workflow still contains its own Brevo email sending nodes, creating duplication.

## Detailed Flow Comparison

### ❌ Original Workflow (DUPLICATES EMAILS)

```
Schedule/Webhook Trigger
  ↓
Supabase Config
  ↓
Call campaign-send Edge Function
  ├─ Creates assignment record
  ├─ Sends email via Brevo ✉️ (EMAIL SENT #1)
  ├─ Updates assignment with message_id
  └─ Returns campaigns array
  ↓
Has Campaigns?
  ↓
Split Campaigns
  ↓
Record Assignment (DUPLICATE - already done in edge function)
  ↓
Send Email via Brevo ✉️ (EMAIL SENT #2 - DUPLICATE!)
  ↓
Log Email Sent (DUPLICATE - already done in edge function)
```

**Result**: Each lead receives **TWO identical emails** 📬📬

### ✅ Simplified Workflow (NO DUPLICATION)

```
Schedule/Webhook Trigger
  ↓
Supabase Config
  ↓
Call campaign-send Edge Function
  ├─ Creates assignment record
  ├─ Sends email via Brevo ✉️ (EMAIL SENT ONCE)
  ├─ Updates assignment with message_id
  ├─ Updates lead's last_email_sent_at
  └─ Returns campaigns array
  ↓
Display Results
  └─ Shows summary (emails sent count)
```

**Result**: Each lead receives **ONE email** 📬

## What campaign-send Edge Function Already Does

The edge function (as of commit 7568c9f) handles:

1. ✅ Fetches leads to process (with `lead_ids` or 24h interval)
2. ✅ Classifies persona if needed (AI-first)
3. ✅ Generates AI email content (Azure OpenAI)
4. ✅ Creates assignment record in database
5. ✅ Sends email via Brevo API with tracking URL
6. ✅ Updates assignment with message_id and status='sent'
7. ✅ Updates lead's last_email_sent_at timestamp
8. ✅ Returns campaigns array for feedback

## Redundant Nodes in Original Workflow

These nodes are NO LONGER NEEDED:

1. **"Record Assignment"** - Edge function already creates assignment
2. **"Send Email via Brevo"** - Edge function already sends via Brevo
3. **"Log Email Sent"** - Edge function already updates assignment/events

## Recommendation

**✅ USE**: `flow-c-campaign-send-simplified.json`
- No duplication
- Cleaner workflow
- Relies on edge function for all logic
- Easier to maintain

**❌ DO NOT USE**: `flow-c-campaign-send.json`
- Sends duplicate emails
- Redundant database operations
- Harder to debug

## Migration Steps

If you're currently using the original workflow:

1. **Stop** the original workflow in n8n (click "Inactive" toggle)
2. **Import** `flow-c-campaign-send-simplified.json` as a new workflow
3. **Configure** credentials (Supabase API only - no Brevo or Postgres needed)
4. **Activate** the simplified workflow
5. **Delete** or archive the original workflow

## Verification

After switching to the simplified workflow:

1. Trigger it manually (via webhook or "Execute Workflow" button)
2. Check that leads receive **ONE** email (not two)
3. Verify assignment records are created correctly
4. Run "Sync Email Events" to confirm tracking works

## Technical Details

### Edge Function Call (Both Workflows)

```typescript
POST /functions/v1/campaign-send
Body: {} // Empty for scheduled runs, or { lead_ids: [1,2,3] } for specific leads
```

### Response Format

```json
{
  "success": true,
  "campaigns": [
    {
      "lead_id": 1,
      "lead_name": "John Doe",
      "lead_email": "john@example.com",
      "persona_id": "ARCH_PRO",
      "variant_id": "var_123",
      "subject": "AI-generated subject",
      "email_content": {
        "greeting": "Hello John,",
        "body_paragraph_1": "...",
        "body_paragraph_2": "...",
        "call_to_action": "...",
        "closing": "..."
      },
      "ai_generated": true,
      "assignment_id": 42,
      "message_id": "brevo-msg-id",
      "sent": true
    }
  ]
}
```

### What Simplified Workflow Does

The simplified workflow just:
1. Calls the edge function
2. Displays the result
3. **That's it!**

All the heavy lifting (email sending, database updates, tracking) is in the edge function.

## Benefits of Simplified Approach

✅ **No Duplication** - Single source of truth (edge function)
✅ **Easier Debugging** - Less moving parts
✅ **Better Performance** - Fewer n8n node executions
✅ **Consistent Behavior** - UI "Send Email" and scheduled sends work the same way
✅ **Simpler Maintenance** - Changes only needed in edge function

## Conclusion

**Always use `flow-c-campaign-send-simplified.json`** to avoid duplicate emails and maintain consistency with the UI-triggered email sending functionality.
