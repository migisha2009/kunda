'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { db } from '../../../lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { MessageSquare, Calendar, DollarSign, Star, Store, MapPin, TrendingUp, LogOut, Edit, AlertCircle } from 'lucide-react'

// Type definitions
interface Vendor {
  id: string
  userId: string
  businessName?: string
  category?: string
  bio?: string
  location?: string
  portfolioImages?: string[]
  pricing?: {
    min: number
    max: number
    currency?: string
  }
  rating?: number
  reviewCount?: number
  verified?: boolean
}

interface Enquiry {
  id: string
  vendorId: string
  coupleId: string
  message: string
  status: 'pending' | 'replied' | 'closed'
  createdAt: Date
}

interface Booking {
  id: string
  vendorId: string
  amount: number
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  createdAt: Date
}

export default function VendorDashboard() {
  const { loading: authLoading } = useRequireAuth('vendor')
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    profileCompletion: 0,
    averageRating: 0,
    reviewCount: 0
  })
  const [recentEnquiries, setRecentEnquiries] = useState<(Enquiry & { 
    coupleName?: string; 
    coupleEmail?: string;
  })[]>([])
  const [vendorData, setVendorData] = useState<Vendor | null>(null)

  useEffect(() => {
    if (!user || !userProfile) return

    const loadData = async () => {
      try {
        // Get vendor data
        const vendorsQuery = query(
          collection(db, 'vendors'),
          where('userId', '==', user.uid)
        )
        const vendorsSnapshot = await getDocs(vendorsQuery)
        let vendor: Vendor | null = null
        
        if (!vendorsSnapshot.empty) {
          vendor = {
            id: vendorsSnapshot.docs[0].id,
            ...vendorsSnapshot.docs[0].data()
          } as Vendor
          setVendorData(vendor)

          // Calculate profile completion
          const completion = calculateProfileCompletion(vendor)
          setStats(prev => ({ ...prev, profileCompletion: completion }))
        }

        // Load stats
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', user.uid)
        )
        const enquiriesSnapshot = await getDocs(enquiriesQuery)
        const totalEnquiries = enquiriesSnapshot.size

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', user.uid)
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[]

        const confirmedBookings = bookings.filter(b => 
          b.status === 'confirmed' || b.status === 'paid'
        ).length

        const totalRevenue = bookings
          .filter(b => b.status === 'paid')
          .reduce((sum, b) => sum + (b.amount || 0), 0)

        setStats(prev => ({
          ...prev,
          totalEnquiries,
          confirmedBookings,
          totalRevenue,
          averageRating: vendor?.rating || 0,
          reviewCount: vendor?.reviewCount || 0
        }))

        // Fetch recent enquiries
        const recentEnquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        
        const recentSnapshot = await getDocs(recentEnquiriesQuery)
        const enquiriesData = await Promise.all(
          recentSnapshot.docs.map(async (enquiryDoc) => {
            const enquiryData = {
              id: enquiryDoc.id,
              ...enquiryDoc.data()
            } as Enquiry

            // Convert Timestamp to Date
            if (enquiryData.createdAt instanceof Date) {
              enquiryData.createdAt = enquiryData.createdAt
            } else {
              enquiryData.createdAt = new Date(enquiryData.createdAt as any)
            }

            // Fetch couple details
            let coupleName = 'Unknown'
            let coupleEmail = 'Unknown'
            try {
              const coupleDoc = await getDoc(doc(db, 'users', enquiryData.coupleId))
              if (coupleDoc.exists()) {
                const coupleData = coupleDoc.data() as any
                coupleName = coupleData.name
                coupleEmail = coupleData.email
              }
            } catch (error) {
              console.error('Error fetching couple details:', error)
            }

            return {
              ...enquiryData,
              coupleName,
              coupleEmail
            }
          })
        )

        setRecentEnquiries(enquiriesData)
      } catch (error) {
        console.error('Error loading vendor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  const calculateProfileCompletion = (vendor: Vendor): number => {
    let completion = 0
    
    if (vendor.businessName) completion += 20
    if (vendor.category) completion += 20
    if (vendor.bio) completion += 15
    if (vendor.location) completion += 15
    if (vendor.portfolioImages && vendor.portfolioImages.length > 0) completion += 15
    if (vendor.pricing && vendor.pricing.min > 0) completion += 15
    
    return completion
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}d ago`
    }
  }

  const getMissingFields = (): string[] => {
    if (!vendorData) return []
    
    const missing = []
    if (!vendorData.businessName) missing.push('business name')
    if (!vendorData.category) missing.push('category')
    if (!vendorData.bio) missing.push('bio')
    if (!vendorData.location) missing.push('location')
    if (!vendorData.portfolioImages || vendorData.portfolioImages.length === 0) missing.push('portfolio images')
    if (!vendorData.pricing || vendorData.pricing.min === 0) missing.push('pricing')
    
    return missing
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayName = vendorData?.businessName || userProfile.name
  const missingFields = getMissingFields()

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
              color: '#7a5c30',
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
              color: '#9a7850',
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
              {(vendorData?.businessName || userProfile.name).charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#7a5c30'
          }}>
            {vendorData?.businessName || userProfile.name}
          </span>
          <button
            onClick={() => {
              // signOutUser() - will need to implement this
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

      {/* HERO SECTION */}
      <div style={{ padding: '32px 32px 20px', backgroundColor: '#fdf9f5' }}>
        <div className="text-xs uppercase tracking-wider" style={{ color: '#b08850', fontFamily: 'Jost', fontWeight: 400 }}>
          Vendor Dashboard
        </div>
        <h1 
          className="text-4xl font-light mt-2 mb-3" 
          style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a', fontWeight: 300 }}
        >
          {vendorData?.businessName || userProfile.name}
        </h1>
        <p className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
          {vendorData?.category ? `${vendorData.category} — ${vendorData.location || 'Location not set'}` : 'Complete your profile to start receiving enquiries'}
        </p>
      </div>

      {/* PROFILE COMPLETION BANNER */}
      {stats.profileCompletion < 100 && (
        <div 
          className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            background: '#faf0e0', 
            border: '0.5px solid rgba(180,140,90,0.3)', 
            padding: '14px 20px',
            margin: '0 32px 20px'
          }}
          onClick={() => window.location.href = '/dashboard/vendor/profile'}
        >
          <div>
            <div className="text-xs uppercase" style={{ color: '#9a7850', fontFamily: 'Jost' }}>
              Profile Completion
            </div>
            <div className="text-sm mt-1" style={{ color: '#7a5c30', fontFamily: 'Jost' }}>
              Add {missingFields.join(', ')} to attract more couples
            </div>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-1" style={{ background: '#f0e4d0' }}>
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${stats.profileCompletion}%`, 
                  background: '#b08850' 
                }}
              ></div>
            </div>
          </div>
          <div 
            className="text-2xl font-light" 
            style={{ fontFamily: 'Cormorant Garamond', color: '#b08850' }}
          >
            {stats.profileCompletion}%
          </div>
        </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-4 gap-3 px-8 mb-5">
        {/* Total Enquiries */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
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
            {stats.totalEnquiries}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Jost', color: '#b08850' }}>
            this week
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
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
            Confirmed Bookings
          </div>
          <div className="text-4xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '32px'
          }}>
            {stats.confirmedBookings}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Jost', color: '#b08850' }}>
            upcoming
          </div>
        </div>

        {/* Total Revenue */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
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
            Total Revenue
          </div>
          <div className="text-4xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '32px'
          }}>
            ${stats.totalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Avg Rating */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
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
            Avg Rating
          </div>
          <div className="text-4xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '32px'
          }}>
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Jost', color: '#b08850' }}>
            {stats.reviewCount > 0 ? `${stats.reviewCount} reviews` : 'No reviews yet'}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-4 px-8 pb-8">
        {/* LEFT COLUMN - Recent Enquiries */}
        <div className="col-span-8">
          <div 
            className="p-5"
            style={{ backgroundColor: '#fdf9f5', border: '0.5px solid rgba(180,140,90,0.15)' }}
          >
            <h2 className="text-lg font-medium mb-4" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
              Recent Enquiries
            </h2>
            
            {recentEnquiries.length > 0 ? (
              <div className="space-y-3">
                {recentEnquiries.map((enquiry) => (
                  <div 
                    key={enquiry.id}
                    className="flex items-start justify-between p-3"
                    style={{ backgroundColor: '#fdf9f5', border: '0.5px solid rgba(180,140,90,0.15)' }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                        {enquiry.coupleName}
                      </div>
                      <div className="text-xs mt-1" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                        {enquiry.message.substring(0, 65)}{enquiry.message.length > 65 ? '...' : ''}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs mb-1" style={{ fontFamily: 'Jost', color: '#b4a090' }}>
                        {formatTimeAgo(enquiry.createdAt)}
                      </div>
                      <div 
                        className="text-xs px-2 py-1"
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare size={32} style={{ color: '#b4a090' }} className="mx-auto mb-3" />
                <div className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  No enquiries yet
                </div>
                <div className="text-xs mt-1" style={{ fontFamily: 'Jost', color: '#b4a090' }}>
                  Your enquiries from couples will appear here
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Business Profile */}
        <div className="col-span-4">
          <div 
            className="p-5"
            style={{ backgroundColor: '#fdf9f5', border: '0.5px solid rgba(180,140,90,0.15)' }}
          >
            <h2 className="text-lg font-medium mb-4" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
              Business Profile
            </h2>
            
            <div className="space-y-3">
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: '0.5px solid #b08850' }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Category
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                  {vendorData?.category || '—'}
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: '0.5px solid #b08850' }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Location
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                  {vendorData?.location || '—'}
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: '0.5px solid #b08850' }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Price Range
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                  {vendorData?.pricing && vendorData.pricing.min > 0 
                    ? `$${vendorData.pricing.min.toLocaleString()} — $${vendorData.pricing.max?.toLocaleString() || 'TBD'}`
                    : '—'
                  }
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: '0.5px solid #b08850' }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Status
                </span>
                <div 
                  className="text-xs px-2 py-1 uppercase"
                  style={{
                    fontFamily: 'Jost',
                    background: vendorData?.verified ? '#e8f5e0' : '#faeeda',
                    color: vendorData?.verified ? '#3b6d11' : '#633806',
                    border: vendorData?.verified ? '0.5px solid #c0dd97' : '0.5px solid #fac775',
                    padding: '3px 10px',
                    fontSize: '10px'
                  }}
                >
                  {vendorData?.verified ? 'Verified' : 'Unverified'}
                </div>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: '0.5px solid #b08850' }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Portfolio
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                  {vendorData?.portfolioImages?.length || 0} images
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center"
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                  Rating
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a', fontWeight: 500 }}>
                  {stats.averageRating > 0 
                    ? `${stats.averageRating.toFixed(1)} (${stats.reviewCount} reviews)`
                    : 'No reviews yet'
                  }
                </span>
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = '/dashboard/vendor/profile'}
              className="w-full mt-5 text-xs uppercase font-medium transition-colors"
              style={{ 
                background: '#7a5c30', 
                color: '#fdf9f5', 
                padding: '11px',
                fontFamily: 'Jost',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
