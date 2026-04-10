'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { getVendorByUserId } from '../../../../lib/firestore'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Enquiry } from '../../../../types'
import { MessageSquare, Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react'

export default function VendorBookingsPage() {
  const { user } = useAuth()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadVendorAndEnquiries()
    }
  }, [user])

  const loadVendorAndEnquiries = async () => {
    if (!user) return

    try {
      // Get vendor profile
      const vendorData = await getVendorByUserId(user.uid)
      setVendor(vendorData)

      if (vendorData) {
        // Set up real-time listener for enquiries
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorData.id),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(enquiriesQuery, (snapshot) => {
          const enquiriesData: Enquiry[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            enquiriesData.push({
              id: doc.id,
              vendorId: data.vendorId,
              coupleId: data.coupleId,
              message: data.message,
              status: data.status,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
            })
          })
          setEnquiries(enquiriesData)
        })

        return unsubscribe
      }
    } catch (error) {
      console.error('Error loading vendor and enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEnquiryStatus = async (enquiryId: string, status: 'replied' | 'closed') => {
    try {
      const enquiryRef = doc(db, 'enquiries', enquiryId)
      await updateDoc(enquiryRef, { status })
    } catch (error) {
      console.error('Error updating enquiry status:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'replied':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'replied':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
      {/* KUNDA NAVBAR */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: '#ffffff',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)'
      }}>
        {/* Left - Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            border: '1.5px solid #b08850',
            marginRight: '12px'
          }}></div>
          <span style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: '#7a5c30',
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center - Navigation */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <a 
            href="/dashboard/vendor" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Overview
          </a>
          <a 
            href="/dashboard/vendor/profile" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Profile
          </a>
          <a 
            href="/dashboard/vendor/bookings" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#7a5c30',
              textDecoration: 'none'
            }}
          >
            Bookings
          </a>
        </div>

        {/* Right - User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f0e4d0',
            border: '1px solid #b08850',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: '#7a5c30',
              fontSize: '13px',
              fontFamily: 'Jost',
              fontWeight: 500
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#7a5c30'
          }}>
            {user?.email}
          </span>
          <button
            onClick={() => {
              window.location.href = '/login'
            }}
            style={{
              border: '0.5px solid #b08850',
              color: '#b08850',
              background: 'transparent',
              padding: '6px 14px',
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Page Title */}
      <div style={{ padding: '48px 32px 32px' }}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ 
          color: '#b08850', 
          fontFamily: 'Jost', 
          fontWeight: 400,
          letterSpacing: '0.15em'
        }}>
          Enquiries & Bookings
        </div>
        <h1 
          className="text-4xl font-light mb-3" 
          style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a', 
            fontWeight: 300,
            fontSize: '32px'
          }}
        >
          Manage Your Enquiries
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* Pending Enquiries */}
          <div 
            className="border"
            style={{ 
              backgroundColor: '#ffffff', 
              borderColor: 'rgba(180,140,90,0.2)', 
              padding: '16px 18px'
            }}
          >
            <div className="text-xs uppercase mb-2" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Pending Enquiries
            </div>
            <div className="text-4xl font-light mb-1" style={{ 
              fontFamily: 'Cormorant Garamond', 
              color: '#3a2a1a',
              fontWeight: 300,
              fontSize: '32px'
            }}>
              {enquiries.filter(e => e.status === 'pending').length}
            </div>
          </div>

          {/* Replied */}
          <div 
            className="border"
            style={{ 
              backgroundColor: '#ffffff', 
              borderColor: 'rgba(180,140,90,0.2)', 
              padding: '16px 18px'
            }}
          >
            <div className="text-xs uppercase mb-2" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Replied
            </div>
            <div className="text-4xl font-light mb-1" style={{ 
              fontFamily: 'Cormorant Garamond', 
              color: '#3a2a1a',
              fontWeight: 300,
              fontSize: '32px'
            }}>
              {enquiries.filter(e => e.status === 'replied').length}
            </div>
          </div>

          {/* Total Enquiries */}
          <div 
            className="border"
            style={{ 
              backgroundColor: '#ffffff', 
              borderColor: 'rgba(180,140,90,0.2)', 
              padding: '16px 18px'
            }}
          >
            <div className="text-xs uppercase mb-2" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Total Enquiries
            </div>
            <div className="text-4xl font-light mb-1" style={{ 
              fontFamily: 'Cormorant Garamond', 
              color: '#3a2a1a',
              fontWeight: 300,
              fontSize: '32px'
            }}>
              {enquiries.length}
            </div>
          </div>
        </div>

        {/* Enquiries List */}
          <div 
            style={{
              backgroundColor: '#ffffff',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '24px'
            }}
          >
            <h2 
              className="text-lg font-medium mb-4" 
              style={{ 
                fontFamily: 'Cormorant Garamond', 
                color: '#3a2a1a', 
                fontWeight: 400,
                fontSize: '18px',
                borderBottom: '0.5px solid rgba(180,140,90,0.15)',
                paddingBottom: '12px',
                marginBottom: '20px'
              }}
            >
              Recent Enquiries
            </h2>
          
            {enquiries.length > 0 ? (
              <div className="space-y-3">
                {enquiries.map((enquiry) => (
                  <div 
                    key={enquiry.id}
                    className="flex items-start justify-between p-4"
                    style={{
                      backgroundColor: '#fdf9f5',
                      border: '0.5px solid rgba(180,140,90,0.15)'
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="text-xs px-2 py-1 uppercase"
                            style={{
                              fontFamily: 'Jost',
                              ...(enquiry.status === 'pending' && {
                                background: '#faeeda',
                                color: '#633806',
                                border: '0.5px solid #fac775'
                              }),
                              ...(enquiry.status === 'replied' && {
                                background: '#e8f5e0',
                                color: '#3b6d11',
                                border: '0.5px solid #c0dd97'
                              }),
                              ...(enquiry.status === 'closed' && {
                                background: '#f0efef',
                                color: '#5f5e5a'
                              })
                            }}
                          >
                            {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                          </div>
                          <div className="flex items-center text-xs" style={{ fontFamily: 'Jost', color: '#b4a090' }}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(enquiry.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p style={{ fontFamily: 'Jost', color: '#3a2a1a', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                          Couple ID: {enquiry.coupleId}
                        </p>
                        <p style={{ fontFamily: 'Jost', color: '#9a7850', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                          {enquiry.message}
                        </p>
                      </div>
                    </div>
                    
                    {enquiry.status === 'pending' && (
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => updateEnquiryStatus(enquiry.id, 'replied')}
                          style={{
                            padding: '8px 16px',
                            fontFamily: 'Jost',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            background: '#e8f5e0',
                            color: '#3b6d11',
                            border: '0.5px solid #c0dd97',
                            cursor: 'pointer'
                          }}
                        >
                          Mark as Replied
                        </button>
                        <button
                          onClick={() => updateEnquiryStatus(enquiry.id, 'closed')}
                          style={{
                            padding: '8px 16px',
                            fontFamily: 'Jost',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            background: '#faeeda',
                            color: '#633806',
                            border: '0.5px solid #fac775',
                            cursor: 'pointer'
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare size={48} style={{ color: '#b4a090' }} className="mx-auto mb-4" />
                <h3 
                  className="text-xl font-light mb-3" 
                  style={{ 
                    fontFamily: 'Cormorant Garamond', 
                    color: '#9a7850', 
                    fontWeight: 300,
                    fontSize: '20px'
                  }}
                >
                  No enquiries yet
                </h3>
                <p style={{ fontFamily: 'Jost', color: '#b4a090', fontSize: '13px' }}>
                  When couples send you enquiries, they'll appear here
                </p>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}
