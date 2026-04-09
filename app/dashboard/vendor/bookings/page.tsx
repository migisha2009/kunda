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
  Timestamp
} from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Enquiry } from '../../../../types'
import { MessageSquare, Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react'

export default function VendorBookingsPage() {
  const { user } = useAuth()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadVendorAndEnquiries()
    }
  }, [user])

  const loadVendorAndEnquiries = async () => {
    if (!user) return

    try {
      // Get vendor profile
      const vendorData = await getVendorByUserId(user.uid)
      setVendor(vendorData)

      if (vendorData) {
        // Set up real-time listener for enquiries
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', vendorData.id),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(enquiriesQuery, (snapshot) => {
          const enquiriesData: Enquiry[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            enquiriesData.push({
              id: doc.id,
              vendorId: data.vendorId,
              coupleId: data.coupleId,
              message: data.message,
              status: data.status,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
            })
          })
          setEnquiries(enquiriesData)
        })

        return unsubscribe
      }
    } catch (error) {
      console.error('Error loading vendor and enquiries:', error)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'replied':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'replied':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiries & Bookings</h1>
          <p className="text-gray-600">Manage client enquiries and track your bookings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Enquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enquiries.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enquiries.filter(e => e.status === 'replied').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enquiries</p>
                <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Enquiries List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Enquiries</h2>
          </div>
          
          {enquiries.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(enquiry.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enquiry.status)}`}>
                          {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(enquiry.createdAt)}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-900 whitespace-pre-wrap">{enquiry.message}</p>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        Couple ID: {enquiry.coupleId}
                      </div>
                    </div>
                    
                    {enquiry.status === 'pending' && (
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => updateEnquiryStatus(enquiry.id, 'replied')}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark as Replied
                        </button>
                        <button
                          onClick={() => updateEnquiryStatus(enquiry.id, 'closed')}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries yet</h3>
              <p className="text-gray-600">When couples send you enquiries, they'll appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
