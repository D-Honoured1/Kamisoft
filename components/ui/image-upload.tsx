"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onImageUpload: (url: string) => void
  onImageRemove?: () => void
  label?: string
  className?: string
  accept?: string
  maxSize?: number // in MB
  bucket?: string
}

export function ImageUpload({
  value,
  onImageUpload,
  onImageRemove,
  label = "Upload Image",
  className = "",
  accept = "image/*",
  maxSize = 5, // 5MB default
  bucket = "portfolio-images"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { url } = await response.json()
      onImageUpload(url)
    } catch (error: any) {
      setError(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!value) return

    setIsUploading(true)
    setError("")

    try {
      // Only attempt to delete if the URL is from our storage
      if (value.includes('supabase') && value.includes(bucket)) {
        const response = await fetch(`/api/upload/delete?url=${encodeURIComponent(value)}&bucket=${bucket}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          // Continue with removal even if deletion fails (file might not exist)
        }
      }

      // Always call onImageRemove to clear the form field
      if (onImageRemove) {
        onImageRemove()
      }
    } catch (error: any) {
      // Still remove from form even if delete failed
      if (onImageRemove) {
        onImageRemove()
      }
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {value ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Uploaded image"
              className="w-32 h-32 rounded-lg object-cover border-2 border-border"
            />
            {onImageRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Replace Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <div className="mx-auto mb-4">
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mx-auto" />
            ) : (
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : 'Drag and drop an image here, or click to select'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Select Image'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Supports: JPG, PNG, GIF, WebP (max {maxSize}MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  )
}