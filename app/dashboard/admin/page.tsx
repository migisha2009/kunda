'use client'

import { useState, useEffect } from 'react'
import { colors, typography, getStyles } from '../../../lib/styles'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { User, Vendor, Booking, Enquiry } from '../../../types'
import { Users, Store, Calendar, DollarSign, MessageSquare, TrendingUp, UserPlus, Loader2, Activity, Target, ArrowUp } from 'lucide-react'
import { formatDate } from '../../../lib/dateUtils'


export default function AdminOverview() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    verifiedVendors: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalEnquiries: 0
  })
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [platformHealth, setPlatformHealth] = useState({
    activeWeddings: 0,
    pendingEnquiries: 0,
    avgBookingValue: 0,
    conversionRate: 0
  })

  useEffect(() => {
    if (!userProfile) return

    const loadData = async () => {
      try {
        // Load stats
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as User[]

        const vendorsSnapshot = await getDocs(collection(db, 'vendors'))
        const vendorsData = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as Vendor[]

        const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as Booking[]

        const enquiriesSnapshot = await getDocs(collection(db, 'enquiries'))
        const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as Enquiry[]

        // Calculate stats
        const totalRevenue = bookingsData
          .filter(booking => booking.status === 'paid')
          .reduce((sum, booking) => sum + booking.amount, 0)
        const paidBookings = bookingsData.filter(booking => booking.status === 'paid')
        const avgBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0
        const conversionRate = enquiriesData.length > 0 ? (bookingsData.length / enquiriesData.length) * 100 : 0
        const activeWeddings = bookingsData.filter(b => b.status === 'confirmed' || b.status === 'paid').length
        const pendingEnquiries = enquiriesData.filter(e => e.status === 'pending').length

        setStats({
          totalUsers: usersData.length,
          totalVendors: vendorsData.length,
          verifiedVendors: vendorsData.filter(v => v.verified).length,
          totalBookings: bookingsData.length,
          totalRevenue,
          totalEnquiries: enquiriesData.length
        })

        setPlatformHealth({
          activeWeddings,
          pendingEnquiries,
          avgBookingValue,
          conversionRate
        })

        setLastUpdated(new Date())

        // Load recent users
        const recentUsersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        
        const recentUsersSnapshot = await getDocs(recentUsersQuery)
        const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as User[]

        setRecentUsers(recentUsersData)
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [userProfile])

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryDark }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryDark }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '28px' }}>Admin Dashboard</h1>
                <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Monitor and manage the Kunda platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  Last updated: {formatDate(lastUpdated)}
                </span>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{ backgroundColor: colors.primaryDark, color: colors.bg }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark }
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Total Users</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>

              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Total Vendors</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>{stats.totalVendors}</p>
                    <p className="text-xs mt-1" style={{ color: colors.success }}>{stats.verifiedVendors} verified</p>
                  </div>
                  <Store className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>

              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Total Bookings</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>{stats.totalBookings}</p>
                  </div>
                  <Calendar className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>

              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Total Revenue</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>

              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Total Enquiries</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>{stats.totalEnquiries}</p>
                  </div>
                  <MessageSquare className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>

              <div className="p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Vendor Verification</p>
                    <p className="text-3xl mt-2" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em' }}>
                      {stats.totalVendors > 0 ? Math.round((stats.verifiedVendors / stats.totalVendors) * 100) : 0}%
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {stats.verifiedVendors}/{stats.totalVendors}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8" style={{ color: colors.primaryDark }} />
                </div>
              </div>
            </div>

            {/* Platform Health Metrics */}
            <div className="p-6 mb-8" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 mr-2" style={{ color: colors.primaryDark }} />
                <h2 className="text-xl" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 700, fontSize: '18px' }}>Platform Health</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4" style={{ backgroundColor: colors.primaryLightLegacy }}>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Active Weddings</p>
                    <p className="text-xl mt-1" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>{platformHealth.activeWeddings}</p>
                  </div>
                  <Target className="w-5 h-5" style={{ color: colors.primaryDark }} />
                </div>
                <div className="flex items-center justify-between p-4" style={{ backgroundColor: colors.primaryLightLegacy }}>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Pending Enquiries</p>
                    <p className="text-xl mt-1" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>{platformHealth.pendingEnquiries}</p>
                  </div>
                  <MessageSquare className="w-5 h-5" style={{ color: colors.primaryDark }} />
                </div>
                <div className="flex items-center justify-between p-4" style={{ backgroundColor: colors.primaryLightLegacy }}>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Avg Booking Value</p>
                    <p className="text-xl mt-1" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>${Math.round(platformHealth.avgBookingValue).toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-5 h-5" style={{ color: colors.primaryDark }} />
                </div>
                <div className="flex items-center justify-between p-4" style={{ backgroundColor: colors.primaryLightLegacy }}>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: colors.textSecondary }}>Conversion Rate</p>
                    <p className="text-xl mt-1" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>{Math.round(platformHealth.conversionRate)}%</p>
                  </div>
                  <ArrowUp className="w-5 h-5" style={{ color: colors.primaryDark }} />
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <h2 className="text-xl flex items-center" style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 700, fontSize: '18px' }}>
                  <UserPlus className="w-5 h-5 mr-2" style={{ color: colors.primaryDark }} />
                  Recent Signups
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: colors.primaryLightLegacy }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary, letterSpacing: '0.15em' }}>
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary, letterSpacing: '0.15em' }}>
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary, letterSpacing: '0.15em' }}>
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary, letterSpacing: '0.15em' }}>
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: colors.border }}>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLightLegacy } onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: colors.textSecondary }}>{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold ${
                            user.role === 'admin' 
                              ? 'text-purple-800'
                              : user.role === 'vendor'
                              ? 'text-amber-800'
                              : 'text-teal-800'
                          }`} style={{ 
                            backgroundColor: user.role === 'admin' ? 'rgba(147, 51, 234, 0.1)' :
                                           user.role === 'vendor' ? colors.warningBg :
                                           colors.successBg
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.textSecondary }}>
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {recentUsers.length === 0 && (
                  <div className="text-center py-8" style={{ color: colors.textSecondary }}>
                    <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent signups</p>
                  </div>
                )}
              </div>
            </div>
      </div>
        </div>
      )}
    </>
  )
}
