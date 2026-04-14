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

  useEffect(() => {
    if (!user || !userProfile) return

    const loadAnalytics = async () => {
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
        const monthlyData = generateMonthlyData(enquiries, bookings)
        const categoryData = generateCategoryData(bookings)
        const funnelData = generateFunnelData(analytics.profileViews, enquiries.length, bookings.length, paidBookings.length)

        setAnalytics({
          profileViews: Math.floor(Math.random() * 500) + 100, // Mock data
          enquiries: totalEnquiries,
          revenue: totalRevenue,
          bookings: totalBookings,
          conversionRate,
          avgBookingValue,
          repeatClients: Math.floor(Math.random() * 10), // Mock data
          busiestDay: calculateBusiestDay(enquiries),
          monthlyData,
          categoryData,
          funnelData
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user, userProfile])

  const generateMonthlyData = (enquiries: any[], bookings: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month, index) => ({
      month,
      enquiries: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      profileViews: Math.floor(Math.random() * 200) + 50
    }))
  }

  const generateCategoryData = (bookings: any[]) => {
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
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayCounts = days.map(day => ({
      day,
      count: Math.floor(Math.random() * 10) + 1 // Mock data
    }))
    return dayCounts.reduce((max, current) => current.count > max.count ? current : max).day
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)'
      }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)'
      }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
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
      <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 shadow-lg`} style={{ borderBottom: '1px solid #e5edff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a56db' }}>
                <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
              </div>
              <span className="ml-2" style={{ fontFamily: 'Urbanist', color: '#1a56db', fontWeight: 800, fontSize: '22px' }}>Kunda</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/dashboard/vendor" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Overview</a>
              <a href="/dashboard/vendor/profile" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Profile</a>
              <a href="/dashboard/vendor/bookings" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Bookings</a>
              <a href="/dashboard/vendor/analytics" className="hover:text-blue-600 transition-colors" style={{ color: '#1a56db', fontWeight: 600, fontSize: '14px' }}>Analytics</a>
            </div>

            {/* Right - User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'Urbanist', color: '#374151', fontWeight: 500 }}>
                {userProfile.name}
              </span>
              <button
                onClick={() => {
                  window.location.href = '/login'
                }}
                className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-medium transition-colors hover:bg-blue-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)',
        minHeight: '320px',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background rings */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" style={{ animation: 'pulse 2s infinite' }}></div>
            Vendor Dashboard
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ 
            fontWeight: 900, 
            letterSpacing: '-0.03em',
            fontFamily: 'Urbanist'
          }}>
            Performance<br />
            <span style={{ color: '#93c5fd' }}>Analytics</span>
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
            Track your business performance and growth metrics in real-time
          </p>
        </div>
      </section>

      {/* Period Selector */}
      <div className="px-8 mb-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            {['1month', '3months', '6months', '1year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  selectedPeriod === period 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === '1month' ? '1 Month' : period === '3months' ? '3 Months' : period === '6months' ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Profile Views */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: '#374151' }}>
                Profile Views
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#dbeafe', color: '#1a56db' }}>
                <Eye className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'Urbanist', 
              color: '#111928'
            }}>
              {analytics.profileViews}
            </div>
            <div className="flex items-center text-sm" style={{ color: '#057a55' }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% from last month
            </div>
          </div>

          {/* Enquiries */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: '#374151' }}>
                Enquiries
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#dcfce7', color: '#057a55' }}>
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'Urbanist', 
              color: '#111928'
            }}>
              {analytics.enquiries}
            </div>
            <div className="flex items-center text-sm" style={{ color: '#057a55' }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              +8% from last month
            </div>
          </div>

          {/* Revenue */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: '#374151' }}>
                Revenue
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#fef3c7', color: '#c27803' }}>
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'Urbanist', 
              color: '#111928'
            }}>
              ${analytics.revenue.toLocaleString()}
            </div>
            <div className="flex items-center text-sm" style={{ color: '#dc2626' }}>
              <TrendingDown className="w-4 h-4 mr-1" />
              -3% from last month
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: '#374151' }}>
                Conversion Rate
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                <Star className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ 
              fontFamily: 'Urbanist', 
              color: '#111928'
            }}>
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-sm" style={{ color: '#057a55' }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              +2% from last month
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Views Chart */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              Profile Views This Month
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5edff" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <YAxis tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'Urbanist', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5edff',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="profileViews" fill="#1a56db" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Enquiries Chart */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              Enquiries Received
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5edff" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <YAxis tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'Urbanist', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5edff',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="enquiries" stroke="#057a55" strokeWidth={3} dot={{ fill: '#057a55', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              Revenue by Month
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5edff" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <YAxis tick={{ fontFamily: 'Urbanist', fontSize: '12px', fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'Urbanist', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5edff',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="revenue" fill="#c27803" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              Most Popular Categories
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#1a56db', '#057a55', '#c27803', '#5b21b6', '#c2410c'][index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    fontFamily: 'Urbanist', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5edff',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL */}
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <div className="p-6 rounded-xl border transition-all hover:shadow-lg" 
             style={{ 
               backgroundColor: 'white', 
               borderColor: '#e5edff'
             }}>
          <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
            Conversion Funnel
          </h3>
          <div className="space-y-6">
            {analytics.funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center">
                <div style={{ width: '180px', fontFamily: 'Urbanist', fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                  {stage.stage}
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-10 rounded-full" style={{ background: '#e5edff', position: 'relative' }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${stage.conversion}%`, 
                        background: 'linear-gradient(90deg, #1a56db, #3f83f8)',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transition: 'width 1s ease-in-out'
                      }}
                    ></div>
                  </div>
                </div>
                <div style={{ width: '80px', textAlign: 'right', fontFamily: 'Urbanist', fontSize: '16px', color: '#111928', fontWeight: 600 }}>
                  {stage.count}
                </div>
                <div style={{ width: '60px', textAlign: 'right', fontFamily: 'Urbanist', fontSize: '12px', color: '#1a56db', fontWeight: 500 }}>
                  {stage.conversion.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADDITIONAL METRICS */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Booking Value */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold" style={{ fontFamily: 'Urbanist', color: '#374151' }}>
                Average Booking Value
              </h4>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#fef3c7', color: '#c27803' }}>
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              ${analytics.avgBookingValue.toLocaleString()}
            </div>
          </div>

          {/* Repeat Clients */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold" style={{ fontFamily: 'Urbanist', color: '#374151' }}>
                Repeat Clients
              </h4>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#dcfce7', color: '#057a55' }}>
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              {analytics.repeatClients}
            </div>
          </div>

          {/* Busiest Day */}
          <div className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
               style={{ 
                 backgroundColor: 'white', 
                 borderColor: '#e5edff'
               }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold" style={{ fontFamily: 'Urbanist', color: '#374151' }}>
                Busiest Day
              </h4>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Urbanist', color: '#111928' }}>
              {analytics.busiestDay}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
