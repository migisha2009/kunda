'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, Calendar, Clock, Star } from 'lucide-react'

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
        const paidBookings = bookings.filter(b => b.status === 'paid')
        const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0)
        const conversionRate = totalEnquiries > 0 ? (totalBookings / totalEnquiries) * 100 : 0
        const avgBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0

        // Generate monthly data for charts
        const monthlyData = generateMonthlyData(enquiries, bookings)
        const categoryData = generateCategoryData(bookings)
        const funnelData = generateFunnelData(enquiries.length, bookings.length, paidBookings.length)

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
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Bookings
          </a>
          <a 
            href="/dashboard/vendor/analytics" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#7a5c30',
              textDecoration: 'none'
            }}
          >
            Analytics
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
              {userProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#7a5c30'
          }}>
            {userProfile.name}
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

      {/* HERO SECTION */}
      <div style={{ padding: '32px 32px 20px', backgroundColor: '#fdf9f5' }}>
        <div className="text-xs uppercase tracking-wider" style={{ color: '#b08850', fontFamily: 'Jost', fontWeight: 400 }}>
          Vendor Analytics
        </div>
        <h1 
          className="text-4xl font-light mt-2 mb-3" 
          style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a', fontWeight: 300 }}
        >
          Performance Insights
        </h1>
        <p className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
          Track your business performance and growth metrics
        </p>
      </div>

      {/* Period Selector */}
      <div className="px-8 mb-6">
        <div style={{ display: 'flex', gap: '12px' }}>
          {['1month', '3months', '6months', '1year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '8px 16px',
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: selectedPeriod === period ? '#7a5c30' : 'transparent',
                color: selectedPeriod === period ? '#fdf9f5' : '#7a5c30',
                border: '0.5px solid #b08850',
                cursor: 'pointer'
              }}
            >
              {period === '1month' ? '1 Month' : period === '3months' ? '3 Months' : period === '6months' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-4 gap-3 px-8 mb-8">
        {/* Profile Views */}
        <div 
          className="border"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Profile Views
            </div>
            <Eye className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {analytics.profileViews}
          </div>
          <div className="flex items-center text-xs" style={{ fontFamily: 'Jost', color: '#16a34a' }}>
            <TrendingUp className="w-3 h-3 mr-1" />
            +12% from last month
          </div>
        </div>

        {/* Enquiries */}
        <div 
          className="border"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Enquiries
            </div>
            <Users className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {analytics.enquiries}
          </div>
          <div className="flex items-center text-xs" style={{ fontFamily: 'Jost', color: '#16a34a' }}>
            <TrendingUp className="w-3 h-3 mr-1" />
            +8% from last month
          </div>
        </div>

        {/* Revenue */}
        <div 
          className="border"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Revenue
            </div>
            <DollarSign className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '30px'
          }}>
            ${analytics.revenue.toLocaleString()}
          </div>
          <div className="flex items-center text-xs" style={{ fontFamily: 'Jost', color: '#dc2626' }}>
            <TrendingDown className="w-3 h-3 mr-1" />
            -3% from last month
          </div>
        </div>

        {/* Conversion Rate */}
        <div 
          className="border"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: 'rgba(180,140,90,0.2)', 
            padding: '16px 18px'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase" style={{ 
              fontFamily: 'Jost', 
              letterSpacing: '0.15em',
              color: '#9a7850' 
            }}>
              Conversion Rate
            </div>
            <Star className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-3xl font-light mb-1" style={{ 
            fontFamily: 'Cormorant Garamond', 
            color: '#3a2a1a',
            fontWeight: 300,
            fontSize: '30px'
          }}>
            {analytics.conversionRate.toFixed(1)}%
          </div>
          <div className="flex items-center text-xs" style={{ fontFamily: 'Jost', color: '#16a34a' }}>
            <TrendingUp className="w-3 h-3 mr-1" />
            +2% from last month
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-2 gap-6 px-8 mb-8">
        {/* Profile Views Chart */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            Profile Views This Month
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <YAxis tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: 'Jost', 
                  backgroundColor: '#ffffff', 
                  border: '0.5px solid rgba(180,140,90,0.2)',
                  borderRadius: 0
                }} 
              />
              <Bar dataKey="profileViews" fill="#b08850" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enquiries Chart */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            Enquiries Received
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <YAxis tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: 'Jost', 
                  backgroundColor: '#ffffff', 
                  border: '0.5px solid rgba(180,140,90,0.2)',
                  borderRadius: 0
                }} 
              />
              <Line type="monotone" dataKey="enquiries" stroke="#7a5c30" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            Revenue by Month
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <YAxis tick={{ fontFamily: 'Jost', fontSize: '11px', fill: '#9a7850' }} />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: 'Jost', 
                  backgroundColor: '#ffffff', 
                  border: '0.5px solid rgba(180,140,90,0.2)',
                  borderRadius: 0
                }} 
              />
              <Bar dataKey="revenue" fill="#7a5c30" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
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
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  fontFamily: 'Jost', 
                  backgroundColor: '#ffffff', 
                  border: '0.5px solid rgba(180,140,90,0.2)',
                  borderRadius: 0
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CONVERSION FUNNEL */}
      <div className="px-8 mb-8">
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px'
          }}
        >
          <h3 className="text-lg font-medium mb-6" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            Conversion Funnel
          </h3>
          <div className="space-y-4">
            {analytics.funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center">
                <div style={{ width: '150px', fontFamily: 'Jost', fontSize: '13px', color: '#3a2a1a' }}>
                  {stage.stage}
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-8" style={{ background: '#f0e4d0', position: 'relative' }}>
                    <div 
                      className="h-full"
                      style={{ 
                        width: `${stage.conversion}%`, 
                        background: '#7a5c30',
                        position: 'absolute',
                        left: 0,
                        top: 0
                      }}
                    ></div>
                  </div>
                </div>
                <div style={{ width: '80px', textAlign: 'right', fontFamily: 'Jost', fontSize: '13px', color: '#3a2a1a' }}>
                  {stage.count}
                </div>
                <div style={{ width: '60px', textAlign: 'right', fontFamily: 'Jost', fontSize: '11px', color: '#b08850' }}>
                  {stage.conversion.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADDITIONAL METRICS */}
      <div className="grid grid-cols-3 gap-6 px-8 pb-8">
        {/* Average Booking Value */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '20px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
              Average Booking Value
            </h4>
            <DollarSign className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            ${analytics.avgBookingValue.toLocaleString()}
          </div>
        </div>

        {/* Repeat Clients */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '20px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
              Repeat Clients
            </h4>
            <Users className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            {analytics.repeatClients}
          </div>
        </div>

        {/* Busiest Day */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '20px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
              Busiest Day
            </h4>
            <Calendar className="w-4 h-4" style={{ color: '#b08850' }} />
          </div>
          <div className="text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond', color: '#3a2a1a' }}>
            {analytics.busiestDay}
          </div>
        </div>
      </div>
    </div>
  )
}
