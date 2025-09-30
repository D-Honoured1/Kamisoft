-- Create Documents Storage Bucket for Invoice PDFs
-- Run this in your Supabase SQL Editor

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/*'];

-- Add RLS policies for the documents bucket

-- Policy 1: Allow service role to upload documents (for server-side invoice generation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can upload to documents'
  ) THEN
    CREATE POLICY "Service role can upload to documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

-- Policy 2: Allow public read access to documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public can read documents'
  ) THEN
    CREATE POLICY "Public can read documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');
  END IF;
END $$;

-- Policy 3: Allow service role to delete documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can delete documents'
  ) THEN
    CREATE POLICY "Service role can delete documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents');
  END IF;
END $$;

-- Verify the bucket was created
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'documents';

-- Verify policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%documents%';