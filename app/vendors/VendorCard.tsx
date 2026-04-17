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
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)', border: '1px solid var(--color-border)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
           onMouseEnter={(e) => {
             e.currentTarget.style.boxShadow = '0 8px 24px rgba(75, 71, 165, 0.25)'
             e.currentTarget.style.transform = 'translateY(-2px)'
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.boxShadow = '0 4px 12px rgba(75, 71, 165, 0.15)'
             e.currentTarget.style.transform = 'translateY(0)'
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
          <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, color: 'var(--color-heading)', fontFamily: 'var(--font-family-body)' }}>
            {vendor.category.charAt(0).toUpperCase() + vendor.category.slice(1).toLowerCase()}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-body)', color: '#FFFFFF', fontWeight: 600, fontSize: '18px' }}>
                {(vendor.businessName || vendor.name).split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')}
              </h3>
            {vendor.verified && (
              <div style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-accent)', fontSize: '12px', padding: '4px 8px', borderRadius: '50px', fontWeight: 600, fontFamily: 'var(--font-family-body)' }}>
                Verified
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px', fontFamily: 'var(--font-family-body)' }}>
            <MapPin style={{ width: '16px', height: '16px', marginRight: '4px', color: 'var(--color-accent)' }} />
            {vendor.location.split(',').map(part => 
              part.trim().split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')
            ).join(', ')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(!vendor.rating || vendor.rating === 0) ? (
                <div style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: 'var(--color-success)', fontSize: '12px', padding: '4px 8px', borderRadius: '50px', fontWeight: 600, fontFamily: 'var(--font-family-body)' }}>
                  New
                </div>
              ) : (
                <>
                  <Star style={{ width: '16px', height: '16px', color: 'var(--color-accent)', marginRight: '4px', fill: 'currentColor' }} />
                  <span style={{ fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-family-body)' }}>{vendor.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginLeft: '4px', fontFamily: 'var(--font-family-body)' }}>({vendor.reviewCount || 0})</span>
                </>
              )}
            </div>
          </div>

          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', fontFamily: 'var(--font-family-body)' }}>
            {vendor.pricing?.currency || '$'} {vendor.pricing?.min?.toLocaleString() || 0} - {vendor.pricing?.max?.toLocaleString() || 0}
          </div>

          <button style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--color-accent)', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 166, 35, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 166, 35, 0.3)'
                  }}>
            View Profile
          </button>
        </div>
      </div>
    </Link>
  )
}
