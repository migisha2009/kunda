'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { getBookingsByCouple, updateBookingStatus } from '../../../../lib/firestore'
import { Booking } from '../../../../types'
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Calendar, DollarSign, X, Loader2, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react'

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  
  // Firestore Timestamp object
  if (timestamp?.toDate) {
    return timestamp.toDate().toLocaleDateString(
      'en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      }
    )
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // String or number timestamp
  try {
    return new Date(timestamp).toLocaleDateString(
      'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    )
  } catch {
    return 'Unknown'
  }
}

interface BookingWithVendor extends Booking {
  vendorName?: string
  vendorCategory?: string
}

export default function CoupleBookingsPage() {
  const { user, userProfile } = useAuth()
  const [bookings, setBookings] = useState<BookingWithVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    
    // Set up timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Booking data loading timeout - setting loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout
    
    // Set up real-time listener for bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('coupleId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
      // Clear timeout since we got data
      clearTimeout(timeoutId)
      
      const bookingsData: BookingWithVendor[] = []
      
      // If no bookings, immediately set loading to false
      if (snapshot.empty) {
        console.log('📋 No bookings found for couple:', user.uid)
        setBookings([])
        setLoading(false)
        return
      }
      
      for (const bookingDoc of snapshot.docs) {
        const bookingData = {
          id: bookingDoc.id,
          ...bookingDoc.data()
        } as BookingWithVendor

        // Convert Timestamp to Date
        if (bookingData.createdAt instanceof Date) {
          bookingData.createdAt = bookingData.createdAt
        } else {
          bookingData.createdAt = new Date(bookingData.createdAt as any)
        }

        // Fetch vendor details
        try {
          const vendorDoc = await getDoc(doc(db, 'vendors', bookingData.vendorId))
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data() as any
            if (vendorData) {
              bookingData.vendorName = vendorData.businessName
              bookingData.vendorCategory = vendorData.category
            }
          }
        } catch (error) {
          console.error('Error fetching vendor details:', error)
        }

        bookingsData.push(bookingData)
      }

      console.log('📋 Bookings loaded:', bookingsData.length)
      setBookings(bookingsData)
      setLoading(false)
    })

    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [user])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(bookingId)
    try {
      await updateBookingStatus(bookingId, 'cancelled')
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setCancelling(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <Ban className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your wedding vendor bookings</p>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Bookings</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Booking #{booking.id.slice(-6)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Vendor</p>
                          <p className="font-medium text-gray-900">{booking.vendorName || 'Loading...'}</p>
                          <p className="text-xs text-gray-500">{booking.vendorCategory || 'Service'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">{formatDate(booking.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {booking.currency} {booking.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Booked on {formatDate(booking.createdAt)}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelling === booking.id}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {cancelling === booking.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel Booking
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-8 h-8 mx-auto mb-4" style={{ color: '#b4a090' }} />
                <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'Jost', color: '#9a7850' }}>No bookings yet</h3>
                <p className="mb-6" style={{ fontFamily: 'Jost', fontSize: '12px', color: '#b4a090' }}>
                  Browse vendors and send enquiries to get started
                </p>
                <a
                  href="/vendors"
                  className="inline-flex items-center px-6 py-3 font-medium rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#7a5c30', 
                    color: '#fdf9f5',
                    fontFamily: 'Jost'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a4a25'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#7a5c30'
                  }}
                >
                  Browse Vendors
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
