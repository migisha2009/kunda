'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, getDocs } from 'firebase/firestore'
import { Enquiry } from '../../../../types'
import { db } from '../../../../lib/firebase'
import { Store, MessageSquare, ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface EnquiryWithVendor extends Enquiry {
  vendorName?: string
  vendorCategory?: string
}

export default function CoupleVendorsPage() {
  const { user, userProfile } = useAuth()
  const [enquiries, setEnquiries] = useState<EnquiryWithVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    
    // Set up real-time listener for enquiries
    const enquiriesQuery = query(
      collection(db, 'enquiries'),
      where('coupleId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(enquiriesQuery, async (snapshot) => {
      const enquiriesData: EnquiryWithVendor[] = []
      
      for (const enquiryDoc of snapshot.docs) {
        const enquiryData = {
          id: enquiryDoc.id,
          ...enquiryDoc.data()
        } as EnquiryWithVendor

        // Convert Timestamp to Date
        if (enquiryData.createdAt instanceof Date) {
          enquiryData.createdAt = enquiryData.createdAt
        } else {
          enquiryData.createdAt = new Date(enquiryData.createdAt as any)
        }

        // Fetch vendor details
        try {
          const vendorDoc = await getDoc(doc(db, 'vendors', enquiryData.vendorId))
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data() as any
            if (vendorData) {
              enquiryData.vendorName = vendorData.businessName
              enquiryData.vendorCategory = vendorData.category
            }
          }
        } catch (error) {
          console.error('Error fetching vendor details:', error)
        }

        enquiriesData.push(enquiryData)
      }

      setEnquiries(enquiriesData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Enquiries</h1>
          <p className="text-gray-600">Track your communications with wedding vendors</p>
        </div>

        {/* Enquiries List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Enquiries</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {enquiries.length > 0 ? (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(enquiry.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(enquiry.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Vendor</p>
                      <p className="font-medium text-gray-900">{enquiry.vendorName || 'Loading...'}</p>
                      <p className="text-xs text-gray-500">{enquiry.vendorCategory || 'Service'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-gray-900">{enquiry.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{enquiry.message}</p>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <a
                      href={`/vendors/${enquiry.vendorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Vendor Profile
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries yet</h3>
                <p className="text-gray-600 mb-6">
                  Start browsing vendors and sending enquiries to see them here
                </p>
                <a
                  href="/vendors"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Vendors
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
