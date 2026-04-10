'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import VendorCard from './VendorCard'
import VendorFilters from './VendorFilters'
import { Vendor } from '../../types'
import { Loader2 } from 'lucide-react'

export default function VendorsPage() {
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true)
        const category = searchParams.get('category')
        const location = searchParams.get('location')
        
        const queryParams = new URLSearchParams()
        if (category) queryParams.append('category', category)
        if (location) queryParams.append('location', location)
        
        const response = await fetch(`/api/vendors?${queryParams.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch vendors')
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch vendors')
        }
        
        setVendors(result.data)
      } catch (err) {
        console.error('Error loading vendors:', err)
        setError('Failed to load vendors. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadVendors()
  }, [searchParams])

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendors</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Wedding Vendors</h1>
          <p className="text-gray-600">Discover the best wedding professionals for your special day</p>
        </div>

        {/* Filters */}
        <VendorFilters 
          currentCategory={searchParams.get('category') || undefined} 
          currentLocation={searchParams.get('location') || undefined} 
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Vendor Grid */}
        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>
    </div>
  )
}
