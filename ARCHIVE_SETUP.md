# Client Archive Feature Setup

## Issue
When archiving clients in the admin panel, the archive button works but doesn't update the database.

## Root Cause
Two issues need to be addressed:
1. The database migration script `scripts/014_add_client_soft_delete.sql` needs to be executed
2. The `archived_by` column needs to allow NULL values (fixed in `015_fix_archived_by_nullable.sql`)

The original migration creates:
- Archive columns (`archived_at`, `archived_by`, `archive_reason`)
- Database functions (`archive_client`, `restore_client`)
- Views for active and archived clients

## Solution - Run SQL Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (kamisoft-app)
3. Click on "SQL Editor" in the left sidebar

### Step 2: Execute BOTH Migrations
**First migration** (if not already run):
Copy and paste the entire contents of `/scripts/014_add_client_soft_delete.sql` into the SQL editor and click "Run"

**Second migration** (REQUIRED - fixes the archive issue):
Copy and paste the entire contents of `/scripts/015_fix_archived_by_nullable.sql` into the SQL editor and click "Run"

This second migration:
- Makes `archived_by` nullable (allows NULL values)
- Updates the database functions to accept NULL admin_id
- Fixes the archive functionality

**Or run this command if using Supabase CLI:**
```bash
supabase db push
```

### Step 3: Verify Installation
Run this query in the SQL editor to verify the columns exist:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('archived_at', 'archived_by', 'archive_reason');
```

You should see 3 rows returned.

### Step 4: Test Archive Function
Run this test query:
```sql
-- Test the archive function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('archive_client', 'restore_client');
```

You should see 2 functions returned.

## How Archive Works (After Migration)

### From Admin Panel:
1. Go to Admin → Clients
2. Click the archive button (trash icon) on any client
3. Enter an optional reason
4. Confirm archiving

### What Happens:
- Client's `archived_at` is set to current timestamp
- Client's `archived_by` is set to admin user ID
- Client's `archive_reason` stores your note
- Client **disappears from the main list** (filtered out by API)
- All service requests and payments are **preserved**
- Client can be **restored later** if needed

### Database Functions:

**Archive a client:**
```sql
SELECT archive_client(
  'client-uuid-here',
  'admin-uuid-here',
  'Optional reason for archiving'
);
```

**Restore a client:**
```sql
SELECT restore_client(
  'client-uuid-here',
  'admin-uuid-here'
);
```

## Viewing Archived Clients

### Option 1: SQL Query
```sql
SELECT id, name, email, archived_at, archive_reason
FROM clients
WHERE archived_at IS NOT NULL
ORDER BY archived_at DESC;
```

### Option 2: Use the View
```sql
SELECT * FROM archived_clients
ORDER BY archived_at DESC;
```

### Option 3: API Endpoint (Future Enhancement)
Add a query parameter to fetch archived clients:
```
GET /api/admin/clients?show_archived=true
```

## Important Notes

⚠️ **This is a SOFT DELETE** - Data is never actually removed from the database
✅ Archived clients maintain all relationships (service requests, payments)
✅ Archive actions are tracked (who archived, when, why)
✅ Archives can be reversed with the restore function
✅ API automatically filters archived clients from normal lists

## Troubleshooting

### "Function archive_client does not exist"
→ Run the migration script in Supabase SQL editor

### "Column archived_at does not exist"
→ Run the migration script in Supabase SQL editor

### Archive button not working
→ Check browser console for errors
→ Verify API route `/api/admin/clients/[id]` returns proper error messages

### Client still appears after archiving
→ Refresh the page
→ Check that `archived_at IS NOT NULL` in database
→ Verify API filter: `.is("archived_at", null)` in `/app/api/admin/clients/route.ts`