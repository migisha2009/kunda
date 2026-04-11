export const formatDate = (timestamp: any): string => {
  if (timestamp === null || 
      timestamp === undefined || 
      timestamp === '') return 'N/A'
  
  try {
    if (typeof timestamp?.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString(
        'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }
      )
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000)
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    if (typeof timestamp === 'string' || 
        typeof timestamp === 'number') {
      const d = new Date(timestamp)
      if (isNaN(d.getTime())) return 'N/A'
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    return 'N/A'
  } catch {
    return 'N/A'
  }
}
