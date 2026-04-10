'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGuest, getWedding, updateGuestRSVP } from '@/lib/firestore'
import { Guest, Wedding } from '@/types'

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
      <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a5c30] mx-auto mb-4"></div>
          <p className="text-[#3a2a1a] font-jost">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !guest || !wedding) {
    return (
      <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4 font-jost">{error || 'Something went wrong'}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#7a5c30] text-white px-6 py-2 rounded-lg font-jost hover:bg-[#6a4c20] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf9f5]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#7a5c30] mb-2 font-cormorant">
              Welcome, {guest.name}
            </h1>
            <p className="text-xl text-[#3a2a1a] mb-4 font-cormorant italic">
              {wedding.coupleName1 && wedding.coupleName2 ? (
                `${wedding.coupleName1} & ${wedding.coupleName2}'s Wedding`
              ) : (
                'A Special Wedding Celebration'
              )}
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-gradient-to-r from-[#7a5c30] to-[#b08850] rounded-xl p-6 text-white">
              <p className="text-sm mb-2 font-jost">Countdown to the Wedding</p>
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{countdown.days}</div>
                  <div className="text-xs font-jost">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{countdown.hours}</div>
                  <div className="text-xs font-jost">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{countdown.minutes}</div>
                  <div className="text-xs font-jost">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{countdown.seconds}</div>
                  <div className="text-xs font-jost">Seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* RSVP Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#7a5c30] mb-4 font-cormorant">RSVP Status</h2>
            
            <div className="mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium font-jost ${getRSVPBadgeColor(guest.rsvpStatus)}`}>
                {guest.rsvpStatus.charAt(0).toUpperCase() + guest.rsvpStatus.slice(1)}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRSVPUpdate('attending')}
                disabled={updatingRSVP}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-jost hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                ✓ Attending
              </button>
              <button
                onClick={() => handleRSVPUpdate('declined')}
                disabled={updatingRSVP}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-jost hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                ✗ Can't Make It
              </button>
              <button
                onClick={() => handleRSVPUpdate('maybe')}
                disabled={updatingRSVP}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-jost hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                ? Maybe
              </button>
            </div>

            {guest.rsvpStatus === 'attending' && (
              <div>
                <label className="block text-sm font-medium text-[#3a2a1a] mb-2 font-jost">
                  Dietary Preferences
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  onBlur={() => handleRSVPUpdate(guest.rsvpStatus)}
                  className="w-full px-4 py-2 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
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
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#7a5c30] mb-4 font-cormorant">Wedding Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#3a2a1a] opacity-75 font-jost">Date</p>
                <p className="text-lg font-semibold text-[#3a2a1a] font-jost">
                  {new Date(wedding.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {wedding.ceremonyTime && (
                <div>
                  <p className="text-sm text-[#3a2a1a] opacity-75 font-jost">Ceremony Time</p>
                  <p className="text-lg font-semibold text-[#3a2a1a] font-jost">{wedding.ceremonyTime}</p>
                </div>
              )}

              {wedding.receptionTime && (
                <div>
                  <p className="text-sm text-[#3a2a1a] opacity-75 font-jost">Reception Time</p>
                  <p className="text-lg font-semibold text-[#3a2a1a] font-jost">{wedding.receptionTime}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-[#3a2a1a] opacity-75 font-jost">Venue</p>
                <p className="text-lg font-semibold text-[#3a2a1a] font-jost">{wedding.venue}</p>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-[#7a5c30] text-white px-4 py-2 rounded-lg text-sm font-jost hover:bg-[#6a4c20] transition-colors"
                >
                  Get Directions
                </a>
              </div>

              {wedding.dresscode && (
                <div>
                  <p className="text-sm text-[#3a2a1a] opacity-75 font-jost">Dress Code</p>
                  <p className="text-lg font-semibold text-[#3a2a1a] font-jost">{wedding.dresscode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Card */}
          {wedding.scheduleItems && wedding.scheduleItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#7a5c30] mb-4 font-cormorant">Schedule</h2>
              <div className="space-y-4">
                {wedding.scheduleItems.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-4 h-4 bg-[#b08850] rounded-full mt-1"></div>
                    <div className="ml-4 flex-grow">
                      <p className="font-semibold text-[#3a2a1a] font-jost">{item.time}</p>
                      <p className="text-[#3a2a1a] opacity-80 font-jost">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message from the Couple Card */}
          {wedding.messageToGuests && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#7a5c30] mb-4 font-cormorant">Message from the Couple</h2>
              <p className="text-[#3a2a1a] italic font-cormorant text-lg leading-relaxed">
                {wedding.messageToGuests}
              </p>
            </div>
          )}

          {/* Table Assignment Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#7a5c30] mb-4 font-cormorant">Table Assignment</h2>
            {guest.tableNumber ? (
              <div className="text-center py-4">
                <div className="inline-block bg-[#7a5c30] text-white px-8 py-4 rounded-xl">
                  <p className="text-sm font-jost">Your Table</p>
                  <p className="text-3xl font-bold">Table {guest.tableNumber}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#3a2a1a] opacity-75 font-jost">
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
