'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import VendorCard from './VendorCard'
import VendorFilters from './VendorFilters'
import { Vendor } from '../../types'
import { Loader2, Heart } from 'lucide-react'
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: 'var(--color-accent)' }} className="animate-spin mx-auto mb-4" />
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'var(--color-heading)' }}>Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
            <svg style={{ width: '64px', height: '64px' }} className="mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-heading)', fontFamily: 'var(--font-family-body)', marginBottom: '8px' }}>Error Loading Vendors</h3>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 16px', backgroundColor: 'var(--color-accent)', color: '#FFFFFF', borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)'
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
  <footer className="vendor-footer" style={{
    background: 'var(--color-card)',
    borderTop: '1px solid var(--color-border)',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'var(--font-family-body)',
    marginTop: 'auto',
    flexWrap: 'wrap',
    gap: '12px'
  }}>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
      © 2026 Kunda Wedding Platform · Kigali, Rwanda
    </div>
    <div className="vendor-footer-links" style={{
      display: 'flex', gap: 20, alignItems: 'center'
    }}>
      <a href="https://wa.me/250783312746"
        target="_blank"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)',
          textDecoration: 'none' }}>
        WhatsApp Support
      </a>
      <a href="https://instagram.com/darkxente"
        target="_blank"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)',
          textDecoration: 'none' }}>
        @darkxente
      </a>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
        Made with in Rwanda
      </span>
    </div>
  </footer>
)

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--color-background)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
            </div>
            <span className="ml-2" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF', fontWeight: 700, fontSize: '24px' }}>Kunda</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-heading)', fontWeight: 700, fontSize: '28px', marginBottom: '8px' }}>Find Wedding Vendors</h1>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Discover the best wedding professionals for your special day</p>
        </div>

        {/* Filters */}
        <VendorFilters 
          currentCategory={searchParams.get('category') || undefined} 
          currentLocation={searchParams.get('location') || undefined} 
        />

        {/* Results Count */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length > 0 ? (
          <div className="vendor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              <svg style={{ width: '64px', height: '64px' }} className="mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-family-body)', marginBottom: '8px' }}>No vendors yet</h3>
            <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Check back soon as we add wedding vendors to our platform</p>
          </div>
        )}
      </div>
      {dashFooter}
    </div>
  )
}
