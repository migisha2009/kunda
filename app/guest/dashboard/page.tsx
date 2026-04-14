'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGuest, getWedding, updateGuestRSVP } from '@/lib/firestore'
import { Guest, Wedding } from '@/types'
import { formatDate } from '@/lib/dateUtils'
import { colors, typography, fontSizes, fontWeights } from '@/lib/styles'

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function GuestDashboard() {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [updatingRSVP, setUpdatingRSVP] = useState(false)
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [dietaryPreference, setDietaryPreference] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadGuestData = async () => {
      const guestId = localStorage.getItem('kunda-guest-id')
      if (!guestId) {
        router.push('/login')
        return
      }

      try {
        const guestData = await getGuest(guestId)
        if (!guestData) {
          setError('Guest information not found.')
          return
        }

        const weddingData = guestData.weddingId ? await getWedding(guestData.weddingId) : null
        setGuest(guestData)
        setWedding(weddingData)
        setDietaryPreference(guestData.dietaryPreferences || '')
      } catch (err) {
        setError('Failed to load your information. Please try again.')
        console.error('Error loading guest data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGuestData()
  }, [router])

  useEffect(() => {
    if (!wedding?.date) return

    const calculateCountdown = () => {
      const now = new Date().getTime()
      const weddingTime = new Date(wedding.date).getTime()
      const difference = weddingTime - now

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      }
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)
    return () => clearInterval(interval)
  }, [wedding?.date])

  const handleRSVPUpdate = async (status: Guest['rsvpStatus']) => {
    if (!guest) return

    setUpdatingRSVP(true)
    setError('')

    try {
      await updateGuestRSVP(guest.id, status, dietaryPreference)
      setGuest({ ...guest, rsvpStatus: status, dietaryPreferences: dietaryPreference })
    } catch (err) {
      setError('Failed to update RSVP. Please try again.')
      console.error('Error updating RSVP:', err)
    } finally {
      setUpdatingRSVP(false)
    }
  }

  const getRSVPBadgeColor = (status: Guest['rsvpStatus']) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-blue-100 text-blue-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  const getDirectionsUrl = () => {
    if (!wedding?.venue) return '#'
    return `https://maps.google.com/?q=${encodeURIComponent(wedding.venue)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-accent)' }}></div>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'var(--color-heading)' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !guest || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="rounded-2xl shadow-xl p-8 max-w-md w-full mx-4" style={{ backgroundColor: 'var(--color-card)' }}>
          <div className="text-center">
            <p className="mb-4" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-family-body)' }}>{error || 'Something went wrong'}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--color-accent)', color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="rounded-2xl shadow-lg p-8 mb-6" style={{ backgroundColor: 'var(--color-card)' }}>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>
              Welcome, {guest.name}
            </h1>
            <p className="text-xl mb-4 italic" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
              {wedding.coupleName1 && wedding.coupleName2 ? (
                `${wedding.coupleName1} & ${wedding.coupleName2}'s Wedding`
              ) : (
                'A Special Wedding Celebration'
              )}
            </p>
            
            {/* Countdown Timer */}
            <div className="rounded-xl p-6 text-white" style={{ background: 'var(--gradient-hero)' }}>
              <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-family-body)' }}>Countdown to the Wedding</p>
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{countdown.days}</div>
                  <div className="text-xs" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{countdown.hours}</div>
                  <div className="text-xs" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{countdown.minutes}</div>
                  <div className="text-xs" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{countdown.seconds}</div>
                  <div className="text-xs" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* RSVP Card */}
          <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--color-card)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>RSVP Status</h2>
            
            <div className="mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium`} style={{ 
                fontFamily: 'var(--font-family-body)',
                backgroundColor: guest.rsvpStatus === 'attending' ? 'rgba(76, 175, 80, 0.2)' : 
                                 guest.rsvpStatus === 'declined' ? 'rgba(231, 76, 60, 0.2)' :
                                 guest.rsvpStatus === 'maybe' ? 'rgba(52, 152, 219, 0.2)' :
                                 'rgba(245, 166, 35, 0.2)',
                color: guest.rsvpStatus === 'attending' ? 'var(--color-success)' : 
                       guest.rsvpStatus === 'declined' ? 'var(--color-danger)' :
                       guest.rsvpStatus === 'maybe' ? '#3498db' :
                       'var(--color-accent)'
              }}>
                {guest.rsvpStatus.charAt(0).toUpperCase() + guest.rsvpStatus.slice(1)}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRSVPUpdate('attending')}
                disabled={updatingRSVP}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-success)', color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>
                &#x2713; Attending
              </button>
              <button
                onClick={() => handleRSVPUpdate('declined')}
                disabled={updatingRSVP}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-danger)', color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>
                &#x2717; Can't Make It
              </button>
              <button
                onClick={() => handleRSVPUpdate('maybe')}
                disabled={updatingRSVP}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: '#3498db', color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>
                ? Maybe
              </button>
            </div>

            {guest.rsvpStatus === 'attending' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
                  Dietary Preferences
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  onBlur={() => handleRSVPUpdate(guest.rsvpStatus)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent" style={{ fontFamily: 'var(--font-family-body)', borderColor: 'var(--color-border)', backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--color-heading)' }}
                >
                  <option value="">Select dietary preference</option>
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="gluten-free">Gluten-free</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>

          {/* Wedding Details Card */}
          <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--color-card)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>Wedding Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Date</p>
                <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
                  {formatDate(wedding.date)}
                </p>
              </div>

              {wedding.ceremonyTime && (
                <div>
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Ceremony Time</p>
                  <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{wedding.ceremonyTime}</p>
                </div>
              )}

              {wedding.receptionTime && (
                <div>
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Reception Time</p>
                  <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{wedding.receptionTime}</p>
                </div>
              )}

              <div>
                <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Venue</p>
                <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{wedding.venue}</p>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-white px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-family-body)' }}
                >
                  Get Directions
                </a>
              </div>

              {wedding.dresscode && (
                <div>
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Dress Code</p>
                  <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{wedding.dresscode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Card */}
          {wedding.scheduleItems && wedding.scheduleItems.length > 0 && (
            <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--color-card)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>Schedule</h2>
              <div className="space-y-4">
                {wedding.scheduleItems.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full mt-1" style={{ backgroundColor: 'var(--color-accent)' }}></div>
                    <div className="ml-4 flex-grow">
                      <p className="font-semibold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{item.time}</p>
                      <p className="opacity-80" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message from the Couple Card */}
          {wedding.messageToGuests && (
            <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--color-card)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>Message from the Couple</h2>
              <p className="italic text-lg leading-relaxed" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                {wedding.messageToGuests}
              </p>
            </div>
          )}

          {/* Table Assignment Card */}
          <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--color-card)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>Table Assignment</h2>
            {guest.tableNumber ? (
              <div className="text-center py-4">
                <div className="inline-block text-white px-8 py-4 rounded-xl" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <p className="text-sm" style={{ fontFamily: 'var(--font-family-body)' }}>Your Table</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Table {guest.tableNumber}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="opacity-75" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                  Your table will be announced soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
