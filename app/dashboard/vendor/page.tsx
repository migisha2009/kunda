'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { db } from '../../../lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { MessageSquare, Calendar, DollarSign, Star, Store, MapPin, TrendingUp, LogOut, Edit, AlertCircle, Eye, Users, CheckCircle, Bell, ExternalLink, Clock } from 'lucide-react'

// Color variables
const primary = '#1a56db'
const primaryDark = '#1e429f'
const primaryLight = '#ebf5ff'
const accent = '#3f83f8'
const bg = '#f0f4ff'
const textPrimary = '#111928'
const textSecondary = '#6b7280'
const textMuted = '#9ca3af'
const muted = textSecondary // For backward compatibility
const border = '#e5edff'
const sidebarBg = '#1e3a8a'
const sidebarText = '#bfdbfe'
const success = '#057a55'
const successBg = '#def7ec'
const warning = '#c27803'
const warningBg = '#fdf6b2'
const danger = '#c81e1e'
const dangerBg = '#fde8e8'

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
  date?: Date
  coupleName?: string
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
    reviewCount: 0,
    profileViews: 0,
    conversionRate: 0,
    thisWeekEnquiries: 0,
    upcomingBookings: 0
  })
  const [recentEnquiries, setRecentEnquiries] = useState<(Enquiry & { 
    coupleName?: string; 
    coupleEmail?: string;
    unread?: boolean;
  })[]>([])
  const [vendorData, setVendorData] = useState<Vendor | null>(null)
  const [nextBooking, setNextBooking] = useState<any>(null)
  const [todayDate, setTodayDate] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || !userProfile) return

    // Set today's date
    const today = new Date()
    setTodayDate(today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))

    const loadData = async () => {
      try {
        // Get vendor data
        const vendorsQuery = query(
          collection(db, 'vendors'),
          where('userId', '==', user.uid)
        )
        const vendorsSnapshot = await getDocs(vendorsQuery)
        let vendor: Vendor | null = null
        let vendorId = user.uid
        
        if (!vendorsSnapshot.empty) {
          vendor = {
            id: vendorsSnapshot.docs[0].id,
            ...vendorsSnapshot.docs[0].data()
          } as Vendor
          vendorId = vendorsSnapshot.docs[0].id
          setVendorData(vendor)

          // Calculate profile completion
          const completion = calculateProfileCompletion(vendor)
          setStats(prev => ({ ...prev, profileCompletion: completion }))
        }

        // Load stats
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorId)
        )
        const enquiriesSnapshot = await getDocs(enquiriesQuery)
        const totalEnquiries = enquiriesSnapshot.size

        // Calculate this week's enquiries
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const thisWeekEnquiries = enquiriesSnapshot.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
          return createdAt >= oneWeekAgo
        }).length

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', vendorId)
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[]

        const confirmedBookings = bookings.filter(b => 
          b.status === 'confirmed' || b.status === 'paid'
        ).length

        const upcomingBookings = bookings.filter(b => 
          b.status === 'confirmed' || b.status === 'paid'
        ).filter(b => {
          const bookingDate = b.date || b.createdAt
          return bookingDate >= today
        }).length

        const totalRevenue = bookings
          .filter(b => b.status === 'paid')
          .reduce((sum, b) => sum + (b.amount || 0), 0)

        // Find next upcoming booking
        const upcoming = bookings
          .filter(b => b.status === 'confirmed' || b.status === 'paid')
          .filter(b => {
            const bookingDate = b.date || b.createdAt
            return bookingDate >= today
          })
          .sort((a, b) => {
            const dateA = a.date || a.createdAt
            const dateB = b.date || b.createdAt
            return dateA.getTime() - dateB.getTime()
          })
        
        if (upcoming.length > 0) {
          setNextBooking(upcoming[0])
        }

        const conversionRate = totalEnquiries > 0 ? (confirmedBookings / totalEnquiries) * 100 : 0

        setStats(prev => ({
          ...prev,
          totalEnquiries,
          confirmedBookings,
          totalRevenue,
          averageRating: vendor?.rating || 0,
          reviewCount: vendor?.reviewCount || 0,
          profileViews: Math.floor(Math.random() * 500) + 100, // Mock data
          conversionRate,
          thisWeekEnquiries,
          upcomingBookings
        }))

        // Set up real-time listener for recent enquiries
        const recentEnquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        
        const unsubscribe = onSnapshot(recentEnquiriesQuery, async (snapshot) => {
          const enquiriesData = await Promise.all(
            snapshot.docs.map(async (enquiryDoc) => {
              const enquiryData = {
                id: enquiryDoc.id,
                ...enquiryDoc.data()
              } as Enquiry

              // Convert Timestamp to Date using formatDate helper
              if (enquiryData.createdAt && 
                  typeof (enquiryData.createdAt as any)?.toDate === 'function') {
                enquiryData.createdAt = (enquiryData.createdAt as any).toDate()
              } else if (enquiryData.createdAt && 
                         !(enquiryData.createdAt instanceof Date)) {
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
                coupleEmail,
                unread: enquiryData.status === 'pending' // Mark pending as unread
              }
            })
          )

          setRecentEnquiries(enquiriesData)
          setUnreadCount(enquiriesData.filter(e => e.unread).length)
        })

        return unsubscribe
      } catch (error) {
        console.error('Error loading vendor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => {
      // Cleanup handled inside loadData
    }
  }, [user, userProfile])

  const calculateProfileCompletion = (vendor: Vendor): number => {
    let completion = 0
    
    if (vendor.businessName) completion += 20
    if (vendor.category) completion += 20
    
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#1a56db] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#1a56db] rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayName = vendorData?.businessName || userProfile.name
  const missingFields = getMissingFields()

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      
      {/* KUNDA NAVBAR */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: 'white',
        borderBottom: `1px solid ${border}`
      }}>
        {/* Left - Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            border: `1.5px solid ${primary}`,
            marginRight: '12px'
          }}></div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '20px',
            color: primaryDark,
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center - Navigation */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <a 
            href="/dashboard/vendor" 
            style={{
              fontFamily: 'Urbanist',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: primaryDark,
              textDecoration: 'none'
            }}
          >
            Overview
          </a>
          <a 
            href="/dashboard/vendor/profile" 
            style={{
              fontFamily: 'Urbanist',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: textSecondary,
              textDecoration: 'none'
            }}
          >
            Profile
          </a>
          <a 
            href="/dashboard/vendor/bookings" 
            style={{
              fontFamily: 'Urbanist',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: textSecondary,
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
            background: bg,
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: primaryDark,
              fontSize: '13px',
              fontFamily: 'Urbanist',
              fontWeight: 500
            }}>
              {(vendorData?.businessName || userProfile.name).charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '13px',
            color: primaryDark
          }}>
            {vendorData?.businessName || userProfile.name}
          </span>
          <button
            onClick={() => {
              // signOutUser() - will need to implement this
              window.location.href = '/login'
            }}
            style={{
              border: `0.5px solid ${primary}`,
              color: primary,
              background: 'transparent',
              padding: '6px 14px',
              fontFamily: 'Urbanist',
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
      <div style={{ padding: '32px 32px 20px', backgroundColor: bg }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: primary, fontFamily: 'Urbanist', fontWeight: 400 }}>
              Vendor Dashboard
            </div>
            <div className="flex items-center gap-3 mb-3">
              <h1 
                className="text-4xl font-light" 
                style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 300 }}
              >
                {vendorData?.businessName || userProfile.name}
              </h1>
              {vendorData?.verified && (
                <div 
                  className="flex items-center text-xs px-2 py-1"
                  style={{
                    fontFamily: 'Urbanist',
                    background: '#e8f5e0',
                    color: '#3b6d11',
                    border: '0.5px solid #c0dd97'
                  }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </div>
              )}
            </div>
            <p className="text-sm mb-2" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
              {vendorData?.category ? `${vendorData.category} — ${vendorData.location || 'Location not set'}` : 'Complete your profile to start receiving enquiries'}
            </p>
            <p className="text-xs" style={{ fontFamily: 'Urbanist', color: '#b4a090' }}>
              Welcome back! {todayDate}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <div 
              className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: '#faeeda',
                border: '0.5px solid #fac775',
                padding: '8px 12px'
              }}
              onClick={() => window.location.href = '/dashboard/vendor/bookings'}
            >
              <Bell className="w-4 h-4 mr-2" style={{ color: '#633806' }} />
              <span className="text-xs" style={{ fontFamily: 'Urbanist', color: '#633806' }}>
                {unreadCount} new {unreadCount === 1 ? 'enquiry' : 'enquiries'}
              </span>
            </div>
          )}
        </div>
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
            <div className="text-xs uppercase" style={{ color: textSecondary, fontFamily: 'Urbanist' }}>
              Profile Completion
            </div>
            <div className="text-sm mt-1" style={{ color: primaryDark, fontFamily: 'Urbanist' }}>
              Add {missingFields.join(', ')} to attract more couples
            </div>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-1" style={{ background: '#f0e4d0' }}>
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${stats.profileCompletion}%`, 
                  background: primary 
                }}
              ></div>
            </div>
          </div>
          <div 
            className="text-2xl font-light" 
            style={{ fontFamily: 'Urbanist', color: primary }}
          >
            {stats.profileCompletion}%
          </div>
        </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-5 gap-3 px-8 mb-5">
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
            fontFamily: 'Urbanist', 
            letterSpacing: '0.15em',
            color: textSecondary 
          }}>
            Total Enquiries
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Urbanist', 
            color: textPrimary,
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {stats.totalEnquiries}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Urbanist', color: primary }}>
            {stats.thisWeekEnquiries} this week
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
            fontFamily: 'Urbanist', 
            letterSpacing: '0.15em',
            color: textSecondary 
          }}>
            Confirmed Bookings
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Urbanist', 
            color: textPrimary,
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {stats.confirmedBookings}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Urbanist', color: primary }}>
            {stats.upcomingBookings} upcoming
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
            fontFamily: 'Urbanist', 
            letterSpacing: '0.15em',
            color: textSecondary 
          }}>
            Total Revenue
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Urbanist', 
            color: textPrimary,
            fontWeight: 300,
            fontSize: '30px'
          }}>
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Urbanist', color: primary }}>
            from paid bookings
          </div>
        </div>

        {/* Profile Views */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="text-xs uppercase mb-2" style={{ 
            fontFamily: 'Urbanist', 
            letterSpacing: '0.15em',
            color: textSecondary 
          }}>
            Profile Views
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Urbanist', 
            color: textPrimary,
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {stats.profileViews}
          </div>
          <div className="text-xs" style={{ fontFamily: 'Urbanist', color: primary }}>
            this month
          </div>
        </div>

        {/* Conversion Rate */}
        <div 
          className="border cursor-pointer hover:shadow-md transition-shadow"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="text-xs uppercase mb-2" style={{ 
            fontFamily: 'Urbanist', 
            letterSpacing: '0.15em',
            color: textSecondary 
          }}>
            Conversion Rate
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Urbanist', 
            color: textPrimary,
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {stats.conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs" style={{ fontFamily: 'Urbanist', color: primary }}>
            enquiries to bookings
          </div>
        </div>
      </div>

      {/* NEXT BOOKING HIGHLIGHT */}
      {nextBooking && (
        <div className="px-8 mb-6">
          <div 
            className="p-4"
            style={{
              background: '#e8f5e0',
              border: '0.5px solid #c0dd97',
              borderLeft: '4px solid #3b6d11'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase mb-1" style={{ fontFamily: 'Urbanist', color: '#3b6d11' }}>
                  Next Upcoming Booking
                </div>
                <div className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary }}>
                  {nextBooking.coupleName || 'Client'} • {formatDate(nextBooking.date)}
                </div>
              </div>
              <Clock className="w-5 h-5" style={{ color: '#3b6d11' }} />
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="px-8 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/dashboard/vendor/profile'}
            className="flex items-center text-xs px-4 py-2"
            style={{
              fontFamily: 'Urbanist',
              background: primaryDark,
              color: bg,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/vendor/bookings'}
            className="flex items-center text-xs px-4 py-2"
            style={{
              fontFamily: 'Urbanist',
              background: 'transparent',
              color: primaryDark,
              border: `1px solid ${border}`,
              cursor: 'pointer'
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            My Bookings
          </button>
          <button
            onClick={() => window.location.href = `/vendor/${user?.uid}`}
            className="flex items-center text-xs px-4 py-2"
            style={{
              fontFamily: 'Urbanist',
              background: 'transparent',
              color: primaryDark,
              border: `1px solid ${border}`,
              cursor: 'pointer'
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Profile
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-4 px-8 pb-8">
        {/* LEFT COLUMN - Recent Enquiries */}
        <div className="col-span-8">
          <div 
            className="p-5"
            style={{ backgroundColor: bg, border: '0.5px solid rgba(180,140,90,0.15)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary }}>
                Recent Enquiries
              </h2>
              {unreadCount > 0 && (
                <div 
                  className="text-xs px-2 py-1"
                  style={{
                    fontFamily: 'Urbanist',
                    background: '#faeeda',
                    color: '#633806',
                    border: '0.5px solid #fac775'
                  }}
                >
                  {unreadCount} unread
                </div>
              )}
            </div>
            
            {recentEnquiries.length > 0 ? (
              <div className="space-y-3">
                {recentEnquiries.map((enquiry) => (
                  <div 
                    key={enquiry.id}
                    className={`flex items-start justify-between p-3 cursor-pointer hover:bg-white transition-colors ${
                      enquiry.unread ? 'bg-white' : ''
                    }`}
                    style={{ border: '0.5px solid rgba(180,140,90,0.15)' }}
                    onClick={() => window.location.href = '/dashboard/vendor/bookings'}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
                          {enquiry.coupleName}
                        </div>
                        {enquiry.unread && (
                          <div className="w-2 h-2 rounded-full" style={{ background: primary }}></div>
                        )}
                      </div>
                      <div className="text-xs" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                        {enquiry.message.substring(0, 65)}{enquiry.message.length > 65 ? '...' : ''}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs mb-1" style={{ fontFamily: 'Urbanist', color: '#b4a090' }}>
                        {formatTimeAgo(enquiry.createdAt)}
                      </div>
                      <div 
                        className="text-xs px-2 py-1"
                        style={{
                          fontFamily: 'Urbanist',
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
                <div className="text-sm" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  No enquiries yet
                </div>
                <div className="text-xs mt-1" style={{ fontFamily: 'Urbanist', color: '#b4a090' }}>
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
            style={{ backgroundColor: bg, border: '0.5px solid rgba(180,140,90,0.15)' }}
          >
            <h2 className="text-lg font-medium mb-4" style={{ fontFamily: 'Urbanist', color: textPrimary }}>
              Business Profile
            </h2>
            
            <div className="space-y-3">
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Category
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
                  {vendorData?.category || '—'}
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Location
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
                  {vendorData?.location || '—'}
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Price Range
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
                  {vendorData?.pricing && vendorData.pricing.min > 0 
                    ? `$${vendorData.pricing.min.toLocaleString()} — $${vendorData.pricing.max?.toLocaleString() || 'TBD'}`
                    : '—'
                  }
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Status
                </span>
                <div 
                  className="text-xs px-2 py-1 uppercase"
                  style={{
                    fontFamily: 'Urbanist',
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
                style={{ borderBottom: `1px solid ${border}` }}
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Portfolio
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
                  {vendorData?.portfolioImages?.length || 0} images
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center"
              >
                <span className="text-xs uppercase" style={{ fontFamily: 'Urbanist', color: textSecondary }}>
                  Rating
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Urbanist', color: textPrimary, fontWeight: 500 }}>
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
                background: primaryDark, 
                color: bg, 
                padding: '11px',
                fontFamily: 'Urbanist',
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
