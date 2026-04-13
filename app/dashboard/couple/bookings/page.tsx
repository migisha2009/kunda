'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, collection, query, getDocs, deleteDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Calendar, DollarSign, CheckCircle, Clock, AlertCircle, 
  X, Phone, Mail, MapPin, Trash2, ExternalLink
} from 'lucide-react'
import { Wedding, Booking, Vendor } from '../../../../types'
import { colors } from '../../../../lib/styles'

const statusColors = {
  pending: colors.warning,
  confirmed: colors.success,
  paid: colors.primary,
  cancelled: colors.danger
}

export default function MyBookings() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vendors, setVendors] = useState<Record<string, Vendor>>({})
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load wedding data
      const weddingDoc = doc(db, 'weddings', user.uid)
      const weddingSnapshot = await getDoc(weddingDoc)
      if (weddingSnapshot.exists()) {
        setWedding(weddingSnapshot.data() as Wedding)
      }

      // Load bookings
      const bookingsQuery = query(collection(db, 'weddings', user.uid, 'bookings'))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Booking[]
      setBookings(bookingsData)

      // Load vendors for booking details
      const vendorsQuery = query(collection(db, 'vendors'))
      const vendorsSnapshot = await getDocs(vendorsQuery)
      const vendorsData = vendorsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Vendor
        return acc
      }, {} as Record<string, Vendor>)
      setVendors(vendorsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    if (!wedding) return
    
    try {
      // Update booking status to cancelled
      const updatedBookings = bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' as const } : booking
      )
      
      await updateDoc(doc(db, 'weddings', user!.uid, 'bookings', bookingId), { 
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason
      })
      
      setBookings(updatedBookings)
      setShowCancelModal(false)
      setSelectedBooking(null)
      
      alert('Booking cancelled successfully')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Error cancelling booking. Please try again.')
    }
  }

  const handleViewVendor = (vendorId: string) => {
    const vendor = vendors[vendorId]
    if (vendor) {
      // Open vendor profile or website
      if (vendor.contact?.website) {
        window.open(vendor.contact.website, '_blank')
      }
    }
  }

  const getBookingStats = () => {
    const total = bookings.length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const paid = bookings.filter(b => b.status === 'paid').length
    const totalSpent = bookings
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0)
    
    return { total, confirmed, paid, totalSpent }
  }

  const stats = getBookingStats()

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: colors.bg, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f0e4d0',
          borderTop: `3px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f0f4ff', color: '#111928', minHeight: '100vh', fontFamily: 'Urbanist, sans-serif' }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5edff',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontFamily: 'Urbanist',
              fontSize: '36px',
              fontWeight: 800,
              color: '#0f2460',
              marginBottom: '8px'
            }}>My Bookings</h1>
            <p style={{
              fontFamily: 'Urbanist',
              fontSize: '15px',
              color: '#6b7280',
              fontWeight: 400
            }}>
              Manage your vendor bookings and payments
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.total}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Total Bookings</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.confirmed}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Confirmed</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.paid}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Paid</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{wedding?.budget.currency} {stats.totalSpent.toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Total Spent</div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div style={{ padding: '32px' }}>
        {bookings.length === 0 ? (
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              color: colors.textMuted,
              marginBottom: '16px'
            }}> <Calendar size={48} /> </div>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '20px',
              color: colors.textPrimary,
              marginBottom: '8px'
            }}>No bookings yet</h3>
            <p style={{
              fontFamily: 'Urbanist',
              fontSize: '14px',
              color: colors.textMuted
            }}>
              Start booking vendors for your wedding to see them here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((booking) => {
              const vendor = vendors[booking.vendorId]
              
              return (
                <div key={booking.id} style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: statusColors[booking.status],
                          borderRadius: '50%'
                        }}></div>
                        <div>
                          <h3 style={{
                            fontFamily: 'Urbanist',
                            fontSize: '20px',
                            fontWeight: 300,
                            color: colors.textPrimary,
                            marginBottom: '4px'
                          }}>
                            {vendor?.name || 'Unknown Vendor'}
                          </h3>
                          <div style={{
                            fontSize: '12px',
                            color: colors.textMuted,
                            textTransform: 'capitalize'
                          }}>
                            {vendor?.category || 'Service'}
                          </div>
                        </div>
                      </div>
                      
                      {booking.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.textMuted }}>
                          <Calendar size={14} />
                          <span style={{ fontSize: '12px' }}>
                            Booked on {formatDate(booking.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'end',
                      gap: '4px'
                    }}>
                      <div style={{
                        fontFamily: 'Urbanist',
                        fontSize: '24px',
                        fontWeight: 300,
                        color: colors.textPrimary
                      }}>
                        {wedding?.budget.currency} {booking.amount.toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${statusColors[booking.status]}15`,
                        color: statusColors[booking.status]
                      }}>
                        {booking.status}
                      </div>
                    </div>
                  </div>

                  {/* Vendor Contact Info */}
                  {vendor && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      {vendor.contact?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color={colors.textMuted} />
                          <span style={{ fontSize: '12px', color: colors.textMuted }}>
                            {vendor.contact.phone}
                          </span>
                        </div>
                      )}
                      
                      {vendor.contact?.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} color={colors.textMuted} />
                          <span style={{ fontSize: '12px', color: colors.textMuted }}>
                            {vendor.contact.email}
                          </span>
                        </div>
                      )}
                      
                      {vendor.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color={colors.textMuted} />
                          <span style={{ fontSize: '12px', color: colors.textMuted }}>
                            {vendor.location}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Booking Details */}
                  {booking.paymentRef && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        marginBottom: '4px'
                      }}>Payment Reference</div>
                      <div style={{
                        fontFamily: 'Urbanist',
                        fontSize: '14px',
                        color: colors.textPrimary,
                        padding: '8px 12px',
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`
                      }}>
                        {booking.paymentRef}
                      </div>
                    </div>
                  )}

                  {/* Booking Status Timeline */}
                  <div style={{ 
                    borderTop: '1px solid #e5edff', 
                    paddingTop: '16px', 
                    marginTop: '16px' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      position: 'relative',
                      marginBottom: '8px'
                    }}>
                      {/* Timeline Line */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '20px',
                        right: '20px',
                        height: '2px',
                        backgroundColor: '#e5edff',
                        zIndex: 1
                      }}></div>
                      
                      {/* Timeline Steps */}
                      {['pending', 'confirmed', 'paid'].map((step, index) => {
                        const isCompleted = 
                          step === 'pending' || 
                          (step === 'confirmed' && (booking.status === 'confirmed' || booking.status === 'paid')) ||
                          (step === 'paid' && booking.status === 'paid')
                        
                        const isCurrent = 
                          (step === 'pending' && booking.status === 'pending') ||
                          (step === 'confirmed' && booking.status === 'confirmed') ||
                          (step === 'paid' && booking.status === 'paid')
                        
                        const stepLabels = {
                          pending: 'Pending',
                          confirmed: 'Confirmed', 
                          paid: 'Paid'
                        }
                        
                        return (
                          <div key={step} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 2,
                            flex: 1
                          }}>
                            {/* Circle */}
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? '#1a56db' : '#e5edff',
                              border: isCompleted ? 'none' : '2px solid #e5edff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px',
                              position: 'relative'
                            }}>
                              {isCompleted && (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: '#ffffff',
                                  clipPath: 'polygon(0% 50%, 30% 80%, 100% 10%, 80% 0%, 30% 60%)'
                                }}></div>
                              )}
                              {isCurrent && (
                                <div style={{
                                  position: 'absolute',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(26, 86, 219, 0.2)',
                                  animation: 'pulse 2s infinite'
                                }}></div>
                              )}
                            </div>
                            
                            {/* Label */}
                            <span style={{
                              fontFamily: 'Urbanist',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isCompleted ? '#1a56db' : '#6b7280',
                              textTransform: 'uppercase'
                            }}>
                              {stepLabels[step as keyof typeof stepLabels]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Add pulse animation */}
                    <style jsx>{`
                      @keyframes pulse {
                        0% {
                          transform: scale(0.95);
                          box-shadow: 0 0 0 0 rgba(26, 86, 219, 0.7);
                        }
                        70% {
                          transform: scale(1);
                          box-shadow: 0 0 0 10px rgba(26, 86, 219, 0);
                        }
                        100% {
                          transform: scale(0.95);
                          box-shadow: 0 0 0 0 rgba(26, 86, 219, 0);
                        }
                      }
                    `}</style>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewVendor(booking.vendorId)}
                        style={{
                          border: `1px solid ${colors.primary}`,
                          color: colors.primaryDark,
                          padding: '8px 16px',
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ExternalLink size={14} />
                        View Vendor
                      </button>
                      
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowCancelModal(true)
                          }}
                          style={{
                            border: '0.5px solid #dc2626',
                            color: '#dc2626',
                            padding: '8px 16px',
                            fontFamily: 'Urbanist',
                            fontSize: '11px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            backgroundColor: 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                    
                    {booking.status === 'paid' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} color="#16a34a" />
                        <span style={{
                          fontSize: '12px',
                          color: '#16a34a',
                          fontWeight: 500
                        }}>Paid</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Urbanist',
                fontSize: '20px',
                color: colors.textPrimary
              }}>Cancel Booking</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={colors.textMuted} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontFamily: 'Urbanist',
                fontSize: '14px',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>
                Are you sure you want to cancel your booking with <strong>{vendors[selectedBooking.vendorId]?.name}</strong>?
              </p>
              <p style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                color: colors.textMuted,
                marginBottom: '16px'
              }}>
                This action cannot be undone. Please provide a reason for cancellation.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Urbanist',
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '4px'
                }}>Reason for cancellation</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCancelBooking(selectedBooking.id, e.target.value)
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: colors.textPrimary
                  }}
                >
                  <option value="">Select a reason...</option>
                  <option value="changed_mind">Changed my mind</option>
                  <option value="found_better_vendor">Found a better vendor</option>
                  <option value="budget_constraints">Budget constraints</option>
                  <option value="date_conflict">Date conflict</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    border: `1px solid ${colors.primary}`,
                    color: colors.primaryDark,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id, 'User requested cancellation')}
                  style={{
                    backgroundColor: colors.danger,
                    color: 'white',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
