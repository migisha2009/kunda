'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthChange } from '../lib/auth'
import { getUser } from '../lib/firestore'
import { User } from '../types'

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  userProfile: User | null
  role: 'couple' | 'vendor' | 'admin' | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid)
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          const profile = await getUser(firebaseUser.uid)
          console.log('User profile:', profile)
          setUserProfile(profile)
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const role = userProfile?.role || null
  console.log('Role set in context:', role)

  const value: AuthContextType = {
    user,
    loading,
    userProfile,
    role
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
