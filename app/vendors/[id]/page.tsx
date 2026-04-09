'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { getVendor } from '../../../lib/firestore'
import { createEnquiry } from '../../../lib/firestore'
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
      const vendorData = await getVendor(vendorId)
      setVendor(vendorData)
    } catch (error) {
      console.error('Error loading vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnquirySubmit = async (message: string) => {
    if (!user || !userProfile || !vendor) return

    try {
      // Create enquiry in Firestore
      await createEnquiry({
        vendorId: vendor.id,
        coupleId: user.uid,
        message,
        status: 'pending'
      })

      // Send email notification
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorEmail: user.email, // This should come from vendor's profile
          vendorName: vendor.businessName,
          coupleName: userProfile.name,
          coupleEmail: user.email,
          message
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
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
                {vendor.portfolioImages.slice(0, 4).map((image: string, index: number) => (
                  <div key={index} className="aspect-w-16 aspect-h-12">
                    <img
                      src={image}
                      alt={`${vendor.businessName} portfolio ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                ))}
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
                      <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                      <span className="ml-1">({vendor.reviewCount} reviews)</span>
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
              </div>

              <div className="mb-6">
                <p className="text-gray-700">{vendor.bio}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                <p className="text-gray-700">
                  {vendor.pricing.currency} {vendor.pricing.min.toLocaleString()} - {vendor.pricing.max.toLocaleString()}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vendor.portfolioImages.map((image: string, index: number) => (
              <div key={index} className="aspect-w-16 aspect-h-12">
                <img
                  src={image}
                  alt={`${vendor.businessName} portfolio ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
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
