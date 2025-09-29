# Supabase Storage Setup

To set up the storage buckets for image uploads, follow these steps in your Supabase dashboard:

## 1. Create Storage Buckets

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create the following buckets:

### Portfolio Images Bucket
- **Name**: `portfolio-images`
- **Public bucket**: ✅ (checked)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/*`

### Leadership Images Bucket
- **Name**: `leadership-images`
- **Public bucket**: ✅ (checked)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`

## 2. Set Bucket Policies

For each bucket, add these RLS (Row Level Security) policies:

### Upload Policy (for authenticated admin users)
```sql
CREATE POLICY "Admin can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id IN ('portfolio-images', 'leadership-images')
);
```

### Read Policy (public access)
```sql
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('portfolio-images', 'leadership-images')
);
```

### Delete Policy (for authenticated admin users)
```sql
CREATE POLICY "Admin can delete images" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND bucket_id IN ('portfolio-images', 'leadership-images')
);
```

## 3. Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Features Added

✅ **Image Upload Component**: Drag & drop + click to upload
✅ **File Validation**: Size limits and file type checking
✅ **Preview**: Live image preview before and after upload
✅ **Storage Integration**: Direct upload to Supabase Storage
✅ **URL Fallback**: Manual URL input as alternative
✅ **Responsive Design**: Works on all device sizes
✅ **Error Handling**: Clear error messages for upload issues
✅ **Image Deletion**: Remove images from both form and storage
✅ **Auto Cleanup**: Images are automatically deleted when records are removed

## 5. Usage

The image upload functionality is now available in:
- Leadership team member forms (new & edit)
- Portfolio project forms (new & edit)

Users can either:
1. Drag & drop images onto the upload area
2. Click to select files from their device
3. Enter image URLs manually as a fallback

All uploaded images are automatically optimized and stored in Supabase Storage with public URLs.

## 6. Image Deletion Capabilities

### Manual Deletion
- **Remove Button**: Each uploaded image has an "X" button to remove it
- **Storage Cleanup**: When you click remove, the image is deleted from both the form and Supabase Storage
- **URL Fallback**: If using manual URLs (not uploaded through the system), only the form field is cleared

### Automatic Cleanup
- **Record Deletion**: When you delete a portfolio project or leadership member, their associated images are automatically removed from storage
- **Prevents Orphaned Files**: Ensures storage doesn't accumulate unused images
- **Background Process**: Cleanup happens automatically without user intervention

### Technical Details
- **Smart Detection**: Only attempts to delete images that were uploaded through the system (checks for Supabase URLs)
- **Graceful Fallback**: If deletion fails, the form field is still cleared and the operation continues
- **Error Handling**: Deletion errors are logged but don't prevent the main operation from completing