'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, collection, query, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Search, Filter, Heart, Star, MapPin, Phone, Mail, Globe, 
  Calendar, DollarSign, Camera, X, ChevronLeft, ChevronRight,
  Share2, Bookmark, Eye, MessageCircle, Award, Clock, Users
} from 'lucide-react'
import { Wedding, Vendor, Enquiry, Booking } from '../../../../types'

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

const categoryColors: Record<string, string> = {
  venue: '#8b5cf6',
  catering: '#f59e0b',
  decor: '#ec4899',
  fashion: '#ef4444',
  beauty: '#06b6d4',
  music: '#10b981',
  transport: '#6366f1',
  photography: '#f97316',
  other: '#6b7280'
}

const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Elegant Gardens Venue',
    category: 'venue',
    location: 'Nairobi, Kenya',
    rating: 4.8,
    reviews: 127,
    priceRange: '5000-10000',
    description: 'Beautiful outdoor venue perfect for romantic weddings',
    images: ['/venue1.jpg', '/venue2.jpg'],
    contact: { phone: '+254 712 345678', email: 'info@elegantgardens.co.ke' },
    services: ['Outdoor ceremony', 'Reception hall', 'Catering available'],
    availability: ['2024-12-15', '2024-12-16', '2024-12-20'],
    badges: ['Premium', 'Award Winning']
  },
  {
    id: '2',
    name: 'Gourmet Delights Catering',
    category: 'catering',
    location: 'Nairobi, Kenya',
    rating: 4.9,
    reviews: 89,
    priceRange: '200-500',
    description: 'Exquisite cuisine crafted with love and passion',
    images: ['/catering1.jpg', '/catering2.jpg'],
    contact: { phone: '+254 723 456789', email: 'hello@gourmetdelights.com' },
    services: ['Full-service catering', 'Custom menus', 'Dietary accommodations'],
    availability: ['2024-12-10', '2024-12-11', '2024-12-12'],
    badges: ['Top Rated', 'Chef Special']
  },
  {
    id: '3',
    name: 'Bloom & Blossom Florals',
    category: 'decor',
    location: 'Nairobi, Kenya',
    rating: 4.7,
    reviews: 64,
    priceRange: '100-300',
    description: 'Stunning floral arrangements for your special day',
    images: ['/floral1.jpg', '/floral2.jpg'],
    contact: { phone: '+254 734 567890', email: 'bloom@blossomflorals.co.ke' },
    services: ['Bridal bouquets', 'Centerpieces', 'Venue decoration'],
    availability: ['2024-12-08', '2024-12-09', '2024-12-13'],
    badges: ['Eco-Friendly', 'Artistic']
  }
]

