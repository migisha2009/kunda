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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '32px' }}>Join Kunda</h1>
          <p className="text-gray-600">Start planning your perfect wedding</p>
        </div>

        {!selectedRole ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-800">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect('couple')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Users className="w-12 h-12 text-blue-600 mb-3" />
                <span className="font-medium text-gray-900">Couple</span>
                <span className="text-sm text-gray-500 mt-1">Planning our wedding</span>
              </button>
              <button
                onClick={() => handleRoleSelect('vendor')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <Store className="w-12 h-12 text-green-600 mb-3" />
                <span className="font-medium text-gray-900">Vendor</span>
                <span className="text-sm text-gray-500 mt-1">Offering wedding services</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('role')} />
            
            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {/* Password Strength Indicator */}
              {password && passwordStrength && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score === 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Requirements Checklist */}
              {password && (
                <div className="mt-3 space-y-1">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-500 mr-2" />
                      ) : (
                        <X className="w-3 h-3 text-red-500 mr-2" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
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
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords don't match</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isPasswordWeak}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em' }}
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
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to role selection
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
