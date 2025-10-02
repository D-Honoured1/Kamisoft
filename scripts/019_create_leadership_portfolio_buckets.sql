-- Create Leadership and Portfolio Image Storage Buckets
-- Run this in your Supabase SQL Editor

-- Create the leadership-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('leadership-images', 'leadership-images', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/*'];

-- Create the portfolio-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-images', 'portfolio-images', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*'];

-- Add RLS policies for leadership-images bucket
-- Note: Service role bypasses RLS, but we add policies for good practice

-- Policy 1: Allow service role to upload to leadership-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can upload leadership images'
  ) THEN
    CREATE POLICY "Service role can upload leadership images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'leadership-images');
  END IF;
END $$;

-- Policy 2: Allow public read access to leadership images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public can read leadership images'
  ) THEN
    CREATE POLICY "Public can read leadership images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'leadership-images');
  END IF;
END $$;

-- Policy 3: Allow service role to delete leadership images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can delete leadership images'
  ) THEN
    CREATE POLICY "Service role can delete leadership images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'leadership-images');
  END IF;
END $$;

-- Add RLS policies for portfolio-images bucket

-- Policy 1: Allow service role to upload to portfolio-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can upload portfolio images'
  ) THEN
    CREATE POLICY "Service role can upload portfolio images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'portfolio-images');
  END IF;
END $$;

-- Policy 2: Allow public read access to portfolio images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public can read portfolio images'
  ) THEN
    CREATE POLICY "Public can read portfolio images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-images');
  END IF;
END $$;

-- Policy 3: Allow service role to delete portfolio images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can delete portfolio images'
  ) THEN
    CREATE POLICY "Service role can delete portfolio images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'portfolio-images');
  END IF;
END $$;

-- Verify the buckets were created
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('leadership-images', 'portfolio-images');

-- Verify policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND (policyname LIKE '%leadership images%' OR policyname LIKE '%portfolio images%');
