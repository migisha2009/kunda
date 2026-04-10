'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGuestByToken, getWedding } from '@/lib/firestore'
import { Guest, Wedding } from '@/types'

export default function GuestAuthPage({ params }: { params: { token: string } }) {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [confirmName, setConfirmName] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadGuest = async () => {
      try {
        const guestData = await getGuestByToken(params.token)
        if (!guestData) {
          setError('Invalid invitation link. Please check your email and try again.')
          return
        }

        const weddingData = await getWedding(guestData.weddingId)
        setGuest(guestData)
        setWedding(weddingData)
        setConfirmName(guestData.name)
        setConfirmEmail(guestData.email)
      } catch (err) {
        setError('Failed to load invitation. Please try again later.')
        console.error('Error loading guest:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGuest()
  }, [params.token])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!guest || !wedding) return

    if (confirmName.trim() !== guest.name.trim()) {
      setError('Name does not match our records. Please check and try again.')
      return
    }

    if (confirmEmail.trim().toLowerCase() !== guest.email.trim().toLowerCase()) {
      setError('Email does not match our records. Please check and try again.')
      return
    }

    setVerifying(true)
    setError('')

    try {
      // Store guest ID in localStorage
      localStorage.setItem('kunda-guest-id', guest.id)
      
      // Redirect to guest dashboard
      router.push('/guest/dashboard')
    } catch (err) {
      setError('Failed to verify. Please try again.')
      console.error('Error verifying guest:', err)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a5c30] mx-auto mb-4"></div>
          <p className="text-[#3a2a1a] font-jost">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !guest) {
    return (
      <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#3a2a1a] mb-2 font-cormorant">Invalid Invitation</h1>
            <p className="text-[#3a2a1a] opacity-75 mb-6">{error}</p>
            <p className="text-sm text-[#3a2a1a] opacity-60">
              Please contact the couple if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#7a5c30] mb-2 font-cormorant">
            You're Invited!
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-[#7a5c30] to-[#b08850] mx-auto mb-4"></div>
        </div>

        {guest && wedding && (
          <div className="mb-8 text-center">
            <p className="text-lg text-[#3a2a1a] mb-2 font-jost">
              Welcome <span className="font-semibold">{guest.name}</span>
            </p>
            <p className="text-[#3a2a1a] opacity-80 italic font-cormorant">
              You have been invited to<br />
              {wedding.coupleName1 && wedding.coupleName2 ? (
                <span className="text-xl font-semibold">
                  {wedding.coupleName1} & {wedding.coupleName2}'s Wedding
                </span>
              ) : (
                <span className="text-xl font-semibold">
                  A Special Wedding Celebration
                </span>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#3a2a1a] mb-2 font-jost">
              Please confirm your full name
            </label>
            <input
              type="text"
              id="name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-4 py-3 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#3a2a1a] mb-2 font-jost">
              Please confirm your email address
            </label>
            <input
              type="email"
              id="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
              placeholder="Enter your email address"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-jost">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-gradient-to-r from-[#7a5c30] to-[#b08850] text-white py-3 px-6 rounded-lg font-jost font-medium hover:from-[#6a4c20] hover:to-[#a07840] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Continue to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#3a2a1a] opacity-60 font-jost">
            This information helps us ensure you have the best experience at the wedding.
          </p>
        </div>
      </div>
    </div>
  )
}
