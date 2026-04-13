'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { colors, typography } from '../../lib/styles'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSuccess(true)
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection')
          break
        default:
          setError('Failed to send reset email. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <div style={{ maxWidth: '448px', width: '100%', margin: '0 16px' }}>
        <div style={{ borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '32px', backgroundColor: colors.bgCard }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: colors.primaryLight }}>
              <Mail style={{ width: '32px', height: '32px', color: colors.primary }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: colors.textPrimary, fontFamily: 'Urbanist' }}>Reset Your Password</h1>
            <p style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: 400 }}>
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: colors.success }} />
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary, fontFamily: 'Urbanist' }}>Check Your Email</h2>
              <p style={{ marginBottom: '24px', color: colors.textSecondary, fontSize: '14px' }}>
                We've sent a password reset link to {email}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '24px', color: colors.textMuted }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                style={{ fontWeight: 600, fontFamily: 'Urbanist', cursor: 'pointer', color: colors.primary, backgroundColor: 'transparent', border: 'none', fontSize: '14px' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Try Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Email Input */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', backgroundColor: colors.dangerBg, border: `1px solid ${colors.danger}30` }}>
                  <AlertCircle style={{ width: '16px', height: '16px', marginRight: '8px', color: colors.danger }} />
                  <p style={{ fontSize: '14px', color: colors.danger }}>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', color: colors.white, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', fontSize: '14px', fontWeight: 600, backgroundColor: colors.primary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.opacity = '0.8'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to Login */}
              <div style={{ textAlign: 'center' }}>
                <a
                  href="/login"
                  style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 600, fontFamily: 'Urbanist', cursor: 'pointer', color: colors.primary, textDecoration: 'none', fontSize: '14px' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Back to Login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
