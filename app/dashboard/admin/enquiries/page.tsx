'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, query, getDocs, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Enquiry, User, Vendor } from '../../../../types'
import { MessageSquare, Search, Filter, Clock, CheckCircle, XCircle, ExternalLink, Loader2, Eye, Download, ChevronLeft, ChevronRight, ArrowUpDown, AlertTriangle, Flag, Mail } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'


export default function AdminEnquiriesPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [enquiries, setEnquiries] = useState<(Enquiry & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
    coupleUser?: User;
    vendorProfile?: Vendor;
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'closed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showEnquiryModal, setShowEnquiryModal] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<(Enquiry & { 
    coupleName?: string; 
    vendorName?: string;
    coupleEmail?: string;
    vendorEmail?: string;
    coupleUser?: User;
    vendorProfile?: Vendor;
  }) | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [flaggedEnquiries, setFlaggedEnquiries] = useState<string[]>([])
  const enquiriesPerPage = 10

  useEffect(() => {
    loadEnquiries()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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


          // Fetch couple details
          let coupleName = 'Unknown'
          let coupleEmail = 'Unknown'
          let coupleUser: User | undefined
          try {
            const coupleDoc = await getDoc(doc(db, 'users', enquiryData.coupleId))
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
            const vendorDoc = await getDoc(doc(db, 'vendors', enquiryData.vendorId))
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
            ...enquiryData,
            coupleName,
            vendorName,
            coupleEmail,
            vendorEmail,
            coupleUser,
            vendorProfile
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

  const sortedEnquiries = [...filteredEnquiries].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedEnquiries = sortedEnquiries.slice(
    (currentPage - 1) * enquiriesPerPage,
    currentPage * enquiriesPerPage
  )

  const totalPages = Math.ceil(filteredEnquiries.length / enquiriesPerPage)

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const updateEnquiryStatus = async (enquiryId: string, newStatus: string) => {
    setUpdating(enquiryId)
    try {
      await updateDoc(doc(db, 'enquiries', enquiryId), { status: newStatus })
      setEnquiries(prev => prev.map(enquiry => 
        enquiry.id === enquiryId ? { ...enquiry, status: newStatus as any } : enquiry
      ))
    } catch (error) {
      console.error('Error updating enquiry status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const deleteEnquiry = async (enquiryId: string) => {
    if (!confirm('Are you sure you want to delete this enquiry? This cannot be undone.')) return
    
    try {
      await deleteDoc(doc(db, 'enquiries', enquiryId))
      setEnquiries(prev => prev.filter(e => e.id !== enquiryId))
    } catch (error) {
      console.error('Error deleting enquiry:', error)
    }
  }

  const flagEnquiry = (enquiryId: string) => {
    setFlaggedEnquiries(prev => 
      prev.includes(enquiryId) 
        ? prev.filter(id => id !== enquiryId)
        : [...prev, enquiryId]
    )
  }

  const loadEnquiryDetails = (enquiry: typeof selectedEnquiry) => {
    setSelectedEnquiry(enquiry)
    setShowEnquiryModal(true)
  }

  const exportToCSV = () => {
    const headers = ['Couple', 'Vendor', 'Message', 'Status', 'Date', 'Flagged']
    const csvData = filteredEnquiries.map(enquiry => [
      enquiry.coupleName || 'Unknown',
      enquiry.vendorName || 'Unknown',
      enquiry.message,
      enquiry.status,
      formatDate(enquiry.createdAt),
      flaggedEnquiries.includes(enquiry.id) ? 'Yes' : 'No'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'enquiries.csv'
    a.click()
  }

  const getMostActiveCouples = () => {
    const coupleCounts: { [key: string]: number } = {}
    enquiries.forEach(enquiry => {
      const coupleName = enquiry.coupleName || 'Unknown'
      coupleCounts[coupleName] = (coupleCounts[coupleName] || 0) + 1
    })
    return Object.entries(coupleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getMostEnquiredVendors = () => {
    const vendorCounts: { [key: string]: number } = {}
    enquiries.forEach(enquiry => {
      const vendorName = enquiry.vendorName || 'Unknown'
      vendorCounts[vendorName] = (vendorCounts[vendorName] || 0) + 1
    })
    return Object.entries(vendorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
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
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
      case 'replied':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }
      case 'closed':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af' }
    }
  }

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1a56db' }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1a56db' }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: '#dbeafe' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl" style={{ fontFamily: 'Urbanist', color: '#111928', fontWeight: 800, fontSize: '28px' }}>Enquiry Overview</h1>
                <p className="text-sm mt-2" style={{ color: '#6b7280' }}>Monitor all enquiries between couples and vendors</p>
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{ border: '0.5px solid #b08850', color: '#1a56db' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 mb-6" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6b7280' }} />
                  <input
                    type="text"
                    placeholder="Search enquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded focus:outline-none"
                    style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8', color: '#3a2a1a' }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'replied' | 'closed')}
                  className="px-4 py-2 text-sm font-medium rounded focus:outline-none"
                  style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8', color: '#3a2a1a' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Total enquiries count */}
            <div className="mb-4">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Total enquiries: <span className="font-medium" style={{ color: '#3a2a1a' }}>{filteredEnquiries.length}</span>
              </p>
            </div>

            {/* Enquiries Table */}
            <div style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#f7f8fd' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
                        From (Couple)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
                        To (Vendor)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
                        Message Preview
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#6b7280', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#6b7280', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#94a3b8' }}>
                    {paginatedEnquiries.map((enquiry) => {
                      const statusColors = getStatusColor(enquiry.status)
                      return (
                        <tr 
                          key={enquiry.id} 
                          className="hover:bg-blue-50" 
                          style={{ backgroundColor: 'transparent' }} 
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} 
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadEnquiryDetails(enquiry)}>
                                {enquiry.coupleName}
                              </div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>{enquiry.coupleEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadEnquiryDetails(enquiry)}>
                                {enquiry.vendorName}
                              </div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>{enquiry.vendorEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p 
                                className="text-sm cursor-pointer" 
                                style={{ color: '#3a2a1a' }} 
                                onClick={() => loadEnquiryDetails(enquiry)}
                                title={enquiry.message}
                              >
                                {truncateMessage(enquiry.message)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(enquiry.status)}
                              <span 
                                className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold"
                                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                              >
                                {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6b7280' }}>
                            {formatDate(enquiry.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => loadEnquiryDetails(enquiry)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#1a56db' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={enquiry.status}
                                onChange={(e) => updateEnquiryStatus(enquiry.id, e.target.value)}
                                disabled={updating === enquiry.id}
                                className="px-2 py-1 text-xs rounded focus:outline-none disabled:opacity-50"
                                style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8', color: '#3a2a1a' }}
                              >
                                <option value="pending">Pending</option>
                                <option value="replied">Replied</option>
                                <option value="closed">Closed</option>
                              </select>
                              <button
                                onClick={() => flagEnquiry(enquiry.id)}
                                className="p-1 rounded transition-colors"
                                style={{ color: flaggedEnquiries.includes(enquiry.id) ? '#dc2626' : '#9a7850' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteEnquiry(enquiry.id)}
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
                
                {filteredEnquiries.length === 0 && (
                  <div className="text-center py-8" style={{ color: '#6b7280' }}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No enquiries found matching your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: '#94a3b8' }}>
                  <div className="text-sm" style={{ color: '#6b7280' }}>
                    Showing {((currentPage - 1) * enquiriesPerPage) + 1} to {Math.min(currentPage * enquiriesPerPage, filteredEnquiries.length)} of {filteredEnquiries.length} enquiries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#1a56db' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#1a56db' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
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
              <div className="p-4" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#6b7280' }}>Total Enquiries</span>
                  <span className="text-lg font-medium" style={{ color: '#3a2a1a' }}>{enquiries.length}</span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#6b7280' }}>Pending</span>
                  <span className="text-lg font-medium" style={{ color: '#f59e0b' }}>
                    {enquiries.filter(e => e.status === 'pending').length}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#6b7280' }}>Replied</span>
                  <span className="text-lg font-medium" style={{ color: '#22c55e' }}>
                    {enquiries.filter(e => e.status === 'replied').length}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#6b7280' }}>Closed</span>
                  <span className="text-lg font-medium" style={{ color: '#ef4444' }}>
                    {enquiries.filter(e => e.status === 'closed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Most Active Couples */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Urbanist', color: '#111928', fontWeight: 700, fontSize: '18px' }}>Most Active Couples</h3>
                <div className="space-y-2">
                  {getMostActiveCouples().map(([couple, count]) => (
                    <div key={couple} className="flex items-center justify-between p-3" style={{ backgroundColor: '#f7f8fd' }}>
                      <span className="text-sm" style={{ color: '#6b7280' }}>{couple}</span>
                      <span className="text-sm font-medium" style={{ color: '#3a2a1a' }}>{count} enquiries</span>
                    </div>
                  ))}
                  {getMostActiveCouples().length === 0 && (
                    <div className="text-center py-4" style={{ color: '#6b7280' }}>
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Most Enquired Vendors */}
              <div className="p-6" style={{ backgroundColor: '#f7f8fd', border: '0.5px solid #94a3b8' }}>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Urbanist', color: '#111928', fontWeight: 700, fontSize: '18px' }}>Most Enquired Vendors</h3>
                <div className="space-y-2">
                  {getMostEnquiredVendors().map(([vendor, count]) => (
                    <div key={vendor} className="flex items-center justify-between p-3" style={{ backgroundColor: '#f7f8fd' }}>
                      <span className="text-sm" style={{ color: '#6b7280' }}>{vendor}</span>
                      <span className="text-sm font-medium" style={{ color: '#3a2a1a' }}>{count} enquiries</span>
                    </div>
                  ))}
                  {getMostEnquiredVendors().length === 0 && (
                    <div className="text-center py-4" style={{ color: '#6b7280' }}>
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enquiry Detail Modal */}
            {showEnquiryModal && selectedEnquiry && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowEnquiryModal(false)} />
                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '0.5px solid ${colors.border}' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl" style={{ fontFamily: 'Urbanist', color: '#111928', fontWeight: 700, fontSize: '18px' }}>Enquiry Details</h2>
                      <button
                        onClick={() => setShowEnquiryModal(false)}
                        className="p-2 rounded transition-colors"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>From (Couple)</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedEnquiry.coupleName}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{selectedEnquiry.coupleEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>To (Vendor)</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedEnquiry.vendorName}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{selectedEnquiry.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>Status</p>
                        <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1`} style={{ 
                          backgroundColor: getStatusColor(selectedEnquiry.status).bg,
                          color: getStatusColor(selectedEnquiry.status).text
                        }}>
                          {selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>Date</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{formatDate(selectedEnquiry.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>Message</p>
                      <div className="p-4" style={{ backgroundColor: '#f7f8fd' }}>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#3a2a1a' }}>{selectedEnquiry.message}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedEnquiry.status}
                        onChange={(e) => {
                          updateEnquiryStatus(selectedEnquiry.id, e.target.value)
                          setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value as any })
                        }}
                        disabled={updating === selectedEnquiry.id}
                        className="px-4 py-2 text-sm font-medium rounded focus:outline-none disabled:opacity-50"
                        style={{ backgroundColor: '#f7f8fd', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="replied">Replied</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => window.location.href = `mailto:${selectedEnquiry.coupleEmail}`}
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ backgroundColor: '#7a5c30', color: '#fdf9f5' }}
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Couple
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${selectedEnquiry.vendorEmail}`}
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ border: '0.5px solid #b08850', color: '#1a56db' }}
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Vendor
                      </button>
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
