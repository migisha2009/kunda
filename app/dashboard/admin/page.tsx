'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { User, Vendor, Booking, Enquiry } from '../../../types'
import { Users, Store, Calendar, DollarSign, MessageSquare, TrendingUp, UserPlus, Loader2 } from 'lucide-react'
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
        })) as User[]

        const vendorsSnapshot = await getDocs(collection(db, 'vendors'))
        const vendorsData = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as Vendor[]

        const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as Booking[]

        const enquiriesSnapshot = await getDocs(collection(db, 'enquiries'))
        const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as Enquiry[]

        // Calculate stats
        const totalRevenue = bookingsData
          .filter(booking => booking.status === 'paid')
          .reduce((sum, booking) => sum + booking.amount, 0)

        setStats({
          totalUsers: usersData.length,
          totalVendors: vendorsData.length,
          verifiedVendors: vendorsData.filter(v => v.verified).length,
          totalBookings: bookingsData.length,
          totalRevenue,
          totalEnquiries: enquiriesData.length
        })

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
        })) as User[]

        setRecentUsers(recentUsersData)
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userProfile])

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage the Kunda platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
                <p className="text-xs text-green-600 mt-1">{stats.verifiedVendors} verified</p>
              </div>
              <Store className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enquiries</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnquiries}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendor Verification</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalVendors > 0 ? Math.round((stats.verifiedVendors / stats.totalVendors) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.verifiedVendors}/{stats.totalVendors}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
              Recent Signups
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'vendor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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
