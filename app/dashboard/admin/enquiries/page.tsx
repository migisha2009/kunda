'use client'

// Build: v2.0 - fixed date formatting

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Enquiry } from '../../../../types'
import { MessageSquare, Search, Filter, Clock, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'


export default function AdminEnquiriesPage() {
  const { userProfile } = useAuth()
  const [enquiries, setEnquiries] = useState<(Enquiry & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'closed'>('all')

  useEffect(() => {
    loadEnquiries()
  }, [])

  const loadEnquiries = async () => {
    try {
      const enquiriesQuery = query(
        collection(db, 'enquiries'),
        orderBy('createdAt', 'desc')
      )
      
      const enquiriesSnapshot = await getDocs(enquiriesQuery)
      const enquiriesData = await Promise.all(
        enquiriesSnapshot.docs.map(async (enquiryDoc) => {
          const enquiryData = {
            id: enquiryDoc.id,
            createdAt: null,
            ...enquiryDoc.data()
          } as unknown as Enquiry

          // Convert Timestamp to Date
          if (enquiryData.createdAt instanceof Date) {
            enquiryData.createdAt = enquiryData.createdAt
          } else {
            enquiryData.createdAt = new Date(enquiryData.createdAt as any)
          }

          // Fetch couple details
          let coupleName = 'Unknown'
          let coupleEmail = 'Unknown'
          try {
            const coupleDoc = await getDoc(doc(db, 'users', enquiryData.coupleId))
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
            const vendorDoc = await getDoc(doc(db, 'vendors', enquiryData.vendorId))
            if (vendorDoc.exists()) {
              const vendorData = vendorDoc.data() as any
              vendorName = vendorData.businessName
              vendorEmail = vendorData.email
            }
          } catch (error) {
            console.error('Error fetching vendor details:', error)
          }

          return {
            ...enquiryData,
            coupleName,
            vendorName,
            coupleEmail,
            vendorEmail
          }
        })
      )

      setEnquiries(enquiriesData)
    } catch (error) {
      console.error('Error loading enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.coupleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.coupleEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.vendorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiry Overview</h1>
          <p className="text-gray-600">Monitor all enquiries between couples and vendors</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'replied' | 'closed')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Enquiries Table */}
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
                    Message
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
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enquiry.coupleName}</div>
                        <div className="text-xs text-gray-500">{enquiry.coupleEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enquiry.vendorName}</div>
                        <div className="text-xs text-gray-500">{enquiry.vendorEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900" title={enquiry.message}>
                          {truncateMessage(enquiry.message)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(enquiry.status)}
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enquiry.status)}`}>
                          {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(enquiry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEnquiries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No enquiries found matching your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Enquiries</span>
              <span className="text-lg font-bold text-gray-900">{enquiries.length}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-bold text-yellow-600">
                {enquiries.filter(e => e.status === 'pending').length}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Replied</span>
              <span className="text-lg font-bold text-green-600">
                {enquiries.filter(e => e.status === 'replied').length}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-lg font-bold text-red-600">
                {enquiries.filter(e => e.status === 'closed').length}
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
