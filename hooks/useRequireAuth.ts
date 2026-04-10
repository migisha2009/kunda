import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function useRequireAuth(requiredRole: 'couple' | 'vendor' | 'admin') {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (role !== requiredRole) {
      window.location.href = '/dashboard/' + role
      return
    }
  }, [user, role, loading, requiredRole, router])

  return { user, role, loading }
}
