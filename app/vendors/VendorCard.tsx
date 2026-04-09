'use client'

import { Vendor } from '../../types'
import { Star, MapPin, Store } from 'lucide-react'

interface VendorCardProps {
  vendor: Vendor
}

export default function VendorCard({ vendor }: VendorCardProps) {
  const imageUrl = vendor.portfolioImages[0] || '/placeholder-vendor.jpg'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      {/* Image */}
      <div className="aspect-w-16 aspect-h-12 relative">
        <img
          src={imageUrl}
          alt={vendor.businessName}
          className="w-full h-48 object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = '/placeholder-vendor.jpg'
          }}
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
          {vendor.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{vendor.businessName}</h3>
          {vendor.verified && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              Verified
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {vendor.location}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="font-medium text-gray-900">{vendor.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500 ml-1">({vendor.reviewCount})</span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {vendor.pricing.currency} {vendor.pricing.min.toLocaleString()} - {vendor.pricing.max.toLocaleString()}
        </div>

        <button className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
          View Profile
        </button>
      </div>
    </div>
  )
}
