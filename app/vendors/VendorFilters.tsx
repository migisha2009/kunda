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
    <div className="p-6 rounded-xl shadow-sm mb-6" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 mr-2" style={{ color: colors.textSecondary }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary, fontFamily: 'Urbanist' }}>Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm hover:opacity-80 transition-colors" style={{ color: colors.textSecondary }}
          >
            <X className="w-4 h-4 mr-1" style={{ color: colors.textSecondary }} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={updateFilters}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{ borderColor: colors.border }}
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
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={updateFilters}
            placeholder="City, State, or Country"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{ borderColor: colors.border }}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Category: {category}
                <button
                  onClick={() => {
                    setCategory('')
                    updateFilters()
                  }}
                  className="ml-2 hover:opacity-80" style={{ color: colors.primary }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primaryDark }}>
                Location: {location}
                <button
                  onClick={() => {
                    setLocation('')
                    updateFilters()
                  }}
                  className="ml-2 hover:opacity-80" style={{ color: colors.primary }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
