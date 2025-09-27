// Date formatting utility to prevent hydration mismatches
// Ensures consistent date formatting between server and client

/**
 * Format a date consistently for both server and client rendering
 * This prevents hydration mismatches caused by locale differences
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Use explicit locale to ensure consistency
    return new Intl.DateTimeFormat('en-US', options).format(dateObj)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format a date and time consistently
 */
export function formatDateTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Use explicit locale and timezone to ensure consistency
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: 'UTC' // Use UTC to prevent timezone mismatches
    }).format(dateObj)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format a relative date (e.g., "2 days ago")
 * Safe for both server and client rendering
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`

    return `${Math.floor(diffInDays / 365)} years ago`
  } catch (error) {
    return 'Unknown date'
  }
}