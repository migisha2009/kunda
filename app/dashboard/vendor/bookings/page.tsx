'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { getVendorByUserId } from '../../../../lib/firestore'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Enquiry } from '../../../../types'
import { colors } from '../../../../lib/styles'
import { 
  MessageSquare, Clock, CheckCircle, XCircle, User, Calendar, 
  Search, Filter, Reply, ChevronDown, DollarSign, CreditCard, 
  Copy, ExternalLink, Mail, AlertCircle, Download, Eye
} from 'lucide-react'

interface Booking {
  id: string
  vendorId: string
  coupleId: string
  coupleName: string
  amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  date: Date
  createdAt: Date
  paymentLink?: string
  notes?: string
  venue?: string
  weddingDate?: Date
}

export default function VendorBookingsPage() {
  const { user } = useAuth()
  const [enquiries, setEnquiries] = useState<(Enquiry & { coupleName?: string; expanded?: boolean; replyText?: string })[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'enquiries' | 'bookings'>('enquiries')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [convertingEnquiry, setConvertingEnquiry] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    amount: '',
    currency: 'USD',
    date: '',
    notes: ''
  })
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [responseRate, setResponseRate] = useState(0)

  const itemsPerPage = 10

  useEffect(() => {
    if (user) {
      loadVendorAndData()
    }
  }, [user])

  const loadVendorAndData = async () => {
    if (!user) return

    try {
      // Get vendor profile
      const vendorData = await getVendorByUserId(user.uid)
      setVendor(vendorData)

      if (vendorData) {
        const vendorId = vendorData.id

        // Set up real-time listener for enquiries
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc')
        )

        const unsubscribeEnquiries = onSnapshot(enquiriesQuery, async (snapshot) => {
          const enquiriesData: any[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            enquiriesData.push({
              id: doc.id,
              vendorId: data.vendorId,
              coupleId: data.coupleId,
              message: data.message,
              status: data.status,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
              expanded: false,
              replyText: ''
            })
          })

          // Fetch couple names
          const enrichedEnquiries = await Promise.all(
            enquiriesData.map(async (enquiry) => {
              try {
                const coupleDoc = await getDocs(query(
                  collection(db, 'users'),
                  where('uid', '==', enquiry.coupleId)
                ))
                if (!coupleDoc.empty) {
                  enquiry.coupleName = coupleDoc.docs[0].data().name
                }
              } catch (error) {
                console.error('Error fetching couple name:', error)
              }
              return enquiry
            })
          )

          setEnquiries(enrichedEnquiries)
          
          // Calculate response rate
          const total = enrichedEnquiries.length
          const replied = enrichedEnquiries.filter(e => e.status === 'replied').length
          setResponseRate(total > 0 ? (replied / total) * 100 : 0)
        })

        // Set up real-time listener for bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc')
        )

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const bookingsData: Booking[] = []
          let revenue = 0
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const booking = {
              id: doc.id,
              vendorId: data.vendorId,
              coupleId: data.coupleId,
              coupleName: data.coupleName || 'Client',
              amount: data.amount || 0,
              currency: data.currency || 'USD',
              status: data.status,
              date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              paymentLink: data.paymentLink,
              notes: data.notes,
              venue: data.venue,
              weddingDate: data.weddingDate instanceof Timestamp ? data.weddingDate.toDate() : new Date(data.weddingDate)
            }
            bookingsData.push(booking)
            
            if (booking.status === 'paid') {
              revenue += booking.amount
            }
          })
          
          setBookings(bookingsData)
          setTotalRevenue(revenue)
        })

        return () => {
          unsubscribeEnquiries()
          unsubscribeBookings()
        }
      }
    } catch (error) {
      console.error('Error loading vendor and data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEnquiryStatus = async (enquiryId: string, status: 'replied' | 'closed') => {
    try {
      const enquiryRef = doc(db, 'enquiries', enquiryId)
      await updateDoc(enquiryRef, { status })
    } catch (error) {
      console.error('Error updating enquiry status:', error)
    }
  }

  const replyToEnquiry = async (enquiryId: string) => {
    const enquiry = enquiries.find(e => e.id === enquiryId)
    if (!enquiry?.replyText?.trim()) return

    try {
      // Send email via Resend (mock implementation)
      console.log('Sending email to couple:', enquiry.replyText)
      
      // Mark as replied
      await updateEnquiryStatus(enquiryId, 'replied')
      
      // Clear reply text
      setEnquiries(prev => prev.map(e => 
        e.id === enquiryId 
          ? { ...e, replyText: '', expanded: false }
          : e
      ))
    } catch (error) {
      console.error('Error replying to enquiry:', error)
    }
  }

  const convertToBooking = async (enquiryId: string) => {
    if (!bookingForm.amount || !bookingForm.date) return

    try {
      const enquiry = enquiries.find(e => e.id === enquiryId)
      if (!enquiry) return

      const bookingData = {
        vendorId: vendor.id,
        coupleId: enquiry.coupleId,
        coupleName: enquiry.coupleName,
        amount: parseFloat(bookingForm.amount),
        currency: bookingForm.currency,
        status: 'pending',
        date: new Date(bookingForm.date),
        createdAt: new Date(),
        notes: bookingForm.notes,
        enquiryId: enquiryId
      }

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData)
      
      // Generate Flutterwave payment link (mock)
      const paymentLink = `https://flutterwave.com/pay/${bookingRef.id}`
      await updateDoc(bookingRef, { paymentLink })

      // Update enquiry status
      await updateEnquiryStatus(enquiryId, 'replied')

      // Reset form
      setConvertingEnquiry(null)
      setBookingForm({ amount: '', currency: 'USD', date: '', notes: '' })
    } catch (error) {
      console.error('Error converting to booking:', error)
    }
  }

  const confirmBooking = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId)
      await updateDoc(bookingRef, { status: 'confirmed' })
    } catch (error) {
      console.error('Error confirming booking:', error)
    }
  }

  const markAsPaid = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId)
      await updateDoc(bookingRef, { status: 'paid' })
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    try {
      const bookingRef = doc(db, 'bookings', bookingId)
      await updateDoc(bookingRef, { status: 'cancelled' })
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const copyPaymentLink = (link: string) => {
    navigator.clipboard.writeText(link)
    // Show toast notification (mock)
    console.log('Payment link copied to clipboard')
  }

  const deleteEnquiry = async (enquiryId: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return
    
    try {
      const enquiryRef = doc(db, 'enquiries', enquiryId)
      await updateDoc(enquiryRef, { status: 'deleted' })
    } catch (error) {
      console.error('Error deleting enquiry:', error)
    }
  }

  const exportBookingsAsCSV = () => {
    const csv = [
      ['Couple Name', 'Amount', 'Status', 'Date', 'Created'],
      ...bookings.map(b => [
        b.coupleName,
        `${b.currency} ${b.amount}`,
        b.status,
        b.date.toLocaleDateString(),
        b.createdAt.toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookings.csv'
    a.click()
  }

  const generateReply = async (enquiry: any) => {
    try {
      const res = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryMessage: enquiry.message,
          businessName: vendor?.businessName,
          category: vendor?.category,
          minPrice: vendor?.minPrice,
          currency: vendor?.currency,
        })
      })
      const data = await res.json()
      setEnquiries(prev => prev.map(e => 
        e.id === enquiry.id ? { ...e, replyText: data.reply || '' } : e
      ))
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#faeeda', color: '#633806', border: '#fac775' }
      case 'replied':
      case 'confirmed':
        return { bg: '#e8f5e0', color: '#3b6d11', border: '#c0dd97' }
      case 'paid':
        return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
      case 'closed':
      case 'cancelled':
        return { bg: '#f0efef', color: '#5f5e5a', border: '#d1d5db' }
      default:
        return { bg: '#f0efef', color: '#5f5e5a', border: '#d1d5db' }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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

  // Filter and paginate data
  const filteredEnquiries = enquiries
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => !searchTerm || e.coupleName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === 'newest' 
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime()
    )

  const filteredBookings = bookings
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => !searchTerm || b.coupleName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === 'newest' 
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime()
    )

  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = activeTab === 'enquiries' 
    ? Math.ceil(filteredEnquiries.length / itemsPerPage)
    : Math.ceil(filteredBookings.length / itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f4ff' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      {/* KUNDA NAVBAR */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: '#ffffff',
        borderBottom: '1px solid #e5edff'
      }}>
        {/* Left - Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            border: '1.5px solid #1a56db',
            marginRight: '12px'
          }}></div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '20px',
            color: '#1a56db',
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
              color: '#6b7280',
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
              color: '#6b7280',
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
              color: '#1a56db',
              textDecoration: 'none'
            }}
          >
            Bookings
          </a>
          <a 
            href="/dashboard/vendor/analytics" 
            style={{
              fontFamily: 'Urbanist',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#6b7280',
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
            background: '#dbeafe',
            border: '1px solid #3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: '#1a56db',
              fontSize: '13px',
              fontFamily: 'Urbanist',
              fontWeight: 500
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '13px',
            color: '#1a56db'
          }}>
            {user?.email}
          </span>
          <button
            onClick={() => {
              window.location.href = '/login'
            }}
            style={{
              border: '1px solid #1a56db',
              color: '#b08850',
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

      {/* Page Title */}
      <div style={{ padding: '48px 32px 32px' }}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ 
          color: '#1a56db', 
          fontFamily: 'Urbanist', 
          fontWeight: 700,
          letterSpacing: '0.15em',
          fontSize: '12px'
        }}>
          Enquiries & Bookings Management
        </div>
        <h1 
          className="text-4xl font-light mb-3" 
          style={{ 
            fontFamily: 'Urbanist', 
            color: '#0f2460', 
            fontWeight: 800,
            fontSize: '36px'
          }}
        >
          Manage Your Business
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-8">

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          <div className="border" style={{ backgroundColor: '#ffffff', borderColor: '#e5edff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: 'Urbanist', letterSpacing: '0.15em', color: '#6b7280', fontWeight: 700, fontSize: '11px' }}>
              Pending Enquiries
            </div>
            <div className="text-3xl font-light mb-1" style={{ fontFamily: 'Urbanist', color: '#0f2460', fontWeight: 900, fontSize: '48px' }}>
              {enquiries.filter(e => e.status === 'pending').length}
            </div>
          </div>
          
          <div className="border" style={{ backgroundColor: '#ffffff', borderColor: '#e5edff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: 'Urbanist', letterSpacing: '0.15em', color: '#6b7280', fontWeight: 700, fontSize: '11px' }}>
              Replied
            </div>
            <div className="text-3xl font-light mb-1" style={{ fontFamily: 'Urbanist', color: '#0f2460', fontWeight: 900, fontSize: '48px' }}>
              {enquiries.filter(e => e.status === 'replied').length}
            </div>
          </div>

          <div className="border" style={{ backgroundColor: '#ffffff', borderColor: '#e5edff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: 'Urbanist', letterSpacing: '0.15em', color: '#6b7280', fontWeight: 700, fontSize: '11px' }}>
              Total Bookings
            </div>
            <div className="text-3xl font-light mb-1" style={{ fontFamily: 'Urbanist', color: '#0f2460', fontWeight: 900, fontSize: '48px' }}>
              {bookings.length}
            </div>
          </div>

          <div className="border" style={{ backgroundColor: '#ffffff', borderColor: '#e5edff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: 'Urbanist', letterSpacing: '0.15em', color: '#6b7280', fontWeight: 700, fontSize: '11px' }}>
              Total Revenue
            </div>
            <div className="text-3xl font-light mb-1" style={{ fontFamily: 'Urbanist', color: '#0f2460', fontWeight: 900, fontSize: '48px' }}>
              ${totalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="border" style={{ backgroundColor: '#ffffff', borderColor: '#e5edff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: 'Urbanist', letterSpacing: '0.15em', color: '#6b7280', fontWeight: 700, fontSize: '11px' }}>
              Response Rate
            </div>
            <div className="text-3xl font-light mb-1" style={{ fontFamily: 'Urbanist', color: '#0f2460', fontWeight: 900, fontSize: '48px' }}>
              {responseRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6" style={{ borderBottom: '1px solid #e5edff' }}>
          <button
            onClick={() => setActiveTab('enquiries')}
            className="pb-3 text-sm font-medium transition-colors"
            style={{
              fontFamily: 'Urbanist',
              color: activeTab === 'enquiries' ? '#1a56db' : '#6b7280',
              borderBottom: activeTab === 'enquiries' ? '2px solid #1a56db' : 'none'
            }}
          >
            Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className="pb-3 text-sm font-medium transition-colors"
            style={{
              fontFamily: 'Urbanist',
              color: activeTab === 'bookings' ? '#1a56db' : '#6b7280',
              borderBottom: activeTab === 'bookings' ? '2px solid #1a56db' : 'none'
            }}
          >
            Bookings ({bookings.length})
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search by couple name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{
                  border: '1px solid #e5edff',
                  background: '#ffffff',
                  padding: '10px 14px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  color: '#111928',
                  width: '250px',
                  borderRadius: '8px'
                }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                border: '1px solid #e5edff',
                background: '#ffffff',
                padding: '10px 14px',
                fontFamily: 'Urbanist',
                fontSize: '14px',
                color: '#111928',
                borderRadius: '8px'
              }}
            >
              <option value="all">All Status</option>
              {activeTab === 'enquiries' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              style={{
                border: '1px solid #e5edff',
                background: '#ffffff',
                padding: '10px 14px',
                fontFamily: 'Urbanist',
                fontSize: '14px',
                color: '#111928',
                borderRadius: '8px'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {activeTab === 'bookings' && (
            <button
              onClick={exportBookingsAsCSV}
              className="flex items-center text-xs px-4 py-2"
              style={{
                fontFamily: 'Urbanist',
                background: '#e0e7ff',
                color: '#3498db',
                border: '0.5px solid #93c5fd',
                cursor: 'pointer'
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}', padding: '24px' }}>

          {activeTab === 'enquiries' ? (
            <>
              <h2 className="text-lg font-medium mb-6" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '12px' }}>
                Recent Enquiries
              </h2>
              
              {paginatedEnquiries.length > 0 ? (
                <div className="space-y-4">
                  {paginatedEnquiries.map((enquiry) => {
                    const statusColors = getStatusColor(enquiry.status)
                    return (
                      <div key={enquiry.id} className="border p-4" style={{ borderColor: 'rgba(180,140,90,0.15)' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontSize: '14px' }}>
                                {enquiry.coupleName || 'Anonymous Couple'}
                              </h3>
                              <div 
                                className="text-xs px-2 py-1"
                                style={{
                                  fontFamily: 'Urbanist',
                                  background: statusColors.bg,
                                  color: statusColors.color,
                                  border: `0.5px solid ${statusColors.border}`
                                }}
                              >
                                {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                              </div>
                              <div className="flex items-center text-xs" style={{ fontFamily: 'Urbanist', color: '#9ca3af' }}>
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimeAgo(enquiry.createdAt)}
                              </div>
                            </div>
                            
                            <p style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                              {enquiry.expanded ? enquiry.message : `${enquiry.message.substring(0, 65)}${enquiry.message.length > 65 ? '...' : ''}`}
                            </p>
                            
                            {enquiry.message.length > 65 && (
                              <button
                                onClick={() => setEnquiries(prev => prev.map(e => 
                                  e.id === enquiry.id ? { ...e, expanded: !e.expanded } : e
                                ))}
                                className="text-xs mb-3"
                                style={{ fontFamily: 'Urbanist', color: '#1a56db', cursor: 'pointer' }}
                              >
                                {enquiry.expanded ? 'Show less' : 'Read more'}
                              </button>
                            )}

                            {enquiry.expanded && (
                              <div className="mt-3 space-y-3">
                                <textarea
                                  value={enquiry.replyText || ''}
                                  onChange={(e) => setEnquiries(prev => prev.map(enq => 
                                    enq.id === enquiry.id ? { ...enq, replyText: (e.target as HTMLTextAreaElement).value } : enq
                                  ))}
                                  placeholder="Type your reply..."
                                  className="w-full"
                                  style={{
                                    border: '1px solid #1a56db',
                                    background: '#e0e7ff',
                                    padding: '10px 14px',
                                    fontFamily: 'Urbanist',
                                    fontSize: '13px',
                                    color: '#3a2a1a',
                                    resize: 'vertical',
                                    minHeight: '80px'
                                  }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => replyToEnquiry(enquiry.id)}
                                    disabled={!enquiry.replyText?.trim()}
                                    className="flex items-center text-xs px-4 py-2"
                                    style={{
                                      fontFamily: 'Urbanist',
                                      background: enquiry.replyText?.trim() ? '#7a5c30' : '#f0e4d0',
                                      color: enquiry.replyText?.trim() ? '#fdf9f5' : '#9a7850',
                                      border: '1px solid #1a56db',
                                      cursor: enquiry.replyText?.trim() ? 'pointer' : 'not-allowed'
                                    }}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Reply
                                  </button>
                                  <button
                                    onClick={() => generateReply(enquiry)}
                                    className="text-xs px-4 py-2"
                                    style={{
                                      fontFamily: 'Urbanist',
                                      background: 'linear-gradient(135deg,#1a56db,#3f83f8)',
                                      color: '#fff',
                                      border: '1px solid #1a56db',
                                      cursor: 'pointer'
                                    }}
                                  >
                                     AI Reply
                                  </button>
                                  <button
                                    onClick={() => updateEnquiryStatus(enquiry.id, 'replied')}
                                    className="text-xs px-4 py-2"
                                    style={{
                                      fontFamily: 'Urbanist',
                                      background: '#e8f5e0',
                                      color: '#3b6d11',
                                      border: '0.5px solid #c0dd97',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Mark as Replied
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {enquiry.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setConvertingEnquiry(enquiry.id)}
                                className="flex items-center text-xs px-4 py-2"
                                style={{
                                  fontFamily: 'Urbanist',
                                  background: '#7a5c30',
                                  color: '#fdf9f5',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Convert to Booking
                              </button>
                              <button
                                onClick={() => deleteEnquiry(enquiry.id)}
                                className="text-xs px-4 py-2"
                                style={{
                                  fontFamily: 'Urbanist',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '0.5px solid #fecaca',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {enquiry.status === 'replied' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry.id, 'closed')}
                              className="text-xs px-4 py-2"
                              style={{
                                fontFamily: 'Urbanist',
                                background: '#f0efef',
                                color: '#5f5e5a',
                                border: '0.5px solid #d1d5db',
                                cursor: 'pointer'
                              }}
                            >
                              Close
                            </button>
                          )}
                        </div>

                        {/* Convert to Booking Form */}
                        {convertingEnquiry === enquiry.id && (
                          <div className="mt-4 p-4" style={{ background: '#e0e7ff', border: '1px solid rgba(180,140,90,0.15)' }}>
                            <h4 className="font-medium mb-3" style={{ fontFamily: 'Urbanist', color: '#3a2a1a' }}>
                              Convert to Booking
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-xs uppercase mb-1" style={{ fontFamily: 'Urbanist', color: '#6b7280' }}>
                                  Amount *
                                </label>
                                <input
                                  type="number"
                                  value={bookingForm.amount}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, amount: e.target.value }))}
                                  placeholder="1000"
                                  style={{
                                    border: '1px solid rgba(180,140,90,0.3)',
                                    background: '#ffffff',
                                    padding: '8px 12px',
                                    fontFamily: 'Urbanist',
                                    fontSize: '13px',
                                    color: '#3a2a1a',
                                    width: '100%'
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs uppercase mb-1" style={{ fontFamily: 'Urbanist', color: '#6b7280' }}>
                                  Currency
                                </label>
                                <select
                                  value={bookingForm.currency}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, currency: e.target.value }))}
                                  style={{
                                    border: '1px solid rgba(180,140,90,0.3)',
                                    background: '#ffffff',
                                    padding: '8px 12px',
                                    fontFamily: 'Urbanist',
                                    fontSize: '13px',
                                    color: '#3a2a1a',
                                    width: '100%'
                                  }}
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="RWF">RWF</option>
                                </select>
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs uppercase mb-1" style={{ fontFamily: 'Urbanist', color: '#6b7280' }}>
                                Booking Date *
                              </label>
                              <input
                                type="date"
                                value={bookingForm.date}
                                onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                                style={{
                                  border: '1px solid rgba(180,140,90,0.3)',
                                  background: '#ffffff',
                                  padding: '8px 12px',
                                  fontFamily: 'Urbanist',
                                  fontSize: '13px',
                                  color: '#3a2a1a',
                                  width: '100%'
                                }}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs uppercase mb-1" style={{ fontFamily: 'Urbanist', color: '#6b7280' }}>
                                Notes
                              </label>
                              <textarea
                                value={bookingForm.notes}
                                onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes for the booking..."
                                rows={3}
                                style={{
                                  border: '1px solid rgba(180,140,90,0.3)',
                                  background: '#ffffff',
                                  padding: '8px 12px',
                                  fontFamily: 'Urbanist',
                                  fontSize: '13px',
                                  color: '#3a2a1a',
                                  width: '100%',
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => convertToBooking(enquiry.id)}
                                disabled={!bookingForm.amount || !bookingForm.date}
                                className="text-xs px-4 py-2"
                                style={{
                                  fontFamily: 'Urbanist',
                                  background: bookingForm.amount && bookingForm.date ? '#7a5c30' : '#f0e4d0',
                                  color: bookingForm.amount && bookingForm.date ? '#fdf9f5' : '#9a7850',
                                  border: '1px solid #1a56db',
                                  cursor: bookingForm.amount && bookingForm.date ? 'pointer' : 'not-allowed'
                                }}
                              >
                                Create Booking
                              </button>
                              <button
                                onClick={() => {
                                  setConvertingEnquiry(null)
                                  setBookingForm({ amount: '', currency: 'USD', date: '', notes: '' })
                                }}
                                className="text-xs px-4 py-2"
                                style={{
                                  fontFamily: 'Urbanist',
                                  background: 'transparent',
                                  color: '#1a56db',
                                  border: '1px solid #1a56db',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare size={48} style={{ color: '#9ca3af' }} className="mx-auto mb-4" />
                  <h3 className="text-xl font-light mb-3" style={{ fontFamily: 'Urbanist', color: '#6b7280', fontWeight: 300, fontSize: '20px' }}>
                    No enquiries found
                  </h3>
                  <p style={{ fontFamily: 'Urbanist', color: '#9ca3af', fontSize: '13px' }}>
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Your enquiries from couples will appear here'
                    }
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-6" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '12px' }}>
                Bookings Management
              </h2>
              
              {paginatedBookings.length > 0 ? (
                <>
                  {/* Bookings Table */}
                  <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5edff' }}>
                          <th className="text-left pb-3" style={{ fontFamily: 'Urbanist', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280' }}>
                            Couple Name
                          </th>
                          <th className="text-left pb-3" style={{ fontFamily: 'Urbanist', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280' }}>
                            Amount
                          </th>
                          <th className="text-left pb-3" style={{ fontFamily: 'Urbanist', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280' }}>
                            Status
                          </th>
                          <th className="text-left pb-3" style={{ fontFamily: 'Urbanist', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280' }}>
                            Date
                          </th>
                          <th className="text-left pb-3" style={{ fontFamily: 'Urbanist', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.map((booking) => {
                          const statusColors = getStatusColor(booking.status)
                          return (
                            <tr key={booking.id} style={{ borderBottom: '0.5px solid rgba(180,140,90,0.15)' }}>
                              <td className="py-4" style={{ fontFamily: 'Urbanist', fontSize: '13px', color: '#3a2a1a' }}>
                                {booking.coupleName}
                              </td>
                              <td className="py-4" style={{ fontFamily: 'Urbanist', fontSize: '13px', color: '#3a2a1a' }}>
                                {booking.currency} {booking.amount.toLocaleString()}
                              </td>
                              <td className="py-4">
                                <div 
                                  className="text-xs px-2 py-1 inline-block"
                                  style={{
                                    fontFamily: 'Urbanist',
                                    background: statusColors.bg,
                                    color: statusColors.color,
                                    border: `0.5px solid ${statusColors.border}`
                                  }}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </div>
                              </td>
                              <td className="py-4" style={{ fontFamily: 'Urbanist', fontSize: '13px', color: '#3a2a1a' }}>
                                {formatDate(booking.date)}
                              </td>
                              <td className="py-4">
                                <div className="flex gap-2">
                                  {booking.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => confirmBooking(booking.id)}
                                        className="text-xs px-3 py-1"
                                        style={{
                                          fontFamily: 'Urbanist',
                                          background: '#e8f5e0',
                                          color: '#3b6d11',
                                          border: '0.5px solid #c0dd97',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => cancelBooking(booking.id)}
                                        className="text-xs px-3 py-1"
                                        style={{
                                          fontFamily: 'Urbanist',
                                          background: '#fef2f2',
                                          color: '#dc2626',
                                          border: '0.5px solid #fecaca',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  
                                  {booking.status === 'confirmed' && (
                                    <>
                                      <button
                                        onClick={() => copyPaymentLink(booking.paymentLink || '')}
                                        className="flex items-center text-xs px-3 py-1"
                                        style={{
                                          fontFamily: 'Urbanist',
                                          background: '#dbeafe',
                                          color: '#1e40af',
                                          border: '0.5px solid #93c5fd',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy Link
                                      </button>
                                      <button
                                        onClick={() => markAsPaid(booking.id)}
                                        className="text-xs px-3 py-1"
                                        style={{
                                          fontFamily: 'Urbanist',
                                          background: '#e8f5e0',
                                          color: '#3b6d11',
                                          border: '0.5px solid #c0dd97',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Mark Paid
                                      </button>
                                    </>
                                  )}
                                  
                                  <button
                                    className="text-xs px-3 py-1"
                                    style={{
                                      fontFamily: 'Urbanist',
                                      background: 'transparent',
                                      color: '#1a56db',
                                      border: '1px solid #1a56db',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} style={{ color: '#9ca3af' }} className="mx-auto mb-4" />
                  <h3 className="text-xl font-light mb-3" style={{ fontFamily: 'Urbanist', color: '#6b7280', fontWeight: 300, fontSize: '20px' }}>
                    No bookings found
                  </h3>
                  <p style={{ fontFamily: 'Urbanist', color: '#9ca3af', fontSize: '13px' }}>
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Your bookings will appear here once you convert enquiries'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-xs px-3 py-1"
                style={{
                  fontFamily: 'Urbanist',
                  background: currentPage === 1 ? '#f0e4d0' : 'transparent',
                  color: currentPage === 1 ? '#9a7850' : '#7a5c30',
                  border: '1px solid #1a56db',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="text-xs px-3 py-1"
                  style={{
                    fontFamily: 'Urbanist',
                    background: currentPage === page ? '#7a5c30' : 'transparent',
                    color: currentPage === page ? '#fdf9f5' : '#7a5c30',
                    border: '1px solid #1a56db',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-xs px-3 py-1"
                style={{
                  fontFamily: 'Urbanist',
                  background: currentPage === totalPages ? '#f0e4d0' : 'transparent',
                  color: currentPage === totalPages ? '#9a7850' : '#7a5c30',
                  border: '1px solid #1a56db',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
