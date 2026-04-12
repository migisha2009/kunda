'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { User, Vendor, Booking, Enquiry } from '../../../../types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Calendar, DollarSign, MessageSquare, Loader2 } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'
import { colors, typography } from '../../../../lib/styles'

export default function AdminAnalyticsPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      // Load users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const usersSnapshot = await getDocs(usersQuery)
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as User[]
      setUsers(usersData)

      // Load vendors
      const vendorsQuery = query(collection(db, 'vendors'), orderBy('createdAt', 'desc'))
      const vendorsSnapshot = await getDocs(vendorsQuery)
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as Vendor[]
      setVendors(vendorsData)

      // Load bookings
      const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as Booking[]
      setBookings(bookingsData)

      // Load enquiries
      const enquiriesQuery = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'))
      const enquiriesSnapshot = await getDocs(enquiriesQuery)
      const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as Enquiry[]
      setEnquiries(enquiriesData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }
    return ranges[timeRange]
  }

  const filterByDateRange = (items: any[]) => {
    const startDate = getDateRange()
    return items.filter(item => 
      item.createdAt && new Date(item.createdAt) >= startDate
    )
  }

  const getUserGrowthData = () => {
    const filteredUsers = filterByDateRange(users)
    const userCounts: { [key: string]: number } = {}
    
    filteredUsers.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        userCounts[date] = (userCounts[date] || 0) + 1
      }
    })

    return Object.entries(userCounts).map(([date, count]) => ({
      date,
      users: count
    })).slice(-30)
  }

  const getRevenueData = () => {
    const filteredBookings = filterByDateRange(bookings).filter(b => b.status === 'paid')
    const revenueByMonth: { [key: string]: number } = {}
    
    filteredBookings.forEach(booking => {
      if (booking.createdAt) {
        const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        revenueByMonth[month] = (revenueByMonth[month] || 0) + booking.amount
      }
    })

    return Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue
    }))
  }

  const getVendorCategoryData = () => {
    const categoryCount: { [key: string]: number } = {}
    
    vendors.forEach(vendor => {
      const category = vendor.category || 'Other'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    return Object.entries(categoryCount).map(([category, count]) => ({
      name: category,
      count
    }))
  }

  const getBookingStatusData = () => {
    const statusCount = {
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      paid: bookings.filter(b => b.status === 'paid').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    }

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }))
  }

  const getEnquiryTrendData = () => {
    const filteredEnquiries = filterByDateRange(enquiries)
    const enquiryCounts: { [key: string]: number } = {}
    
    filteredEnquiries.forEach(enquiry => {
      if (enquiry.createdAt) {
        const date = new Date(enquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        enquiryCounts[date] = (enquiryCounts[date] || 0) + 1
      }
    })

    return Object.entries(enquiryCounts).map(([date, count]) => ({
      date,
      enquiries: count
    })).slice(-30)
  }

  const COLORS = ['#7a5c30', '#b08850', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444']

  const totalRevenue = bookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0)
  const avgBookingValue = bookings.filter(b => b.status === 'paid').length > 0 
    ? totalRevenue / bookings.filter(b => b.status === 'paid').length 
    : 0
  const conversionRate = bookings.length > 0 
    ? (bookings.filter(b => b.status === 'paid').length / bookings.length) * 100 
    : 0

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Analytics Dashboard</h1>
                <p className="text-sm mt-2" style={{ color: '#9a7850' }}>Track platform performance and user engagement</p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 text-sm font-medium rounded focus:outline-none"
                style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Total Revenue</p>
                    <p className="text-3xl font-light mt-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                      ${totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8" style={{ color: '#7a5c30' }} />
                </div>
              </div>
              
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Avg Booking Value</p>
                    <p className="text-3xl font-light mt-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                      ${avgBookingValue.toFixed(0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8" style={{ color: '#7a5c30' }} />
                </div>
              </div>
              
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Conversion Rate</p>
                    <p className="text-3xl font-light mt-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                      {conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <Calendar className="w-8 h-8" style={{ color: '#7a5c30' }} />
                </div>
              </div>
              
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Total Users</p>
                    <p className="text-3xl font-light mt-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                      {users.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8" style={{ color: '#7a5c30' }} />
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User Growth Chart */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getUserGrowthData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)' }}
                      labelStyle={{ color: '#3a2a1a' }}
                    />
                    <Line type="monotone" dataKey="users" stroke="#7a5c30" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Chart */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)' }}
                      labelStyle={{ color: '#3a2a1a' }}
                    />
                    <Bar dataKey="revenue" fill="#7a5c30" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vendor Categories */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Vendor Categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getVendorCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name || ''} ${(props.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getVendorCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)' }}
                      labelStyle={{ color: '#3a2a1a' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Booking Status */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Booking Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getBookingStatusData()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)' }}
                      labelStyle={{ color: '#3a2a1a' }}
                    />
                    <Bar dataKey="count" fill="#b08850" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Enquiry Trends */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Enquiry Trends</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getEnquiryTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,90,0.1)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#9a7850' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)' }}
                      labelStyle={{ color: '#3a2a1a' }}
                    />
                    <Line type="monotone" dataKey="enquiries" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
