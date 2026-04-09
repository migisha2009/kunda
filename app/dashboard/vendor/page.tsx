'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { Vendor, Booking, Enquiry } from '../../../types'
import { Store, Star, MessageSquare, Calendar, DollarSign, TrendingUp, User as UserIcon, AlertTriangle, Loader2, Clock, CheckCircle } from 'lucide-react'

export default function VendorDashboard() {
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
        if (!vendorsSnapshot.empty) {
          const vendor = {
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
          .reduce((sum, b) => sum + b.amount, 0)

        setStats(prev => ({
          ...prev,
          totalEnquiries,
          confirmedBookings,
          totalRevenue,
          averageRating: vendorData?.rating || 0,
          reviewCount: vendorData?.reviewCount || 0
        }))

        // Set up real-time listener for recent enquiries
        const recentEnquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', user.uid),
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
        })

        return unsubscribe
      } catch (error) {
        console.error('Error loading vendor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  const calculateProfileCompletion = (vendor: Vendor): number => {
    const fields = [
      vendor.businessName,
      vendor.category,
      vendor.bio,
      vendor.location,
      vendor.portfolioImages && vendor.portfolioImages.length > 0,
      vendor.pricing && (vendor.pricing.min > 0 || vendor.pricing.max > 0)
    ]

    const completedFields = fields.filter(field => field && field !== '').length
    return Math.round((completedFields / fields.length) * 100)
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} day${days !== 1 ? 's' : ''} ago`
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.name}! 🎉
          </h1>
          <p className="text-gray-600">Manage your wedding business and connect with couples</p>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 mt-4">
            <a
              href="/dashboard/vendor/profile"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Store className="w-4 h-4 mr-2" />
              Edit Profile
            </a>
            <a
              href="/dashboard/vendor/bookings"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              My Bookings
            </a>
            <a
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Account Settings
            </a>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {stats.profileCompletion < 80 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Complete Your Profile</h3>
                <p className="text-yellow-700 text-sm">
                  Your profile is {stats.profileCompletion}% complete. A complete profile helps couples find and trust your business. 
                  <a href="/dashboard/vendor/profile" className="underline font-medium hover:text-yellow-800">
                    Complete your profile now
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enquiries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnquiries}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profile Completion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.profileCompletion}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Enquiries */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                Recent Enquiries
              </h2>
              <div className="space-y-4">
                {recentEnquiries.length > 0 ? (
                  recentEnquiries.map((enquiry) => (
                    <div key={enquiry.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{enquiry.coupleName}</p>
                          <p className="text-xs text-gray-500">{enquiry.coupleEmail}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            enquiry.status === 'replied' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {enquiry.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(enquiry.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{enquiry.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No enquiries yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Enquiries */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Enquiries</h2>
              <div className="space-y-4">
                {[
                  { couple: 'Emily & James', message: 'Looking for wedding photography for August 2024', time: '2 hours ago', status: 'pending' },
                  { couple: 'Sophie & Mark', message: 'Interested in your premium package', time: '5 hours ago', status: 'replied' },
                  { couple: 'Rachel & Tom', message: 'Do you have availability for September?', time: '1 day ago', status: 'pending' },
                ].map((enquiry, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900">{enquiry.couple}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enquiry.status === 'replied' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {enquiry.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{enquiry.message}</p>
                    <p className="text-xs text-gray-500">{enquiry.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Profile</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Store className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium text-gray-900">{vendorData?.businessName || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-medium text-gray-900">
                      {stats.averageRating} ({stats.reviewCount} reviews)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Price Range</p>
                    <p className="font-medium text-gray-900">
                      {vendorData?.pricing 
                        ? `${vendorData.pricing.currency} ${vendorData.pricing.min.toLocaleString()} - ${vendorData.pricing.max.toLocaleString()}`
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <a
                href="/dashboard/vendor/profile"
                className="w-full mt-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                Edit Profile
              </a>
            </div>

            {/* Performance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Completion</span>
                  <span className={`font-medium ${
                    stats.profileCompletion >= 80 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {stats.profileCompletion}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-medium text-green-600">
                    {stats.totalEnquiries > 0 
                      ? Math.round((stats.confirmedBookings / stats.totalEnquiries) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Revenue per Booking</span>
                  <span className="font-medium text-gray-900">
                    ${stats.confirmedBookings > 0 
                      ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString()
                      : '0'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
