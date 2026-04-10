const COOKIE_NAME = 'kunda-role'

export const setRoleCookie = (role: 'couple' | 'vendor' | 'admin' | null): void => {
  if (typeof window === 'undefined') return
  
  if (role) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    const maxAge = 60 * 60 * 24 * 7
    document.cookie = `${COOKIE_NAME}=${role}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}` 
  } else {
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax` 
  }
}

export const getRoleCookie = (): string | null => {
  if (typeof window === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`))
  return match ? match.split('=')[1] : null
}

export const clearRoleCookie = (): void => {
  setRoleCookie(null)
}
