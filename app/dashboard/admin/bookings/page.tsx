'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, query, getDocs, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Booking, User, Vendor } from '../../../../types'
import { Calendar, DollarSign, Filter, Search, Clock, CheckCircle, XCircle, Loader2, Eye, Download, ChevronLeft, ChevronRight, ArrowUpDown, CreditCard, RotateCcw, AlertTriangle } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'


export default function AdminBookingsPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [bookings, setBookings] = useState<(Booking & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
    coupleUser?: User;
    vendorProfile?: Vendor;
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid' | 'cancelled'>('all')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
    coupleUser?: User;
    vendorProfile?: Vendor;
  }) | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const bookingsPerPage = 10

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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
            createdAt: null,
            ...bookingDoc.data()
          } as unknown as Booking


          // Fetch couple details
          let coupleName = 'Unknown'
          let coupleEmail = 'Unknown'
          let coupleUser: User | undefined
          try {
            const coupleDoc = await getDoc(doc(db, 'users', bookingData.coupleId))
            if (coupleDoc.exists()) {
              const coupleData = coupleDoc.data() as any
              coupleName = coupleData.name
              coupleEmail = coupleData.email
              coupleUser = {
                id: coupleDoc.id,
                createdAt: null,
                ...coupleData
              } as User
            }
          } catch (error) {
            console.error('Error fetching couple details:', error)
          }

          // Fetch vendor details
          let vendorName = 'Unknown'
          let vendorEmail = 'Unknown'
          let vendorProfile: Vendor | undefined
          try {
            const vendorDoc = await getDoc(doc(db, 'vendors', bookingData.vendorId))
            if (vendorDoc.exists()) {
              const vendorData = vendorDoc.data() as any
              vendorName = vendorData.businessName
              vendorEmail = vendorData.email
              vendorProfile = {
                id: vendorDoc.id,
                createdAt: null,
                ...vendorData
              } as Vendor
            }
          } catch (error) {
            console.error('Error fetching vendor details:', error)
          }

          return {
            ...bookingData,
            coupleName,
            vendorName,
            coupleEmail,
            vendorEmail,
            coupleUser,
            vendorProfile
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

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  )

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId)
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus })
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus as any } : booking
      ))
      
      // Recalculate revenue
      const revenue = bookings
        .filter(b => b.id === bookingId ? newStatus === 'paid' : b.status === 'paid')
        .reduce((sum, booking) => sum + booking.amount, 0)
      setTotalRevenue(revenue)
    } catch (error) {
      console.error('Error updating booking status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This cannot be undone.')) return
    
    try {
      await deleteDoc(doc(db, 'bookings', bookingId))
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      
      // Recalculate revenue
      const revenue = bookings.filter(b => b.id !== bookingId && b.status === 'paid').reduce((sum, booking) => sum + booking.amount, 0)
      setTotalRevenue(revenue)
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const markAsPaid = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'paid')
  }

  const refundBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to refund this booking? This will change the status to cancelled.')) return
    await updateBookingStatus(bookingId, 'cancelled')
  }

  const loadBookingDetails = (booking: typeof selectedBooking) => {
    setSelectedBooking(booking)
    setShowBookingModal(true)
  }

  const exportToCSV = () => {
    const headers = ['Couple', 'Vendor', 'Amount', 'Currency', 'Status', 'Date', 'Payment Reference']
    const csvData = filteredBookings.map(booking => [
      booking.coupleName || 'Unknown',
      booking.vendorName || 'Unknown',
      booking.amount.toString(),
      booking.currency,
      booking.status,
      formatDate(booking.createdAt),
      (booking as any).paymentReference || 
      (booking as any).paymentRef || 'N/A'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookings.csv'
    a.click()
  }

  const getRevenueByMonth = () => {
    const revenueByMonth: { [key: string]: number } = {}
    bookings
      .filter(b => b.status === 'paid')
      .forEach(booking => {
        const month = new Date(booking.createdAt || 0).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        revenueByMonth[month] = (revenueByMonth[month] || 0) + booking.amount
      })
    return revenueByMonth
  }

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
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
      case 'confirmed':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }
      case 'paid':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af' }
    }
  }

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
                <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Booking Overview</h1>
                <p className="text-sm mt-2" style={{ color: '#9a7850' }}>Monitor all bookings and revenue across the platform</p>
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{ border: '0.5px solid #b08850', color: '#7a5c30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export CSV
              </button>
            </div>

            {/* Revenue Counter */}
            <div className="p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Total Revenue (Paid Bookings)</p>
                  <p className="text-5xl font-light mt-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a', fontSize: '40px' }}>${totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-12 h-12" style={{ color: '#7a5c30' }} />
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 mb-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9a7850' }} />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded focus:outline-none"
                    style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'paid' | 'cancelled')}
                  className="px-4 py-2 rounded focus:outline-none"
                  style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
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
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#faf6f1' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Couple
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Vendor
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Currency
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                    {paginatedBookings.map((booking) => {
                      const statusColors = getStatusColor(booking.status)
                      return (
                        <tr 
                          key={booking.id} 
                          className="hover:bg-gray-50" 
                          style={{ backgroundColor: 'transparent' }} 
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf6f1'} 
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadBookingDetails(booking)}>
                                {booking.coupleName}
                              </div>
                              <div className="text-xs" style={{ color: '#9a7850' }}>{booking.coupleEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadBookingDetails(booking)}>
                                {booking.vendorName}
                              </div>
                              <div className="text-xs" style={{ color: '#9a7850' }}>{booking.vendorEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium" style={{ color: '#3a2a1a' }}>
                              {booking.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{ color: '#9a7850' }}>{booking.currency}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(booking.status)}
                              <span 
                                className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold"
                                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                              >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9a7850' }}>
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => loadBookingDetails(booking)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#7a5c30' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={booking.status}
                                onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                                disabled={updating === booking.id}
                                className="px-2 py-1 text-xs rounded focus:outline-none disabled:opacity-50"
                                style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {booking.status !== 'paid' && (
                                <button
                                  onClick={() => markAsPaid(booking.id)}
                                  disabled={updating === booking.id}
                                  className="p-1 rounded transition-colors disabled:opacity-50"
                                  style={{ color: '#16a34a' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                              {booking.status === 'paid' && (
                                <button
                                  onClick={() => refundBooking(booking.id)}
                                  disabled={updating === booking.id}
                                  className="p-1 rounded transition-colors disabled:opacity-50"
                                  style={{ color: '#dc2626' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteBooking(booking.id)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#dc2626' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {filteredBookings.length === 0 && (
                  <div className="text-center py-8" style={{ color: '#9a7850' }}>
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No bookings found matching your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                  <div className="text-sm" style={{ color: '#9a7850' }}>
                    Showing {((currentPage - 1) * bookingsPerPage) + 1} to {Math.min(currentPage * bookingsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#7a5c30' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm" style={{ color: '#9a7850' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#7a5c30' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9a7850' }}>Total Bookings</span>
                  <span className="text-lg font-medium" style={{ color: '#3a2a1a' }}>{bookings.length}</span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9a7850' }}>Pending</span>
                  <span className="text-lg font-medium" style={{ color: '#f59e0b' }}>
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9a7850' }}>Confirmed</span>
                  <span className="text-lg font-medium" style={{ color: '#3b82f6' }}>
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9a7850' }}>Paid</span>
                  <span className="text-lg font-medium" style={{ color: '#22c55e' }}>
                    {bookings.filter(b => b.status === 'paid').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue by Month */}
            <div className="mt-6 p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Revenue by Month</h3>
              <div className="space-y-2">
                {Object.entries(getRevenueByMonth()).map(([month, revenue]) => (
                  <div key={month} className="flex items-center justify-between p-3" style={{ backgroundColor: '#faf6f1' }}>
                    <span className="text-sm" style={{ color: '#9a7850' }}>{month}</span>
                    <span className="text-sm font-medium" style={{ color: '#3a2a1a' }}>${revenue.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(getRevenueByMonth()).length === 0 && (
                  <div className="text-center py-4" style={{ color: '#9a7850' }}>
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Detail Modal */}
            {showBookingModal && selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBookingModal(false)} />
                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '0.5px solid rgba(180,140,90,0.2)' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Booking Details</h2>
                      <button
                        onClick={() => setShowBookingModal(false)}
                        className="p-2 rounded transition-colors"
                        style={{ color: '#9a7850' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Couple</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedBooking.coupleName}</p>
                        <p className="text-xs" style={{ color: '#9a7850' }}>{selectedBooking.coupleEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Vendor</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedBooking.vendorName}</p>
                        <p className="text-xs" style={{ color: '#9a7850' }}>{selectedBooking.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Amount</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedBooking.currency} {selectedBooking.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Status</p>
                        <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1`} style={{ 
                          backgroundColor: getStatusColor(selectedBooking.status).bg,
                          color: getStatusColor(selectedBooking.status).text
                        }}>
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Wedding Date</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedBooking.weddingDate ? formatDate(selectedBooking.weddingDate) : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Venue</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedBooking.venue || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    {selectedBooking.paymentReference && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Payment Reference</p>
                        <div className="p-3" style={{ backgroundColor: '#faf6f1' }}>
                          <p className="text-sm font-mono" style={{ color: '#3a2a1a' }}>{selectedBooking.paymentReference}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {selectedBooking.status !== 'paid' && (
                        <button
                          onClick={() => {
                            markAsPaid(selectedBooking.id)
                            setShowBookingModal(false)
                          }}
                          className="px-4 py-2 text-sm font-medium rounded transition-colors"
                          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                        >
                          <CreditCard className="w-4 h-4 inline mr-2" />
                          Mark as Paid
                        </button>
                      )}
                      {selectedBooking.status === 'paid' && (
                        <button
                          onClick={() => {
                            refundBooking(selectedBooking.id)
                            setShowBookingModal(false)
                          }}
                          className="px-4 py-2 text-sm font-medium rounded transition-colors"
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                          <RotateCcw className="w-4 h-4 inline mr-2" />
                          Refund Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
