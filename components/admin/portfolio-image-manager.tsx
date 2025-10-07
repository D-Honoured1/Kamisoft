"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchProjectHomepageImage, getImageDisplayUrl, generateProjectImagePlaceholder } from "@/lib/image-utils"
import { Globe, Upload, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react"

interface PortfolioImageManagerProps {
  projectId: string
  projectTitle: string
  projectUrl?: string
  currentImageUrl?: string
  onImageUpdate: (imageUrl: string) => void
  className?: string
}

export function PortfolioImageManager({
  projectId,
  projectTitle,
  projectUrl,
  currentImageUrl,
  onImageUpdate,
  className = ""
}: PortfolioImageManagerProps) {
  const [isLoadingHomepage, setIsLoadingHomepage] = useState(false)
  const [homepageImageUrl, setHomepageImageUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (projectUrl && !homepageImageUrl) {
      loadHomepageImage()
    }
  }, [projectUrl])

  const loadHomepageImage = async () => {
    if (!projectUrl) return

    setIsLoadingHomepage(true)
    setError("")

    try {
      const imageUrl = await fetchProjectHomepageImage(projectUrl)
      setHomepageImageUrl(imageUrl)
    } catch (error: any) {
      console.warn('Could not load homepage image:', error)
      setError("Could not load image from project homepage")
    } finally {
      setIsLoadingHomepage(false)
    }
  }

  const useHomepageImage = () => {
    if (homepageImageUrl) {
      onImageUpdate(homepageImageUrl)
    }
  }

  const displayImageUrl = getImageDisplayUrl(currentImageUrl, homepageImageUrl)

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Project Image Management
          </CardTitle>
          <CardDescription>
            Upload a custom image or use the image from your project homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="homepage" className="flex items-center gap-2" disabled={!projectUrl}>
                <Globe className="w-4 h-4" />
                Homepage Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <ImageUpload
                value={currentImageUrl}
                onImageUpload={onImageUpdate}
                onImageRemove={() => onImageUpdate("")}
                label="Upload Custom Project Image"
                bucket="portfolio-images"
                maxSize={10}
              />
            </TabsContent>

            <TabsContent value="homepage" className="space-y-4">
              {!projectUrl ? (
                <Alert>
                  <AlertDescription>
                    Add a project URL to automatically fetch images from your project homepage.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Project Homepage</p>
                      <p className="text-xs text-muted-foreground">{projectUrl}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadHomepageImage}
                      disabled={isLoadingHomepage}
                    >
                      {isLoadingHomepage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {isLoadingHomepage ? "Loading..." : "Refresh"}
                    </Button>
                  </div>

                  {isLoadingHomepage ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Fetching image from project homepage...
                      </p>
                    </div>
                  ) : homepageImageUrl ? (
                    <div className="space-y-4">
                      <div className="border-2 rounded-lg p-4">
                        <img
                          src={homepageImageUrl}
                          alt={`Homepage image for ${projectTitle}`}
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          Found on homepage
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={useHomepageImage}
                          disabled={currentImageUrl === homepageImageUrl}
                        >
                          {currentImageUrl === homepageImageUrl ? "Currently Used" : "Use This Image"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No suitable image found on the project homepage. You can try refreshing or upload a custom image instead.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Current Image Preview */}
          {displayImageUrl && (
            <div className="mt-6 p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm font-medium mb-2">Current Project Image</p>
              <div className="relative">
                <img
                  src={displayImageUrl}
                  alt={projectTitle}
                  className="w-full h-32 object-cover rounded border"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {currentImageUrl ? "Custom Upload" : "From Homepage"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}