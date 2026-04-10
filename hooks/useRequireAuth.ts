import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useRequireAuth(requiredRole: 'couple' | 'vendor' | 'admin') {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [directRole, setDirectRole] = useState<'couple' | 'vendor' | 'admin' | null>(null)
  const [checkingRole, setCheckingRole] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      if (loading) return
      if (!user) {
        window.location.href = '/login'
        return
      }
      
      // If role from AuthContext is null but user exists, fetch directly from Firestore
      if (!role && user) {
        setCheckingRole(true)
        try {
          console.log('Fetching role directly from Firestore for user:', user.uid)
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          const userData = userDoc.data()
          const fetchedRole = userData?.role
          console.log('Direct role fetch result:', fetchedRole)
          setDirectRole(fetchedRole)
        } catch (error) {
          console.error('Error fetching role directly:', error)
          setDirectRole(null)
        } finally {
          setCheckingRole(false)
        }
      }
    }

    checkRole()
  }, [user, role, loading])

  useEffect(() => {
    if (loading || checkingRole) return
    
    const currentRole = role || directRole
    
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    if (currentRole !== requiredRole) {
      // Add 2 second timeout before redirecting to give Firebase time to load
      setTimeout(() => {
        if (currentRole) {
          window.location.href = '/dashboard/' + currentRole
        } else {
          window.location.href = '/login?error=no-role'
        }
      }, 2000)
      return
    }
  }, [user, role, directRole, requiredRole, loading, checkingRole])

  return { user, role: role || directRole, loading: loading || checkingRole }
}
