'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'

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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={updateFilters}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={updateFilters}
            placeholder="City, State, or Country"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Category: {category}
                <button
                  onClick={() => {
                    setCategory('')
                    updateFilters()
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Location: {location}
                <button
                  onClick={() => {
                    setLocation('')
                    updateFilters()
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
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
