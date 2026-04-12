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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-md w-full mx-4">
        <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: colors.bgCard }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primaryLight }}>
              <Mail className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary, fontFamily: 'Urbanist' }}>Reset Your Password</h1>
            <p className="" style={{ color: colors.textSecondary }}>
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: colors.success }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary, fontFamily: 'Urbanist' }}>Check Your Email</h2>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                We've sent a password reset link to {email}
              </p>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="font-medium hover:opacity-80" style={{ color: colors.primary }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2" style={{ borderColor: colors.border }}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger }}>
                  <AlertCircle className="w-4 h-4 mr-2" style={{ color: colors.danger }} />
                  <p className="text-sm" style={{ color: colors.danger }}>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white rounded-lg transition-colors font-medium hover:opacity-80"
                style={{ backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center">
                <a
                  href="/login"
                  className="inline-flex items-center font-medium hover:opacity-80" style={{ color: colors.primary }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
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
