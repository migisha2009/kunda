'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Vendor, Booking } from '../../../../types'
import { Store, Search, Filter, Check, X, ExternalLink, Loader2, Star, Eye, Trash2, Ban, Mail, Download, Plus, ChevronLeft, ChevronRight, ArrowUpDown, MoreVertical } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'


export default function AdminVendorsPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'joined' | 'revenue'>('joined')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [vendorBookings, setVendorBookings] = useState<Booking[]>([])
  const [vendorRevenue, setVendorRevenue] = useState(0)
  const vendorsPerPage = 10

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, verifiedFilter])

  const loadVendors = async () => {
    try {
      const vendorsQuery = query(
        collection(db, 'vendors'),
        orderBy('createdAt', 'desc')
      )
      
      const vendorsSnapshot = await getDocs(vendorsQuery)
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as Vendor[]

      setVendors(vendorsData)
    } catch (error) {
      console.error('Error loading vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (vendorId: string, currentStatus: boolean) => {
    setUpdating(vendorId)
    try {
      const vendorRef = doc(db, 'vendors', vendorId)
      await updateDoc(vendorRef, {
        verified: !currentStatus
      })
      
      // Update local state
      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, verified: !currentStatus }
          : vendor
      ))
    } catch (error) {
      console.error('Error updating vendor verification:', error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = (vendor.businessName || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || (vendor.category || '') === categoryFilter
    const matchesVerified = verifiedFilter === 'all' || 
      (verifiedFilter === 'verified' && (vendor.verified || false)) ||
      (verifiedFilter === 'unverified' && !(vendor.verified || false))
    
    return matchesSearch && matchesCategory && matchesVerified
  })

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = (a.businessName || '').localeCompare(b.businessName || '')
        break
      case 'rating':
        comparison = (b.rating || 0) - (a.rating || 0)
        break
      case 'joined':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        break
      case 'revenue':
        comparison = vendorRevenue - vendorRevenue // Will be calculated per vendor
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedVendors = sortedVendors.slice(
    (currentPage - 1) * vendorsPerPage,
    currentPage * vendorsPerPage
  )

  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage)

  const categories = Array.from(new Set(vendors.map(v => v.category)))

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const loadVendorDetails = async (vendor: Vendor) => {
    try {
      const bookingsQuery = query(collection(db, 'bookings'), where('vendorId', '==', vendor.userId))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as Booking[]
      
      const revenue = bookingsData
        .filter(booking => booking.status === 'paid')
        .reduce((sum, booking) => sum + booking.amount, 0)
      
      setVendorBookings(bookingsData)
      setVendorRevenue(revenue)
      setSelectedVendor(vendor)
      setShowVendorModal(true)
    } catch (error) {
      console.error('Error loading vendor details:', error)
    }
  }

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This cannot be undone.')) return
    
    try {
      await deleteDoc(doc(db, 'vendors', vendorId))
      setVendors(prev => prev.filter(v => v.id !== vendorId))
    } catch (error) {
      console.error('Error deleting vendor:', error)
    }
  }

  const suspendVendor = async (vendorId: string) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), { active: false })
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, active: false } : v))
    } catch (error) {
      console.error('Error suspending vendor:', error)
    }
  }

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const bulkVerify = async () => {
    for (const vendorId of selectedVendors) {
      await updateDoc(doc(db, 'vendors', vendorId), { verified: true })
    }
    setVendors(prev => prev.map(v => 
      selectedVendors.includes(v.id) ? { ...v, verified: true } : v
    ))
    setSelectedVendors([])
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedVendors.length} vendors? This cannot be undone.`)) return
    
    for (const vendorId of selectedVendors) {
      await deleteDoc(doc(db, 'vendors', vendorId))
    }
    setVendors(prev => prev.filter(v => !selectedVendors.includes(v.id)))
    setSelectedVendors([])
  }

  const exportToCSV = () => {
    const headers = ['Business Name', 'Category', 'Location', 'Rating', 'Status', 'Joined', 'Verified']
    const csvData = filteredVendors.map(vendor => [
      vendor.businessName || '',
      vendor.category || '',
      vendor.location || '',
      vendor.rating || 0,
      (vendor.verified || false) ? 'Verified' : 'Unverified',
      formatDate(vendor.createdAt),
      (vendor.verified || false) ? 'Yes' : 'No'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendors.csv'
    a.click()
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
                <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Vendor Management</h1>
                <p className="text-sm mt-2" style={{ color: '#9a7850' }}>Manage and verify wedding vendors on the platform</p>
              </div>
              <div className="flex items-center space-x-4">
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
                <button
                  onClick={() => setShowAddVendorModal(true)}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{ backgroundColor: '#7a5c30', color: '#fdf9f5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a4a25'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7a5c30'}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Vendor
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedVendors.length > 0 && (
              <div className="p-4 mb-6 flex items-center justify-between" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
                <span className="text-sm" style={{ color: '#9a7850' }}>
                  {selectedVendors.length} vendors selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={bulkVerify}
                    className="px-3 py-1 text-sm font-medium rounded transition-colors"
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  >
                    <Check className="w-3 h-3 inline mr-1" />
                    Bulk Verify
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="px-3 py-1 text-sm font-medium rounded transition-colors"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Bulk Delete
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="p-4 mb-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9a7850' }} />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded focus:outline-none"
                    style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded focus:outline-none"
                  style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {/* Verification Filter */}
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as 'all' | 'verified' | 'unverified')}
                  className="px-4 py-2 rounded focus:outline-none"
                  style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                >
                  <option value="all">All Vendors</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>
              </div>
            </div>

            {/* Total vendor count */}
            <div className="mb-4">
              <p className="text-sm" style={{ color: '#9a7850' }}>
                Total vendors: <span className="font-medium" style={{ color: '#3a2a1a' }}>{filteredVendors.length}</span>
              </p>
            </div>

            {/* Vendors Table */}
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#faf6f1' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        <input
                          type="checkbox"
                          checked={selectedVendors.length === paginatedVendors.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVendors(paginatedVendors.map(v => v.id))
                            } else {
                              setSelectedVendors([])
                            }
                          }}
                          className="rounded"
                          style={{ accentColor: '#7a5c30' }}
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center">
                          Business Name
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Location
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('rating')}
                      >
                        <div className="flex items-center">
                          Rating
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Status
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('joined')}
                      >
                        <div className="flex items-center">
                          Joined
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                    {paginatedVendors.map((vendor) => (
                      <tr 
                        key={vendor.id} 
                        className="hover:bg-gray-50" 
                        style={{ backgroundColor: 'transparent' }} 
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf6f1'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedVendors.includes(vendor.id)}
                            onChange={() => toggleVendorSelection(vendor.id)}
                            className="rounded"
                            style={{ accentColor: '#7a5c30' }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadVendorDetails(vendor)}>
                            {vendor.businessName || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: '#9a7850' }}>{vendor.category || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: '#9a7850' }}>{vendor.location || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
                            <span className="text-sm" style={{ color: '#3a2a1a' }}>{vendor.rating || 0}</span>
                            <span className="text-xs ml-1" style={{ color: '#9a7850' }}>({vendor.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold ${
                            vendor.verified || false 
                              ? 'text-green-800'
                              : 'text-amber-800'
                          }`} style={{ 
                            backgroundColor: (vendor.verified || false) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                          }}>
                            {(vendor.verified || false) ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9a7850' }}>
                          {formatDate(vendor.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => loadVendorDetails(vendor)}
                              className="p-1 rounded transition-colors"
                              style={{ color: '#7a5c30' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleVerification(vendor.id, vendor.verified || false)}
                              disabled={updating === vendor.id}
                              className="p-1 rounded transition-colors disabled:opacity-50"
                              style={{ color: (vendor.verified || false) ? '#f59e0b' : '#16a34a' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {updating === vendor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (vendor.verified || false) ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => suspendVendor(vendor.id)}
                              className="p-1 rounded transition-colors"
                              style={{ color: '#dc2626' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVendor(vendor.id)}
                              className="p-1 rounded transition-colors"
                              style={{ color: '#dc2626' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <a
                              href={`/vendors/${vendor.userId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded transition-colors"
                              style={{ color: '#7a5c30' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredVendors.length === 0 && (
                  <div className="text-center py-8" style={{ color: '#9a7850' }}>
                    <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No vendors found matching your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                  <div className="text-sm" style={{ color: '#9a7850' }}>
                    Showing {((currentPage - 1) * vendorsPerPage) + 1} to {Math.min(currentPage * vendorsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
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

            {/* Vendor Detail Modal */}
            {showVendorModal && selectedVendor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowVendorModal(false)} />
                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '0.5px solid rgba(180,140,90,0.2)' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>
                        {selectedVendor.businessName || 'Unknown'}
                      </h2>
                      <button
                        onClick={() => setShowVendorModal(false)}
                        className="p-2 rounded transition-colors"
                        style={{ color: '#9a7850' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Category</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedVendor.category || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Location</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedVendor.location || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Rating</p>
                        <div className="flex items-center mt-1">
                          <Star className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
                          <span className="text-sm font-medium" style={{ color: '#3a2a1a' }}>{selectedVendor.rating || 0}</span>
                          <span className="text-xs ml-1" style={{ color: '#9a7850' }}>({selectedVendor.reviewCount || 0} reviews)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Status</p>
                        <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1 ${
                          (selectedVendor.verified || false) ? 'text-green-800' : 'text-amber-800'
                        }`} style={{ 
                          backgroundColor: (selectedVendor.verified || false) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                        }}>
                          {(selectedVendor.verified || false) ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Total Bookings</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{vendorBookings.length}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Total Revenue</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>${vendorRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Description</p>
                      <p className="text-sm" style={{ color: '#9a7850' }}>{selectedVendor.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.location.href = `mailto:${selectedVendor.contact?.email || ''}`}
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ backgroundColor: '#7a5c30', color: '#fdf9f5' }}
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Send Email
                      </button>
                      <a
                        href={`/vendors/${selectedVendor.userId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ border: '0.5px solid #b08850', color: '#7a5c30' }}
                      >
                        <ExternalLink className="w-4 h-4 inline mr-2" />
                        View Public Profile
                      </a>
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
