# Edge Function Fixes

## Issues Fixed

### 1. generate-email-body: JSON Parsing Error

**Problem**: AI responses sometimes included valid JSON but failed to parse due to formatting issues.

**Error Message**:
```
Failed to parse Azure OpenAI response: {
  "greeting": "प्रिय विक्रम सिंह जी,",
  ...
}
```

**Root Cause**: The JSON response was valid but the parser wasn't handling edge cases like:
- Extra whitespace
- Unicode characters (Hindi content)
- Nested quotes

**Fix**:
- Improved JSON extraction using regex to find JSON object
- Better error handling with graceful fallback
- Returns fallback content instead of throwing error
- Validates required fields before returning

### 2. campaign-send: Database Schema Mismatch

**Problem**: Assignments table was missing required columns.

**Error Message**:
```
Could not find the 'variant_id' column of 'assignments' in the schema cache
```

**Root Cause**: 
- Original schema had `variant_subject_id` and `variant_body_id`
- Updated code uses `variant_id` and `message_id`
- Schema wasn't migrated

**Fix**:
- Created migration `20251113000004_fix_assignments_schema.sql`
- Added `variant_id` column (references variants table)
- Added `message_id` column (for Brevo tracking)
- Added indexes for performance

## Migration Required

**IMPORTANT**: Run this migration to fix the database schema:

```bash
cd /home/runner/work/preventiq-genai-engine/preventiq-genai-engine
npx supabase db push
```

This will apply:
- `20251113000004_fix_assignments_schema.sql` - Fixes assignments table

## Updated Functions

### generate-email-body
- Better JSON parsing with fallback
- Graceful error handling
- Returns fallback content instead of failing

### campaign-send  
- Handles fallback responses from generate-email-body
- Uses correct column names (variant_id, message_id)
- Better error logging

## Testing

After deploying fixes:

1. **Test email generation**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-email-body \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "ARCH_PRO",
    "lead_name": "Test User",
    "lang": "hi"
  }'
```

2. **Test campaign send**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/campaign-send \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [1]}'
```

3. **Verify in database**:
```sql
-- Check assignments have variant_id and message_id
SELECT id, lead_id, persona_id, variant_id, message_id, status 
FROM assignments 
ORDER BY id DESC 
LIMIT 10;
```

## Deployment Steps

1. Apply database migration:
```bash
npx supabase db push
```

2. Deploy updated edge functions:
```bash
npx supabase functions deploy generate-email-body --no-verify-jwt
npx supabase functions deploy campaign-send --no-verify-jwt
```

3. Test email sending from UI

4. Monitor edge function logs for any remaining errors

## Files Changed

- `supabase/migrations/20251113000004_fix_assignments_schema.sql` - NEW migration
- `supabase/functions/generate-email-body/index.ts` - Improved JSON parsing
- `supabase/functions/campaign-send/index.ts` - Handle fallback responses

All errors should now be resolved!
