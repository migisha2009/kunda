'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUpWithEmail } from '../../lib/auth'
import { createUser } from '../../lib/firestore'
import { setRoleCookie } from '../../lib/cookies'
import { User } from '../../types'
import { Loader2, Users, Store } from 'lucide-react'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  role: z.enum(['couple', 'vendor'])
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'couple' | 'vendor' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

  const handleRoleSelect = (role: 'couple' | 'vendor') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      // Create Firebase user
      const firebaseUser = await signUpWithEmail(data.email, data.password)
      
      // Create user document in Firestore
      await createUser(firebaseUser.uid, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role
      })

      // Set role cookie for middleware
      setRoleCookie(data.role)

      // Redirect based on role
      if (data.role === 'couple') {
        router.push('/dashboard/couple')
      } else {
        router.push('/dashboard/vendor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Kunda</h1>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
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
