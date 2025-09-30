# Invoice System Troubleshooting

## Current Issues from Screenshot

### Issue 1: Deleted Payments Still Showing ✅ FIXED
**Problem**: 5 payments showing as "deleted" in Financial Details

**Solution Applied**:
- Updated `/app/admin/requests/[id]/page.tsx` line 71
- Added `.neq("payment_status", "deleted")` filter
- **Action Required**: Restart your app to see the fix

### Issue 2: No Invoice Showing / No Download Button
**Possible Causes**:

1. **Invoice wasn't generated** - Check the database
2. **Documents storage bucket doesn't exist** - Need to create it
3. **Invoice generated but not displaying** - UI issue

## Steps to Fix

### Step 1: Create Documents Storage Bucket

Run this in **Supabase SQL Editor**:

```sql
-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
```

Or via UI:
1. Supabase Dashboard → Storage
2. New Bucket
3. Name: `documents`, Public: ✅, Size: 50MB

### Step 2: Check if Invoice Exists

Run this in **Supabase SQL Editor**:

```sql
-- Check invoices for your request
SELECT
  id,
  invoice_number,
  status,
  total_amount,
  pdf_url,
  created_at
FROM invoices
WHERE request_id = '5a925b0d-78c8-4ea1-9151-598e4cbdd62f'
ORDER BY created_at DESC;
```

### Step 3: Check Deleted Payments

```sql
-- See all deleted payments
SELECT
  id,
  amount,
  payment_status,
  payment_method,
  deleted_at,
  deleted_by
FROM payments
WHERE request_id = '5a925b0d-78c8-4ea1-9151-598e4cbdd62f'
ORDER BY created_at DESC;
```

### Step 4: Permanently Delete Old Payments

If you want to completely remove those deleted payments:

```sql
-- First delete audit records
DELETE FROM payment_audit_log
WHERE payment_id IN (
  SELECT id FROM payments
  WHERE request_id = '5a925b0d-78c8-4ea1-9151-598e4cbdd62f'
  AND payment_status = 'deleted'
);

-- Then delete the payments
DELETE FROM payments
WHERE request_id = '5a925b0d-78c8-4ea1-9151-598e4cbdd62f'
AND payment_status = 'deleted';
```

### Step 5: Restart Application

After making changes:
```bash
# If running locally
npm run dev

# If on production, redeploy or restart the service
```

## Expected Result After Fixes

1. ✅ Deleted payments hidden from view
2. ✅ Invoice shows in list with "View" and "Download PDF" buttons
3. ✅ Financial Details shows correct Total Paid and Balance Due
4. ✅ Can generate new invoices

## If Invoice Still Doesn't Show

### Check Browser Console
1. Open DevTools (F12)
2. Look for errors
3. Check Network tab for failed requests

### Generate New Invoice
1. Try generating a new invoice
2. Check browser console for `[INVOICE]` logs
3. Share any error messages

### Verify Invoice Component Props
The InvoiceGenerator needs:
- `requestId` ✅
- `clientEmail` ✅
- `clientName` ✅
- `estimatedCost` ✅
- `existingInvoices` array

If `existingInvoices` is empty, no invoices will show in the list.
