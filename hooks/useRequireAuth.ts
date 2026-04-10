'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useRequireAuth(requiredRole: 'couple' | 'vendor' | 'admin') {
  const { user, loading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    // Fetch role directly from Firestore using the user UID
    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          const fetchedRole = data?.role
          console.log('useRequireAuth - fetched role:', fetchedRole)
          setRole(fetchedRole)
          
          // Only redirect if role does not match
          if (fetchedRole && fetchedRole !== requiredRole) {
            console.log('Wrong dashboard, redirecting to:', '/dashboard/' + fetchedRole)
            window.location.href = '/dashboard/' + fetchedRole
          }
        } else {
          console.error('No user document found for:', user.uid)
          window.location.href = '/login?error=no-profile'
        }
      } catch (error) {
        console.error('Error in useRequireAuth:', error)
      } finally {
        setRoleLoading(false)
      }
    }

    fetchRole()
  }, [user, loading, requiredRole])

  return { user, role, loading: loading || roleLoading }
}
