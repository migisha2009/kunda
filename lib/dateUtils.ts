export const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A'
  try {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString(
        'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }
      )
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    return new Date(timestamp).toLocaleDateString(
      'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    )
  } catch {
    return 'N/A'
  }
}
