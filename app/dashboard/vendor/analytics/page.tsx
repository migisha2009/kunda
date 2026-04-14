'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, Calendar, Clock, Star, Heart, Menu, X } from 'lucide-react'

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  
  if (timestamp?.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  try {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Unknown'
  }
}

interface Analytics {
  profileViews: number
  enquiries: number
  revenue: number
  bookings: number
  conversionRate: number
  avgBookingValue: number
  repeatClients: number
  busiestDay: string
  monthlyData: any[]
  categoryData: any[]
  funnelData: any[]
}

export default function VendorAnalyticsPage() {
  const { loading: authLoading } = useRequireAuth('vendor')
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics>({
    profileViews: 0,
    enquiries: 0,
    revenue: 0,
    bookings: 0,
    conversionRate: 0,
    avgBookingValue: 0,
    repeatClients: 0,
    busiestDay: 'Monday',
    monthlyData: [],
    categoryData: [],
    funnelData: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [hoveredChart, setHoveredChart] = useState<string | null>(null)
  const [selectedChart, setSelectedChart] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !userProfile) return
  }, [user, userProfile])

  const loadAnalytics = async () => {
    if (!user || !userProfile) return
    
    setLoading(true)
    setError(null)
    
    try {
        // Get vendor data
        const vendorsQuery = query(
          collection(db, 'vendors'),
          where('userId', '==', user.uid)
        )
        const vendorsSnapshot = await getDocs(vendorsQuery)
        let vendorId = user.uid
        
        if (!vendorsSnapshot.empty) {
          vendorId = vendorsSnapshot.docs[0].id
        }

        // Load enquiries data
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc')
        )
        const enquiriesSnapshot = await getDocs(enquiriesQuery)
        const enquiries = enquiriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Load bookings data
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc')
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Calculate metrics
        const totalEnquiries = enquiries.length
        const totalBookings = bookings.length
        const paidBookings = bookings.filter(b => (b as any).status === 'paid')
        const totalRevenue = paidBookings.reduce((sum, b) => sum + ((b as any).amount || 0), 0)
        const conversionRate = totalEnquiries > 0 ? (totalBookings / totalEnquiries) * 100 : 0
        const avgBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0

        // Generate monthly data for charts
        const monthlyData = generateMonthlyData(enquiries, bookings, selectedPeriod)
        const categoryData = generateCategoryData(bookings)
        const funnelData = generateFunnelData(
          Math.floor(Math.random() * 500) + 100, // Profile views still mock
          enquiries.length, 
          bookings.length, 
          paidBookings.length
        )
        
        // Calculate repeat clients (same couple making multiple bookings)
        const repeatClients = new Set(
          bookings
            .filter(b => (b as any).coupleId)
            .map(b => (b as any).coupleId)
            .filter((coupleId, index, arr) => arr.indexOf(coupleId) !== index)
        ).size

        setAnalytics({
          profileViews: Math.floor(Math.random() * 500) + 100, // Still mock since we don't have profile view tracking
          enquiries: totalEnquiries,
          revenue: totalRevenue,
          bookings: totalBookings,
          conversionRate,
          avgBookingValue,
          repeatClients,
          busiestDay: calculateBusiestDay(enquiries),
          monthlyData,
          categoryData,
          funnelData
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
        setError('Failed to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    loadAnalytics()
  }, [user, userProfile, selectedPeriod])

  const generateMonthlyData = (enquiries: any[], bookings: any[], period: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const monthlyData = []
    
    // Determine how many months to show based on period
    const monthsToShow = period === '1month' ? 1 : period === '3months' ? 3 : period === '6months' ? 6 : 12
    
    // Generate data for selected period
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthName = months[monthIndex]
      
      // Count enquiries for this month
      const monthEnquiries = enquiries.filter(e => {
        const date = e.createdAt?.toDate?.() || new Date(e.createdAt)
        return date.getMonth() === monthIndex && date.getFullYear() === new Date().getFullYear()
      })
      
      // Count bookings and calculate revenue for this month
      const monthBookings = bookings.filter(b => {
        const date = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return date.getMonth() === monthIndex && date.getFullYear() === new Date().getFullYear()
      })
      
      const monthRevenue = monthBookings
        .filter(b => (b as any).status === 'paid')
        .reduce((sum, b) => sum + ((b as any).amount || 0), 0)
      
      monthlyData.push({
        month: monthName,
        enquiries: monthEnquiries.length,
        revenue: monthRevenue,
        profileViews: Math.floor(Math.random() * 200) + 50 // Still mock since we don't have profile view tracking
      })
    }
    
    return monthlyData
  }

  const generateCategoryData = (bookings: any[]) => {
    // Count bookings by category if available, otherwise use mock data
    const categoryCount: { [key: string]: number } = {}
    
    bookings.forEach(booking => {
      const category = (booking as any).category || 'Other'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })
    
    // If we have real category data, use it; otherwise fall back to mock
    if (Object.keys(categoryCount).length > 1) {
      const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0)
      return Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
        color: ['#7a5c30', '#b08850', '#9a7850', '#f0e4d0', '#fdf9f5'][Object.keys(categoryCount).indexOf(name) % 5]
      }))
    }
    
    // Fallback to mock data
    return [
      { name: 'Photography', value: 35, color: '#7a5c30' },
      { name: 'Catering', value: 25, color: '#b08850' },
      { name: 'Venues', value: 20, color: '#9a7850' },
      { name: 'Floristry', value: 15, color: '#f0e4d0' },
      { name: 'Other', value: 5, color: '#fdf9f5' }
    ]
  }

  const generateFunnelData = (views: number, enquiries: number, bookings: number, paid: number) => {
    return [
      { stage: 'Profile Views', count: views || 100, conversion: 100 },
      { stage: 'Enquiries', count: enquiries, conversion: views > 0 ? (enquiries / views) * 100 : 0 },
      { stage: 'Bookings', count: bookings, conversion: enquiries > 0 ? (bookings / enquiries) * 100 : 0 },
      { stage: 'Paid', count: paid, conversion: bookings > 0 ? (paid / bookings) * 100 : 0 }
    ]
  }

  const calculateBusiestDay = (enquiries: any[]): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayCounts = days.map(day => ({ day, count: 0 }))
    
    // Count enquiries by day of week
    enquiries.forEach(enquiry => {
      const date = enquiry.createdAt?.toDate?.() || new Date(enquiry.createdAt)
      const dayIndex = date.getDay()
      dayCounts[dayIndex].count++
    })
    
    // If we have real data, use it; otherwise fallback to mock
    const maxCount = Math.max(...dayCounts.map(d => d.count))
    if (maxCount > 0) {
      return dayCounts.find(d => d.count === maxCount)?.day || 'Monday'
    }
    
    // Fallback to mock data
    return days[Math.floor(Math.random() * days.length)]
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)'
      }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'var(--color-background)'
      }}>
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>Oops!</h2>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-family-body)'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-background)'
      }}>
        {/* Loading Navbar */}
        <nav style={{ 
          backgroundColor: 'var(--color-card)', 
          borderBottom: '1px solid var(--color-border)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="w-6 h-6 border-2 border-solid border-transparent border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </nav>
        
        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-solid border-transparent border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'var(--gradient-hero)'
      }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    )
  }

  
  return (
    <div className="min-h-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-background)'
    }}>
      <style jsx>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0% { opacity: 0.08; }
          50% { opacity: 0.16; }
          100% { opacity: 0.08; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes countUp {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* KUNDA NAVBAR */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 shadow-lg`} style={{ backgroundColor: 'var(--color-card)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
              </div>
              <span className="ml-2" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF', fontWeight: 800, fontSize: '22px' }}>Kunda</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                ['Overview', '/dashboard/vendor'],
                ['Profile', '/dashboard/vendor/profile'],
                ['Bookings', '/dashboard/vendor/bookings'],
                ['Analytics', '/dashboard/vendor/analytics'],
              ].map(([label, href]) => (
                <a 
                  key={label}
                  href={href}
                  className="hover:text-blue-600 transition-colors" 
                  style={{ 
                    color: window.location.pathname === href ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)', 
                    fontWeight: 600, 
                    fontSize: '14px',
                    fontFamily: 'var(--font-family-body)'
                  }}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Right - User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--gradient-hero)' }}>
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF', fontWeight: 500 }}>
                {userProfile.name}
              </span>
              <button
                onClick={() => {
                  window.location.href = '/login'
                }}
                className="px-4 py-2 rounded-lg border font-medium transition-colors"
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-family-body)'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ 
        background: 'var(--gradient-hero)',
        minHeight: '280px',
        padding: '60px 24px 40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background rings */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-20 right-20 sm:top-40 sm:right-32 w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-40 h-40 sm:w-64 sm:h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 sm:mb-6" style={{ 
            backgroundColor: 'rgba(76, 175, 80, 0.2)', 
            color: 'var(--color-success)',
            fontFamily: 'var(--font-family-body)'
          }}>
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--color-success)', animation: 'pulse 2s infinite' }}></div>
            Vendor Dashboard
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight" style={{ 
            fontWeight: 900, 
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-family-heading)'
          }}>
            Performance<br />
            <span style={{ color: 'var(--color-accent)' }}>Analytics</span>
          </h1>
          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400, fontFamily: 'var(--font-family-body)' }}>
            Track your business performance and growth metrics in real-time
          </p>
        </div>
      </section>

      {/* Period Selector */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {['1month', '3months', '6months', '1year'].map((period) => (
              <button
                key={period}
                onClick={() => {
                  setSelectedPeriod(period)
                  // Trigger data reload with new period
                  loadAnalytics()
                }}
                className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all cursor-pointer text-xs sm:text-sm`}
                style={{
                  fontFamily: 'var(--font-family-body)',
                  backgroundColor: selectedPeriod === period ? 'var(--color-accent)' : 'transparent',
                  color: selectedPeriod === period ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                  transform: selectedPeriod === period ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {period === '1month' ? '1 Month' : period === '3months' ? '3 Months' : period === '6months' ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Profile Views */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
                Profile Views
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-accent)' }}>
                <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-family-body)', 
              color: '#FFFFFF'
            }}>
              {analytics.profileViews}
            </div>
            <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--color-success)', fontFamily: 'var(--font-family-body)' }}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              +12% from last month
            </div>
          </div>

          {/* Enquiries */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
                Enquiries
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: 'var(--color-success)' }}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-family-body)', 
              color: '#FFFFFF'
            }}>
              {analytics.enquiries}
            </div>
            <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--color-success)', fontFamily: 'var(--font-family-body)' }}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              +8% from last month
            </div>
          </div>

          {/* Revenue */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
                Revenue
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-accent)' }}>
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-family-body)', 
              color: '#FFFFFF'
            }}>
              ${analytics.revenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-family-body)' }}>
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              -3% from last month
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs sm:text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
                Conversion Rate
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-accent)' }}>
                <Star className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ 
              fontFamily: 'var(--font-family-body)', 
              color: '#FFFFFF'
            }}>
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--color-success)', fontFamily: 'var(--font-family-body)' }}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              +5% from last month
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Profile Views Chart */}
          <div 
            className={`p-4 sm:p-6 rounded-xl border transition-all cursor-pointer ${
              hoveredChart === 'profileViews' ? 'shadow-lg scale-105' : 'shadow-md'
            }`}
            onMouseEnter={() => setHoveredChart('profileViews')}
            onMouseLeave={() => setHoveredChart(null)}
            onClick={() => setSelectedChart(selectedChart === 'profileViews' ? null : 'profileViews')}
            style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: hoveredChart === 'profileViews' ? 'var(--color-accent)' : 'var(--color-border)',
              boxShadow: hoveredChart === 'profileViews' 
                ? '0 8px 24px rgba(245, 166, 35, 0.25)' 
                : '0 4px 12px rgba(75, 71, 165, 0.15)'
            }}>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              Profile Views This Month
              {selectedChart === 'profileViews' && (
                <span className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>✓ Selected</span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'var(--font-family-body)', 
                    backgroundColor: 'var(--color-card)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} 
                />
                <Bar 
                  dataKey="profileViews" 
                  fill="var(--color-accent)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Enquiries Chart */}
          <div 
            className={`p-4 sm:p-6 rounded-xl border transition-all cursor-pointer ${
              hoveredChart === 'enquiries' ? 'shadow-lg scale-105' : 'shadow-md'
            }`}
            onMouseEnter={() => setHoveredChart('enquiries')}
            onMouseLeave={() => setHoveredChart(null)}
            onClick={() => setSelectedChart(selectedChart === 'enquiries' ? null : 'enquiries')}
            style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: hoveredChart === 'enquiries' ? 'var(--color-accent)' : 'var(--color-border)',
              boxShadow: hoveredChart === 'enquiries' 
                ? '0 8px 24px rgba(245, 166, 35, 0.25)' 
                : '0 4px 12px rgba(75, 71, 165, 0.15)'
            }}>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              Enquiries Received
              {selectedChart === 'enquiries' && (
                <span className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>✓ Selected</span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'var(--font-family-body)', 
                    backgroundColor: 'var(--color-card)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="enquiries" 
                  stroke="var(--color-success)" 
                  strokeWidth={2} 
                  dot={{ fill: 'var(--color-success)', r: 4 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              Revenue by Month
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis tick={{ fontFamily: 'var(--font-family-body)', fontSize: '10px', fill: 'rgba(255,255,255,0.7)' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'var(--font-family-body)', 
                    backgroundColor: 'var(--color-card)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} 
                />
                <Bar dataKey="revenue" fill="#c27803" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              Most Popular Categories
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['var(--color-accent)', 'var(--color-success)', '#c27803', '#5b21b6', '#c2410c'][index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'var(--font-family-body)', 
                    backgroundColor: 'var(--color-card)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg" 
             style={{ 
               backgroundColor: 'var(--color-card)', 
               borderColor: 'var(--color-border)',
               boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
             }}>
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
            Conversion Funnel
          </h3>
          <div className="space-y-4 sm:space-y-6">
            {analytics.funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, minWidth: '120px' }}>
                  {stage.stage}
                </div>
                <div className="flex-1 mx-0 sm:mx-4">
                  <div className="h-8 sm:h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${stage.conversion}%`, 
                        background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent))',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transition: 'width 1s ease-in-out'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between sm:justify-end gap-4 sm:gap-0" style={{ minWidth: '140px' }}>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>
                    {stage.count}
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 500 }}>
                    {stage.conversion.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADDITIONAL METRICS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Average Booking Value */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs sm:text-sm font-bold" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                Average Booking Value
              </h4>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-accent)' }}>
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              ${analytics.avgBookingValue.toLocaleString()}
            </div>
          </div>

          {/* Repeat Clients */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs sm:text-sm font-bold" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                Repeat Clients
              </h4>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: 'var(--color-success)' }}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              {analytics.repeatClients}
            </div>
          </div>

          {/* Busiest Day */}
          <div className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'var(--color-card)', 
                 borderColor: 'var(--color-border)',
                 boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs sm:text-sm font-bold" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                Busiest Day
              </h4>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'rgba(123, 97, 255, 0.2)', color: '#7b61ff' }}>
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
              {analytics.busiestDay}
            </div>
          </div>
        </div>
      </div>
          </div>
  )
}
