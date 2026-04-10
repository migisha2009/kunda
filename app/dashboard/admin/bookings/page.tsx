'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Booking } from '../../../../types'
import { Calendar, DollarSign, Filter, Search, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AdminBookingsPage() {
  const { userProfile } = useAuth()
  const [bookings, setBookings] = useState<(Booking & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid' | 'cancelled'>('all')
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      )
      
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = await Promise.all(
        bookingsSnapshot.docs.map(async (bookingDoc) => {
          const bookingData = {
            id: bookingDoc.id,
            ...bookingDoc.data()
          } as Booking

          // Convert Timestamp to Date
          if (bookingData.createdAt instanceof Date) {
            bookingData.createdAt = bookingData.createdAt
          } else {
            bookingData.createdAt = new Date(bookingData.createdAt as any)
          }

          // Fetch couple details
          let coupleName = 'Unknown'
          let coupleEmail = 'Unknown'
          try {
            const coupleDoc = await getDoc(doc(db, 'users', bookingData.coupleId))
            if (coupleDoc.exists()) {
              const coupleData = coupleDoc.data() as any
              coupleName = coupleData.name
              coupleEmail = coupleData.email
            }
          } catch (error) {
            console.error('Error fetching couple details:', error)
          }

          // Fetch vendor details
          let vendorName = 'Unknown'
          let vendorEmail = 'Unknown'
          try {
            const vendorDoc = await getDoc(doc(db, 'vendors', bookingData.vendorId))
            if (vendorDoc.exists()) {
              const vendorData = vendorDoc.data() as any
              vendorName = vendorData.businessName
              vendorEmail = vendorData.email
            }
          } catch (error) {
            console.error('Error fetching vendor details:', error)
          }

          return {
            ...bookingData,
            coupleName,
            vendorName,
            coupleEmail,
            vendorEmail
          }
        })
      )

      setBookings(bookingsData)
      
      // Calculate total revenue from paid bookings
      const revenue = bookingsData
        .filter(booking => booking.status === 'paid')
        .reduce((sum, booking) => sum + booking.amount, 0)
      setTotalRevenue(revenue)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.coupleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.coupleEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vendorEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {loading ? (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Overview</h1>
          <p className="text-gray-600">Monitor all bookings and revenue across the platform</p>
        </div>

        {/* Revenue Counter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue (Paid Bookings)</p>
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'paid' | 'cancelled')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Couple
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.coupleName}</div>
                        <div className="text-xs text-gray-500">{booking.coupleEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.vendorName}</div>
                        <div className="text-xs text-gray-500">{booking.vendorEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.currency} {booking.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No bookings found matching your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Bookings</span>
              <span className="text-lg font-bold text-gray-900">{bookings.length}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed</span>
              <span className="text-lg font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Paid</span>
              <span className="text-lg font-bold text-green-600">
                {bookings.filter(b => b.status === 'paid').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  )
}
