'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { colors, typography } from '../../lib/styles'

const CATEGORIES = [
  'Photography',
  'Catering', 
  'Floristry',
  'Venues',
  'Music',
  'Decor',
  'Bridal Wear',
  'Cake',
  'Hair & Makeup',
  'Transport'
]

interface VendorFiltersProps {
  currentCategory?: string
  currentLocation?: string
}

export default function VendorFilters({ currentCategory, currentLocation }: VendorFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState(currentCategory || '')
  const [location, setLocation] = useState(currentLocation || '')

  useEffect(() => {
    setCategory(currentCategory || '')
    setLocation(currentLocation || '')
  }, [currentCategory, currentLocation])

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    if (location) {
      params.set('location', location)
    } else {
      params.delete('location')
    }
    
    router.push(`/vendors?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setCategory('')
    setLocation('')
    router.push('/vendors', { scroll: false })
  }

  const hasActiveFilters = category || location

  return (
    <div style={{ padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px', backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Filter style={{ width: '20px', height: '20px', marginRight: '8px', color: colors.textSecondary }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, fontFamily: 'Urbanist' }}>Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{ display: 'flex', alignItems: 'center', fontSize: '14px', transition: 'opacity 0.2s ease', color: colors.textSecondary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <X style={{ width: '16px', height: '16px', marginRight: '4px', color: colors.textSecondary }} />
            Clear All
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {/* Category Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
              e.target.style.boxShadow = 'none'
              updateFilters()
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State, or Country"
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
              e.target.style.boxShadow = 'none'
              updateFilters()
            }}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {category && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '50px', fontSize: '14px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                Category: {category}
                <button
                  onClick={() => {
                    setCategory('')
                    updateFilters()
                  }}
                  style={{ marginLeft: '8px', transition: 'opacity 0.2s ease', color: colors.primary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X style={{ width: '12px', height: '12px' }} />
                </button>
              </span>
            )}
            {location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '50px', fontSize: '14px', backgroundColor: colors.primaryLight, color: colors.primaryDark }}>
                Location: {location}
                <button
                  onClick={() => {
                    setLocation('')
                    updateFilters()
                  }}
                  style={{ marginLeft: '8px', transition: 'opacity 0.2s ease', color: colors.primary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X style={{ width: '12px', height: '12px' }} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
