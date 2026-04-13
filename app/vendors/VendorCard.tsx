'use client'

import Link from 'next/link'
import { Vendor } from '../../types'
import { Star, MapPin, Store } from 'lucide-react'
import { colors, typography, getStyles } from '../../lib/styles'

interface VendorCardProps {
  vendor: Vendor
}

export default function VendorCard({ vendor }: VendorCardProps) {
  const imageUrl = (vendor.portfolioImages && vendor.portfolioImages.length > 0) 
    ? vendor.portfolioImages[0] 
    : '/placeholder-vendor.jpg'

  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div style={{ backgroundColor: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
           onMouseEnter={(e) => {
             e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.12)'
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
           }}>
        {/* Image */}
        <div style={{ position: 'relative', height: '192px' }}>
          <img
            src={imageUrl}
            alt={vendor.businessName || vendor.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder-vendor.jpg'
            }}
          />
          <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: colors.white, padding: '4px 8px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
            {vendor.category.charAt(0).toUpperCase() + vendor.category.slice(1).toLowerCase()}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontFamily: 'Urbanist', color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>
                {(vendor.businessName || vendor.name).split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')}
              </h3>
            {vendor.verified && (
              <div style={{ backgroundColor: colors.primaryLight, color: colors.primary, fontSize: '12px', padding: '4px 8px', borderRadius: '50px', fontWeight: 600 }}>
                Verified
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.textSecondary, marginBottom: '12px' }}>
            <MapPin style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            {vendor.location.split(',').map(part => 
              part.trim().split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')
            ).join(', ')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(!vendor.rating || vendor.rating === 0) ? (
                <div style={{ backgroundColor: colors.successBg, color: colors.success, fontSize: '12px', padding: '4px 8px', borderRadius: '50px', fontWeight: 600 }}>
                  New
                </div>
              ) : (
                <>
                  <Star style={{ width: '16px', height: '16px', color: colors.warning, marginRight: '4px', fill: 'currentColor' }} />
                  <span style={{ fontWeight: 600, color: colors.textPrimary }}>{vendor.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '14px', color: colors.textMuted, marginLeft: '4px' }}>({vendor.reviewCount || 0})</span>
                </>
              )}
            </div>
          </div>

          <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
            {vendor.pricing?.currency || '$'} {vendor.pricing?.min?.toLocaleString() || 0} - {vendor.pricing?.max?.toLocaleString() || 0}
          </div>

          <button style={{ width: '100%', padding: '12px 16px', backgroundColor: colors.primary, color: colors.white, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryDark
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'
                  }}>
            View Profile
          </button>
        </div>
      </div>
    </Link>
  )
}
