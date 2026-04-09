import { cookies } from 'next/headers'

const COOKIE_NAME = 'kunda-role'

export const getRoleCookie = async (): Promise<'couple' | 'vendor' | 'admin' | null> => {
  // Server-side
  const cookieStore = await cookies()
  const role = cookieStore.get(COOKIE_NAME)?.value
  return role as 'couple' | 'vendor' | 'admin' | null
}

export const setRoleCookie = (role: 'couple' | 'vendor' | 'admin' | null): void => {
  // Server-side cookie setting (for API routes)
  // Note: This should only be used in server components/API routes
  console.warn('setRoleCookie should only be used on client-side. Use Response.cookie() in API routes.')
}

export const clearRoleCookie = (): void => {
  // Server-side cookie clearing
  console.warn('clearRoleCookie should only be used on client-side.')
}
