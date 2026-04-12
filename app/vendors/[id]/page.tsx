'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { Star, MapPin, Phone, Mail, Send, MessageCircle, X } from 'lucide-react'
import EnquiryModal from '../../../components/EnquiryModal'

export default function VendorProfilePage() {
  const params = useParams()
  const { user, userProfile } = useAuth()
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEnquiryModal, setShowEnquiryModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadVendor(params.id as string)
    }
  }, [params.id])

  const loadVendor = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vendor')
      }
      
      setVendor(result.data)
    } catch (error) {
      console.error('Error loading vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnquirySubmit = async (message: string) => {
    if (!user || !userProfile || !vendor) return

    try {
      // Create enquiry via API
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          coupleId: user.uid,
          message
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create enquiry')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create enquiry')
      }

      setShowEnquiryModal(false)
      // Show success message
      alert('Enquiry sent successfully!')
    } catch (error) {
      console.error('Error sending enquiry:', error)
      alert('Failed to send enquiry. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Not Found</h1>
          <p className="text-gray-600">The vendor you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Images */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {(vendor.portfolioImages && vendor.portfolioImages.length > 0) 
                  ? vendor.portfolioImages.slice(0, 4).map((image: string, index: number) => (
                      <div key={index} className="aspect-w-16 aspect-h-12">
                        <img
                          src={image}
                          alt={`${vendor.businessName} portfolio ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-vendor.jpg'
                          }}
                        />
                      </div>
                    ))
                  : (
                    <div className="col-span-2 text-center py-8">
                      <div className="bg-gray-100 rounded-lg p-8">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">No portfolio images available</p>
                      </div>
                    </div>
                  )
                }
              </div>
            </div>

            {/* Vendor Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{vendor.businessName}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{vendor.rating?.toFixed(1) || '0.0'}</span>
                      <span className="ml-1">({vendor.reviewCount || 0} reviews)</span>
                    </div>
                    {vendor.verified && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {vendor.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {vendor.phone || 'Contact for details'}
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact through platform
                </div>
                {vendor.contact?.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.contact.whatsapp.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 9.885-5.335 9.885-11.893a11.842 11.842 0 00-3.48-8.413Z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-700">{vendor.bio || 'No bio available'}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                <p className="text-gray-700">
                  {vendor.pricing?.currency || '$'} {vendor.pricing?.min?.toLocaleString() || 0} - {vendor.pricing?.max?.toLocaleString() || 0}
                </p>
              </div>

              {user && userProfile?.role === 'couple' && (
                <button
                  onClick={() => setShowEnquiryModal(true)}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Enquiry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full Portfolio */}
        {(vendor.portfolioImages && vendor.portfolioImages.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vendor.portfolioImages.map((image: string, index: number) => (
                <div key={index} className="aspect-w-16 aspect-h-12">
                  <img
                    src={image}
                    alt={`${vendor.businessName} portfolio ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-vendor.jpg'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <EnquiryModal
          vendorName={vendor.businessName}
          onClose={() => setShowEnquiryModal(false)}
          onSubmit={handleEnquirySubmit}
        />
      )}
    </div>
  )
}
