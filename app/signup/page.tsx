'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUpWithEmail } from '../../lib/auth'
import { createUser } from '../../lib/firestore'
import { testFirebaseConnection, checkEnvironmentVariables } from '../../lib/firebase-test'
import { User } from '../../types'
import { Loader2, Users, Store, Eye, EyeOff, Check, X } from 'lucide-react'
import { colors, typography, getStyles } from '../../lib/styles'

const passwordRequirements = {
  minLength: (password: string) => password.length >= 8,
  hasUppercase: (password: string) => /[A-Z]/.test(password),
  hasLowercase: (password: string) => /[a-z]/.test(password),
  hasNumber: (password: string) => /\d/.test(password),
  hasSpecialChar: (password: string) => /[!@#$%^&*]/.test(password)
}

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  const requirements = Object.values(passwordRequirements)
  const metRequirements = requirements.filter(req => req(password)).length
  
  if (metRequirements <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (metRequirements === 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
  if (metRequirements === 3) return { score: 3, label: 'Strong', color: 'bg-yellow-500' }
  if (metRequirements === 4) return { score: 4, label: 'Very Strong', color: 'bg-green-500' }
  return { score: 5, label: 'Excellent', color: 'bg-green-600' }
}

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/\d/, 'Password must contain at least 1 number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least 1 special character (!@#$%^&*)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  role: z.enum(['couple', 'vendor'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'couple' | 'vendor' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Test Firebase connection on component mount
  useState(() => {
    console.log('🧪 Running Firebase connection test...')
    const envCheck = checkEnvironmentVariables()
    const connectionTest = testFirebaseConnection()
    
    if (!envCheck) {
      console.error('❌ Environment variables check failed')
      setError('Firebase configuration error. Please check environment variables.')
    } else if (!connectionTest) {
      console.error('❌ Firebase connection test failed')
      setError('Firebase connection error. Please check your configuration.')
    } else {
      console.log('✅ Firebase connection test passed')
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  const role = watch('role')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  
  const passwordStrength = password ? getPasswordStrength(password) : null
  const isPasswordWeak = Boolean(passwordStrength ? passwordStrength.score <= 2 : false)
  
  const requirements = [
    { label: 'At least 8 characters', met: passwordRequirements.minLength(password || '') },
    { label: 'At least 1 uppercase letter', met: passwordRequirements.hasUppercase(password || '') },
    { label: 'At least 1 lowercase letter', met: passwordRequirements.hasLowercase(password || '') },
    { label: 'At least 1 number', met: passwordRequirements.hasNumber(password || '') },
    { label: 'At least 1 special character (!@#$%^&*)', met: passwordRequirements.hasSpecialChar(password || '') }
  ]

  const handleRoleSelect = (role: 'couple' | 'vendor') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  const onSubmit = useCallback(async (data: SignupFormData) => {
    if (isPasswordWeak) {
      setError('Please choose a stronger password')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 Starting signup process...', { email: data.email, role: data.role })
      
      // Create Firebase user
      console.log('📧 Creating Firebase user...')
      const firebaseUser = await signUpWithEmail(data.email, data.password)
      console.log('✅ Firebase user created successfully:', firebaseUser.uid)
      
      // Create user document in Firestore
      console.log('📝 Creating Firestore user document...')
      await createUser(firebaseUser.uid, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role
      })
      console.log('✅ Firestore user document created')

      // Redirect based on role using full page reload
      console.log('?? Redirecting to dashboard...')
      if (data.role === 'couple') {
        window.location.href = '/dashboard/couple'
      } else {
        window.location.href = '/dashboard/vendor'
      }
    } catch (err) {
      console.error('❌ Signup error:', err)
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        type: typeof err
      })
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }, [isPasswordWeak, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: colors.bg }}>
      <div style={{ maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: colors.white, padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '32px', marginBottom: '8px' }}>Join Kunda</h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: 400 }}>Start planning your perfect wedding</p>
        </div>

        {!selectedRole ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center', color: colors.textPrimary }}>I am a...</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                onClick={() => handleRoleSelect('couple')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', border: '2px solid #e5e7eb', borderRadius: '12px', transition: 'all 0.2s ease', backgroundColor: colors.white, cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary
                  e.currentTarget.style.backgroundColor = colors.primaryLight + '20'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.backgroundColor = colors.white
                }}
              >
                <Users style={{ width: '48px', height: '48px', color: colors.primary, marginBottom: '12px' }} />
                <span style={{ fontWeight: 600, color: colors.textPrimary }}>Couple</span>
                <span style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>Planning our wedding</span>
              </button>
              <button
                onClick={() => handleRoleSelect('vendor')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', border: '2px solid #e5e7eb', borderRadius: '12px', transition: 'all 0.2s ease', backgroundColor: colors.white, cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.success
                  e.currentTarget.style.backgroundColor = colors.successBg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.backgroundColor = colors.white
                }}
              >
                <Store style={{ width: '48px', height: '48px', color: colors.success, marginBottom: '12px' }} />
                <span style={{ fontWeight: 600, color: colors.textPrimary }}>Vendor</span>
                <span style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>Offering wedding services</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <input type="hidden" {...register('role')} />
            
            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
                placeholder="John Doe"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.name && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.name.message}</p>
              )}
            </div>

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
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
                placeholder="+1234567890"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.phone && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary, cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
                >
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.password.message}</p>
              )}
              
              {/* Password Strength Indicator */}
              {password && passwordStrength && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>Password Strength</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 
                      passwordStrength.score <= 2 ? colors.danger :
                      passwordStrength.score === 3 ? colors.warning :
                      colors.success
                    }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '50px', height: '8px' }}>
                    <div
                      style={{ height: '8px', borderRadius: '50px', transition: 'all 0.3s ease', backgroundColor: 
                        passwordStrength.score <= 2 ? colors.danger :
                        passwordStrength.score === 3 ? colors.warning :
                        colors.success,
                        width: `${(passwordStrength.score / 5) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Requirements Checklist */}
              {password && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {requirements.map((req, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                      {req.met ? (
                        <Check style={{ width: '12px', height: '12px', color: colors.success, marginRight: '8px' }} />
                      ) : (
                        <X style={{ width: '12px', height: '12px', color: colors.danger, marginRight: '8px' }} />
                      )}
                      <span style={{ color: req.met ? colors.success : colors.textSecondary }}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary, cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>{errors.confirmPassword.message}</p>
              )}
              {confirmPassword && password !== confirmPassword && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: colors.danger }}>Passwords don't match</p>
              )}
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: colors.danger }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isPasswordWeak}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', backgroundColor: colors.primary, color: colors.white, borderRadius: '8px', fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'Urbanist', cursor: (isLoading || isPasswordWeak) ? 'not-allowed' : 'pointer', opacity: (isLoading || isPasswordWeak) ? 0.5 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
              onMouseEnter={(e) => {
                if (!isLoading && !isPasswordWeak) {
                  e.currentTarget.style.backgroundColor = colors.primaryDark
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !isPasswordWeak) {
                  e.currentTarget.style.backgroundColor = colors.primary
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              style={{ width: '100%', padding: '12px 16px', color: colors.textSecondary, transition: 'color 0.2s ease', fontFamily: 'Urbanist', fontSize: '14px', fontWeight: 500, cursor: 'pointer', backgroundColor: 'transparent', border: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              Back to role selection
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: colors.primary, fontWeight: 600, textDecoration: 'none' }}
               onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryDark}
               onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
