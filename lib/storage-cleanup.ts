import { createServerClient } from "@/lib/supabase/server"

export async function deleteImageFromStorage(imageUrl: string, bucket: string): Promise<boolean> {
  try {
    if (!imageUrl || !imageUrl.includes('supabase') || !imageUrl.includes(bucket)) {
      // Not our storage URL, no need to delete
      return true
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) {
      console.warn('Could not extract filename from URL:', imageUrl)
      return false
    }

    const supabase = createServerClient()

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      console.error('Storage cleanup error:', error)
      return false
    }

    console.log('Successfully deleted image:', fileName)
    return true
  } catch (error) {
    console.error('Storage cleanup error:', error)
    return false
  }
}

export async function cleanupPortfolioImages(projectId: string): Promise<void> {
  try {
    const supabase = createServerClient()

    // Get the project data to find associated images
    const { data: project } = await supabase
      .from('portfolio_projects')
      .select('featured_image_url')
      .eq('id', projectId)
      .single()

    if (project?.featured_image_url) {
      await deleteImageFromStorage(project.featured_image_url, 'portfolio-images')
    }
  } catch (error) {
    console.error('Portfolio image cleanup error:', error)
  }
}

export async function cleanupLeadershipImages(memberId: string): Promise<void> {
  try {
    const supabase = createServerClient()

    // Get the member data to find associated images
    const { data: member } = await supabase
      .from('leadership_team')
      .select('profile_image_url')
      .eq('id', memberId)
      .single()

    if (member?.profile_image_url) {
      await deleteImageFromStorage(member.profile_image_url, 'leadership-images')
    }
  } catch (error) {
    console.error('Leadership image cleanup error:', error)
  }
}