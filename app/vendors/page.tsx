'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import VendorCard from './VendorCard'
import VendorFilters from './VendorFilters'
import { Vendor } from '../../types'
import { Loader2 } from 'lucide-react'
import { colors, typography, getStyles } from '../../lib/styles'

export default function VendorsPage() {
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
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
  }, [])

  // Apply client-side filtering
  useEffect(() => {
    const rating = searchParams.get('rating')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    let filtered = vendors

    // Apply rating filter
    if (rating && rating !== 'all') {
      const minRating = parseFloat(rating)
      filtered = filtered.filter(vendor => 
        vendor.rating && vendor.rating >= minRating
      )
    }

    // Apply price range filter
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity
      filtered = filtered.filter(vendor => 
        vendor.pricing && 
        vendor.pricing.min >= min && 
        vendor.pricing.max <= max
      )
    }

    setFilteredVendors(filtered)
  }, [vendors, searchParams])

  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '32px', height: '32px' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: colors.textSecondary }}>Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: colors.danger, marginBottom: '16px' }}>
            <svg style={{ width: '64px', height: '64px' }} className="mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>Error Loading Vendors</h3>
          <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 16px', backgroundColor: colors.primary, color: colors.white, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDark
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const dashFooter = (
  <footer style={{
    background: '#ffffff',
    borderTop: '1px solid #e5edff',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Urbanist, sans-serif',
    marginTop: 'auto',
  }}>
    <div style={{ fontSize: 13, color: '#9ca3af' }}>
      © 2026 Kunda Wedding Platform · Kigali, Rwanda
    </div>
    <div style={{
      display: 'flex', gap: 20, alignItems: 'center'
    }}>
      <a href="https://wa.me/250783312746"
        target="_blank"
        style={{ fontSize: 13, color: '#6b7280',
          textDecoration: 'none' }}>
        WhatsApp Support
      </a>
      <a href="https://instagram.com/darkxente"
        target="_blank"
        style={{ fontSize: 13, color: '#6b7280',
          textDecoration: 'none' }}>
        @darkxente
      </a>
      <span style={{ fontSize: 13, color: '#9ca3af' }}>
        Made with in Rwanda
      </span>
    </div>
  </footer>
)

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.bg,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 800, fontSize: '36px', marginBottom: '8px' }}>Find Wedding Vendors</h1>
          <p style={{ fontFamily: 'Urbanist', color: colors.textSecondary, fontSize: '14px' }}>Discover the best wedding professionals for your special day</p>
        </div>

        {/* Filters */}
        <VendorFilters 
          currentCategory={searchParams.get('category') || undefined} 
          currentLocation={searchParams.get('location') || undefined} 
        />

        {/* Results Count */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: colors.textSecondary, fontFamily: 'Urbanist', fontSize: '14px' }}>
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ color: colors.textMuted, marginBottom: '16px' }}>
              <svg style={{ width: '64px', height: '64px' }} className="mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>No vendors yet</h3>
            <p style={{ color: colors.textSecondary }}>Check back soon as we add wedding vendors to our platform</p>
          </div>
        )}
      </div>
      {dashFooter}
    </div>
  )
}
