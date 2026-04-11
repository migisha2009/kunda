'use client'

// Build: v2.0 - fixed date formatting

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { collection, query, getDocs, orderBy, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { Vendor } from '../../../../types'
import { Store, Search, Filter, Check, X, ExternalLink, Loader2, Star } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'


export default function AdminVendorsPage() {
  const { userProfile } = useAuth()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadVendors()
  }, [])

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
    const matchesSearch = vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || vendor.category === categoryFilter
    const matchesVerified = verifiedFilter === 'all' || 
      (verifiedFilter === 'verified' && vendor.verified) ||
      (verifiedFilter === 'unverified' && !vendor.verified)
    
    return matchesSearch && matchesCategory && matchesVerified
  })

  const categories = Array.from(new Set(vendors.map(v => v.category)))

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
          <p className="text-gray-600">Manage and verify wedding vendors on the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Vendors</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vendor.businessName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{vendor.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{vendor.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{vendor.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({vendor.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleVerification(vendor.id, vendor.verified)}
                          disabled={updating === vendor.id}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            vendor.verified
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } disabled:opacity-50`}
                        >
                          {updating === vendor.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : vendor.verified ? (
                            <>
                              <X className="w-3 h-3 inline mr-1" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 inline mr-1" />
                              Verify
                            </>
                          )}
                        </button>
                        
                        <a
                          href={`/vendors/${vendor.userId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 inline mr-1" />
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredVendors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No vendors found matching your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Vendors</span>
              <span className="text-lg font-bold text-gray-900">{vendors.length}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Verified</span>
              <span className="text-lg font-bold text-green-600">
                {vendors.filter(v => v.verified).length}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Unverified</span>
              <span className="text-lg font-bold text-yellow-600">
                {vendors.filter(v => !v.verified).length}
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
