-- Fix Invoice RLS Policies to Allow Server-Side Creation
-- The issue: Server tries to create invoices but RLS blocks it

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "invoices_admin_all" ON invoices;

-- Create permissive policies for invoice operations

-- Policy 1: Allow service role (server) to insert invoices
CREATE POLICY "Service role can insert invoices"
ON invoices FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow service role (server) to select invoices
CREATE POLICY "Service role can select invoices"
ON invoices FOR SELECT
USING (true);

-- Policy 3: Allow service role (server) to update invoices
CREATE POLICY "Service role can update invoices"
ON invoices FOR UPDATE
USING (true);

-- Policy 4: Allow authenticated admins to manage invoices
CREATE POLICY "Admins can manage invoices"
ON invoices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY policyname;