import { cookies } from 'next/headers'

const COOKIE_NAME = 'kunda-role'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

export const setRoleCookie = (role: 'couple' | 'vendor' | 'admin' | null): void => {
  if (typeof window !== 'undefined') {
    // Client-side
    if (role) {
      document.cookie = `${COOKIE_NAME}=${role}; max-age=${COOKIE_OPTIONS.maxAge}; path=${COOKIE_OPTIONS.path}; same-site=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? '; secure' : ''}`
    } else {
      document.cookie = `${COOKIE_NAME}=; max-age=0; path=${COOKIE_OPTIONS.path}`
    }
  }
}

export const getRoleCookie = async (): Promise<'couple' | 'vendor' | 'admin' | null> => {
  if (typeof window !== 'undefined') {
    // Client-side
    const cookieString = document.cookie
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=')
      acc[name] = value
      return acc
    }, {} as Record<string, string>)
    
    return cookies[COOKIE_NAME] as 'couple' | 'vendor' | null
  } else {
    // Server-side
    const cookieStore = await cookies()
    const role = cookieStore.get(COOKIE_NAME)?.value
    return role as 'couple' | 'vendor' | 'admin' | null
  }
}

export const clearRoleCookie = (): void => {
  setRoleCookie(null)
}
