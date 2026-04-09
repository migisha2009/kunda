const COOKIE_NAME = 'kunda-role'
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

export const setRoleCookie = (role: 'couple' | 'vendor' | 'admin' | null): void => {
  if (typeof window !== 'undefined') {
    // Client-side
    if (role) {
      document.cookie = `${COOKIE_NAME}=${role}; max-age=${COOKIE_OPTIONS.maxAge}; path=${COOKIE_OPTIONS.path}; same-site=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`
    } else {
      document.cookie = `${COOKIE_NAME}=; max-age=0; path=${COOKIE_OPTIONS.path}`
    }
  }
}

export const getRoleCookie = (): 'couple' | 'vendor' | 'admin' | null => {
  if (typeof window !== 'undefined') {
    // Client-side
    const cookieString = document.cookie
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=')
      acc[name] = value
      return acc
    }, {} as Record<string, string>)
    
    return cookies[COOKIE_NAME] as 'couple' | 'vendor' | 'admin' | null
  }
  return null
}

export const clearRoleCookie = (): void => {
  setRoleCookie(null)
}
