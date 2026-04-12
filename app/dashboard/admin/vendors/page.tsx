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
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f4ff' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1a56db' }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f4ff' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1a56db' }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light" style={{ fontFamily: 'Urbanist', color: '#3a2a1a' }}>Vendor Management</h1>
                <p className="text-sm mt-2" style={{ color: '#6b7280' }}>Manage and verify wedding vendors on the platform</p>
              </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>Category</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedVendor.category || 'Unknown'}</p>
                      </div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#6b7280' }}>Total Revenue</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>${vendorRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                        Send Email
                      </button>
                      <a
                        href={`/vendors/${selectedVendor.userId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ border: '1px solid #1a56db', color: '#1a56db' }}
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
    </div>
  )
}
          </div>
        </div>
      )}
    </>
  )
}
