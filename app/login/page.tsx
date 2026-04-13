'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmail } from '../../lib/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Loader2 } from 'lucide-react'
import { colors, typography, getStyles } from '../../lib/styles'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      // a. Sign in with Firebase Auth using signInWithEmail(email, password)
      const firebaseUser = await signInWithEmail(data.email, data.password)
      
      // b. Get the Firebase Auth UID
      const uid = firebaseUser.uid
      
      // c. Fetch Firestore document directly inside the login page using getDoc()
      const userDoc = await getDoc(doc(db, 'users', uid))
      const userData = userDoc.data()
      const role = userData?.role
      
      // d. Redirect based on role
      if (role === 'admin') {
        window.location.href = '/dashboard/admin'
      } else if (role === 'vendor') {
        window.location.href = '/dashboard/vendor'
      } else if (role === 'couple') {
        window.location.href = '/dashboard/couple'
      } else {
        console.error('No role found for user:', uid)
        window.location.href = '/login?error=no-role'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: colors.bg }}>
      <div style={{ maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '32px', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: 400 }}>Sign in to your Kunda account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
              placeholder="john@example.com"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border
                e.target.style.boxShadow = 'none'
              }}
            />
            {errors.email && (
              <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
              placeholder="••••••••"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border
                e.target.style.boxShadow = 'none'
              }}
            />
            {errors.password && (
              <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: colors.danger }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', backgroundColor: colors.primary, color: colors.white, borderRadius: '8px', fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'Urbanist', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primaryDark
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primary
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: colors.primary, fontWeight: 600, textDecoration: 'none' }}
               onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryDark}
               onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}>
              Sign up
            </a>
          </p>
          <a href="/forgot-password" style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}
             onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryDark}
             onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}>
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  )
}