export default function VendorBrowser() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showEnquiryModal, setShowEnquiryModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPrice, setFilterPrice] = useState('all')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating')
  const [savedVendors, setSavedVendors] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const [enquiryForm, setEnquiryForm] = useState({
    date: '',
    guests: '',
    budget: '',
    message: ''
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const weddingDoc = doc(db, 'weddings', user.uid)
      const weddingSnapshot = await getDoc(weddingDoc)
      if (weddingSnapshot.exists()) {
        const weddingData = weddingSnapshot.data() as Wedding
        setWedding(weddingData)
        setSavedVendors(weddingData.savedVendors || [])
        setRecentlyViewed(weddingData.recentlyViewedVendors || [])
      }

      // Load vendors from Firestore
      const vendorsQuery = query(collection(db, 'vendors'))
      const vendorsSnapshot = await getDocs(vendorsQuery)
      if (!vendorsSnapshot.empty) {
        const vendorsData = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[]
        setVendors(vendorsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVendor = async (vendorId: string) => {
    if (!wedding) return
    
    const isSaved = savedVendors.includes(vendorId)
    const updatedSaved = isSaved 
      ? savedVendors.filter(id => id !== vendorId)
      : [...savedVendors, vendorId]
    
    try {
      await updateDoc(doc(db, 'weddings', user!.uid), { savedVendors: updatedSaved })
      setSavedVendors(updatedSaved)
    } catch (error) {
      console.error('Error updating saved vendors:', error)
    }
  }

  const handleViewProfile = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setShowProfileModal(true)
    setCurrentImageIndex(0)
    
    // Add to recently viewed
    if (!recentlyViewed.includes(vendor.id)) {
      const updated = [vendor.id, ...recentlyViewed.slice(0, 9)]
      setRecentlyViewed(updated)
      if (wedding) {
        updateDoc(doc(db, 'weddings', user!.uid), { recentlyViewedVendors: updated })
      }
    }
  }

  const handleEnquiry = async () => {
    if (!wedding || !selectedVendor) return
    
    const enquiry: Enquiry = {
      id: Date.now().toString(),
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      coupleId: (user || { uid: '' }).uid,
      date: new Date(enquiryForm.date),
      guests: parseInt(enquiryForm.guests),
      budget: parseFloat(enquiryForm.budget),
      message: enquiryForm.message,
      status: 'pending',
      createdAt: new Date()
    }
    
    try {
      // Add to enquiries subcollection
      const enquiriesRef = collection(db, 'weddings', user!.uid, 'enquiries')
      await addDoc(enquiriesRef, enquiry)
      
      // Also add to vendor's enquiries
      const vendorEnquiriesRef = collection(db, 'vendors', selectedVendor.id, 'enquiries')
      await addDoc(vendorEnquiriesRef, { ...enquiry, coupleId: (user || { uid: '' }).uid })
      
      setEnquiryForm({ date: '', guests: '', budget: '', message: '' })
      setShowEnquiryModal(false)
      setShowProfileModal(false)
      
      alert('Enquiry sent successfully!')
    } catch (error) {
      console.error('Error sending enquiry:', error)
      alert('Error sending enquiry. Please try again.')
    }
  }

  const handleShare = async (vendor: Vendor) => {
    const shareData = {
      title: vendor.name,
      text: `Check out ${vendor.name} - ${vendor.description}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Error sharing:', error)
        fallbackShare(vendor)
      }
    } else {
      fallbackShare(vendor)
    }
  }

  const fallbackShare = (vendor: Vendor) => {
    const text = `Check out ${vendor.name} - ${vendor.description}\n${window.location.href}`
    navigator.clipboard.writeText(text)
    alert('Vendor details copied to clipboard!')
  }

  const getFilteredAndSortedVendors = () => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (vendor.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory
      const matchesPrice = filterPrice === 'all' || vendor.priceRange.includes(filterPrice)
      
      return matchesSearch && matchesCategory && matchesPrice
    })

    // Sort vendors
    filtered.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'price') return parseInt(a.priceRange.split('-')[0]) - parseInt(b.priceRange.split('-')[0])
      if (sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0)
      return 0
    })

    return filtered
  }

  const filteredVendors = getFilteredAndSortedVendors()

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: cream, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f0e4d0',
          borderTop: `3px solid ${gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: cream, color: brown, minHeight: '100vh' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;ital&family=Jost:wght@300;400;500&display=swap" 
        rel="stylesheet" 
      />

      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '0.5px solid ${colors.border}',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '32px',
              fontWeight: 300,
              color: brown,
              marginBottom: '8px'
            }}>Vendor Browser</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Discover and connect with the best wedding vendors
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={20} color={muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search vendors by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '0.5px solid ${colors.border}',
                fontFamily: 'Jost',
                fontSize: '14px',
                backgroundColor: 'white',
                color: brown,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '12px',
              border: '0.5px solid ${colors.border}',
              fontFamily: 'Jost',
              fontSize: '14px',
              backgroundColor: 'white',
              color: brown
            }}
          >
            <option value="all">All Categories</option>
            <option value="venue">Venue</option>
            <option value="catering">Catering</option>
            <option value="decor">Decor</option>
            <option value="fashion">Fashion</option>
            <option value="beauty">Beauty</option>
            <option value="music">Music</option>
            <option value="transport">Transport</option>
            <option value="photography">Photography</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            style={{
              padding: '12px',
              border: '0.5px solid ${colors.border}',
              fontFamily: 'Jost',
              fontSize: '14px',
              backgroundColor: 'white',
              color: brown
            }}
          >
            <option value="all">All Prices</option>
            <option value="100">Under 100</option>
            <option value="500">100-500</option>
            <option value="1000">500-1000</option>
            <option value="2000">1000-2000</option>
            <option value="5000">2000-5000</option>
            <option value="10000">5000+</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '12px',
              border: '0.5px solid ${colors.border}',
              fontFamily: 'Jost',
              fontSize: '14px',
              backgroundColor: 'white',
              color: brown
            }}
          >
            <option value="rating">Sort by Rating</option>
            <option value="price">Sort by Price</option>
            <option value="reviews">Sort by Reviews</option>
          </select>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div style={{ padding: '32px', backgroundColor: 'white', borderBottom: '0.5px solid ${colors.border}' }}>
          <h3 style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '18px',
            color: brown,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Eye size={18} />
            Recently Viewed
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {recentlyViewed.map(vendorId => {
              const vendor = vendors.find(v => v.id === vendorId)
              if (!vendor) return null
              
              return (
                <div key={vendor.id} style={{
                  minWidth: '200px',
                  border: '0.5px solid ${colors.border}',
                  padding: '12px',
                  cursor: 'pointer'
                }} onClick={() => handleViewProfile(vendor)}>
                  <div style={{
                    height: '80px',
                    backgroundColor: '#f0e4d0',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={24} color={muted} />
                  </div>
                  <div style={{
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: brown,
                    marginBottom: '4px'
                  }}>{vendor.name}</div>
                  <div style={{
                    fontSize: '10px',
                    color: muted
                  }}>{vendor.location}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vendors Grid */}
      <div style={{ padding: '32px' }}>
        {filteredVendors.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              color: muted,
              marginBottom: '16px'
            }}> <Search size={48} /> </div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '8px'
            }}>No vendors found</h3>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} style={{
                backgroundColor: 'white',
                border: '0.5px solid ${colors.border}',
                overflow: 'hidden'
              }}>
                {/* Vendor Image */}
                <div style={{
                  height: '200px',
                  backgroundColor: '#f0e4d0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={32} color={muted} />
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: categoryColors[vendor.category],
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase'
                  }}>
                    {vendor.category}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveVendor(vendor.id)
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'white',
                      border: '0.5px solid ${colors.border}',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Heart 
                      size={16} 
                      color={savedVendors.includes(vendor.id) ? '#dc2626' : muted} 
                      fill={savedVendors.includes(vendor.id) ? '#dc2626' : 'none'}
                    />
                  </button>
                </div>

                {/* Vendor Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{
                      fontFamily: 'Cormorant Garamond',
                      fontSize: '20px',
                      color: brown,
                      marginBottom: '4px'
                    }}>{vendor.name}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} color={gold} fill={gold} />
                      <span style={{
                        fontSize: '12px',
                        color: brown,
                        fontWeight: 500
                      }}>{vendor.rating}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MapPin size={14} color={muted} />
                    <span style={{
                      fontSize: '12px',
                      color: muted
                    }}>{vendor.location}</span>
                  </div>

                  <p style={{
                    fontFamily: 'Jost',
                    fontSize: '13px',
                    color: brown,
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>{vendor.description}</p>

                  {/* Badges */}
                  {vendor.badges && vendor.badges.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      {vendor.badges.map((badge, index) => (
                        <span key={index} style={{
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 500,
                          borderRadius: '4px'
                        }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price Range */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: muted
                    }}>Price Range:</span>
                    <span style={{
                      fontSize: '12px',
                      color: brown,
                      fontWeight: 500
                    }}>{vendor.priceRange}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleViewProfile(vendor)}
                      style={{
                        flex: 1,
                        backgroundColor: goldDark,
                        color: cream,
                        padding: '8px',
                        fontFamily: 'Jost',
                        fontSize: '11px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleShare(vendor)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '0.5px solid ${colors.border}',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Share2 size={16} color={muted} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Profile Modal */}
      {showProfileModal && selectedVendor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              position: 'relative',
              height: '300px',
              backgroundColor: '#f0e4d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={48} color={muted} />
              
              {/* Image Navigation */}
              {((selectedVendor as any).images || []).length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'white',
                      border: '0.5px solid ${colors.border}',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={20} color={brown} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(Math.min(((selectedVendor as any).images || []).length - 1, currentImageIndex + 1))}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'white',
                      border: '0.5px solid ${colors.border}',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={20} color={brown} />
                  </button>
                </>
              )}

              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'white',
                  border: '0.5px solid ${colors.border}',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} color={muted} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{
                    fontFamily: 'Cormorant Garamond',
                    fontSize: '28px',
                    color: brown,
                    marginBottom: '8px'
                  }}>{selectedVendor.name}</h2>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={16} color={gold} fill={gold} />
                      <span style={{
                        fontSize: '14px',
                        color: brown,
                        fontWeight: 500
                      }}>{selectedVendor.rating}</span>
                      <span style={{
                        fontSize: '12px',
                        color: muted
                      }}>({selectedVendor.reviews} reviews)</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color={muted} />
                      <span style={{
                        fontSize: '12px',
                        color: muted
                      }}>{selectedVendor.location}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {selectedVendor.badges?.map((badge, index) => (
                      <span key={index} style={{
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '4px'
                      }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond',
                    fontSize: '20px',
                    color: brown,
                    marginBottom: '4px'
                  }}>{selectedVendor.priceRange}</div>
                  <div style={{
                    fontSize: '12px',
                    color: muted
                  }}>Price Range</div>
                </div>
              </div>

              <p style={{
                fontFamily: 'Jost',
                fontSize: '15px',
                color: brown,
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>{selectedVendor.description}</p>

              {/* Services */}
              {selectedVendor.services && selectedVendor.services.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontFamily: 'Cormorant Garamond',
                    fontSize: '18px',
                    color: brown,
                    marginBottom: '12px'
                  }}>Services</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedVendor.services.map((service, index) => (
                      <span key={index} style={{
                        backgroundColor: cream,
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: brown,
                        border: '0.5px solid ${colors.border}'
                      }}>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: 'Cormorant Garamond',
                  fontSize: '18px',
                  color: brown,
                  marginBottom: '12px'
                }}>Contact Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedVendor.contact?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color={muted} />
                      <span style={{
                        fontSize: '14px',
                        color: brown
                      }}>{selectedVendor.contact.phone}</span>
                    </div>
                  )}
                  {selectedVendor.contact?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} color={muted} />
                      <span style={{
                        fontSize: '14px',
                        color: brown
                      }}>{selectedVendor.contact.email}</span>
                    </div>
                  )}
                  {selectedVendor.contact?.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={14} color={muted} />
                      <span style={{
                        fontSize: '14px',
                        color: brown
                      }}>{selectedVendor.contact.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowEnquiryModal(true)
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '12px',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageCircle size={16} />
                  Send Enquiry
                </button>
                <button
                  onClick={() => handleSaveVendor(selectedVendor.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '0.5px solid ${colors.border}',
                    padding: '12px 20px',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Heart 
                    size={16} 
                    color={savedVendors.includes(selectedVendor.id) ? '#dc2626' : brown} 
                    fill={savedVendors.includes(selectedVendor.id) ? '#dc2626' : 'none'}
                  />
                  {savedVendors.includes(selectedVendor.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => handleShare(selectedVendor)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '0.5px solid ${colors.border}',
                    padding: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={16} color={brown} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {showEnquiryModal && selectedVendor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown
              }}>Send Enquiry to {selectedVendor.name}</h2>
              <button
                onClick={() => setShowEnquiryModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={muted} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    color: muted,
                    marginBottom: '4px'
                  }}>Wedding Date</label>
                  <input
                    type="date"
                    value={enquiryForm.date}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    color: muted,
                    marginBottom: '4px'
                  }}>Number of Guests</label>
                  <input
                    type="number"
                    value={enquiryForm.guests}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, guests: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Budget Range</label>
                <input
                  type="text"
                  placeholder="e.g., 5000-10000"
                  value={enquiryForm.budget}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, budget: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Message</label>
                <textarea
                  placeholder="Tell us about your wedding and what you're looking for..."
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowEnquiryModal(false)}
                  style={{
                    border: `0.5px solid ${gold}`,
                    color: gold,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnquiry}
                  style={{
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Send Enquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
