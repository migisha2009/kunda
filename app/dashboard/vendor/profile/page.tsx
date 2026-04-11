'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../../../context/AuthContext'
import { getVendorByUserId, createOrUpdateVendorProfile } from '../../../../lib/firestore'
import { uploadMultiplePortfolioImages, deletePortfolioImage } from '../../../../lib/storage'
import { Loader2, Upload, X, Camera, Save, Eye, ExternalLink, Globe, Phone, Languages, Award, Clock, AlertCircle } from 'lucide-react'

const vendorProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string(),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500, 'Bio must be less than 500 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  pricing: z.object({
    min: z.number().min(0, 'Minimum price must be positive'),
    max: z.number().min(0, 'Maximum price must be positive'),
    currency: z.string().default('USD')
  }),
  contact: z.object({
    website: z.string().url().optional().or(z.literal('')),
    instagram: z.string().optional(),
    whatsapp: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional()
  }),
  services: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
  description: z.string().optional()
})

type VendorProfileFormData = z.infer<typeof vendorProfileSchema>

const CATEGORIES = ['Photography', 'Venues', 'Catering', 'Floristry', 'Music & DJ', 'Decor', 'Bridal Wear', 'Cake', 'Hair & Makeup', 'Transport']

const LANGUAGES = ['English', 'French', 'Kinyarwanda', 'Swahili', 'Portuguese']

const SERVICE_OPTIONS = {
  'Photography': ['Wedding Photography', 'Engagement Photos', 'Portrait Photography', 'Event Coverage'],
  'Venues': ['Indoor Venues', 'Outdoor Venues', 'Garden Venues', 'Beach Venues'],
  'Catering': ['Full Service Catering', 'Buffet Service', 'Plated Meals', 'Bar Service'],
  'Floristry': ['Bridal Bouquets', 'Centerpieces', 'Ceremony Flowers', 'Reception Flowers'],
  'Music & DJ': ['Live Bands', 'DJ Services', 'Sound Systems', 'Lighting'],
  'Decor': ['Venue Decoration', 'Table Settings', 'Lighting Design', 'Theme Planning'],
  'Bridal Wear': ['Wedding Dresses', 'Bridesmaid Dresses', 'Groom Attire', 'Accessories'],
  'Cake': ['Wedding Cakes', 'Dessert Tables', 'Cake Tasting', 'Delivery'],
  'Hair & Makeup': ['Bridal Hair', 'Bridal Makeup', 'Trial Sessions', 'On-site Services'],
  'Transport': ['Luxury Cars', 'Buses', 'Shuttle Service', 'Airport Transfers']
}

export default function VendorProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<VendorProfileFormData>({
    resolver: zodResolver(vendorProfileSchema) as any,
    defaultValues: {
      businessName: '',
      name: '',
      category: 'Photography',
      bio: '',
      location: '',
      pricing: {
        min: 0,
        max: 0,
        currency: 'USD'
      },
      contact: {
        website: '',
        instagram: '',
        whatsapp: '',
        phone: '',
        email: ''
      },
      services: [],
      priceRange: '',
      description: ''
    }
  })

  useEffect(() => {
    const subscription = watch((value) => {
      setHasUnsavedChanges(true)
    })
    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    if (user) {
      loadVendorProfile()
    }
  }, [user])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        autoSaveDraft()
      }, 30000)
      setAutoSaveTimer(timer)
      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges])

  // Calculate profile completion
  useEffect(() => {
    const completion = calculateProfileCompletion(watch())
    setProfileCompletion(completion)
  }, [watch()])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadVendorProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const vendorProfile = await getVendorByUserId(user.uid)
      if (vendorProfile) {
        reset({
          businessName: vendorProfile.businessName,
          name: vendorProfile.name,
          category: vendorProfile.category,
          bio: vendorProfile.bio,
          location: vendorProfile.location,
          pricing: vendorProfile.pricing,
          contact: {
            website: vendorProfile.contact?.website || '',
            instagram: vendorProfile.contact?.instagram || '',
            whatsapp: vendorProfile.contact?.whatsapp || '',
            phone: vendorProfile.contact?.phone || '',
            email: vendorProfile.contact?.email || ''
          },
          services: vendorProfile.services || [],
          priceRange: vendorProfile.priceRange || '',
          description: vendorProfile.description || ''
        })
        setPortfolioImages(vendorProfile.portfolioImages || [])
      }
    } catch (err) {
      console.error('Error loading vendor profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = portfolioImages.length + newImages.length + files.length
    
    if (totalImages > 10) {
      setError('Maximum 10 portfolio images allowed')
      return
    }
    
    setNewImages(prev => [...prev, ...files])
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageUrl: string) => {
    if (!user) return
    
    try {
      await deletePortfolioImage(user.uid, imageUrl)
      setPortfolioImages(prev => prev.filter(url => url !== imageUrl))
    } catch (err) {
      setError('Failed to remove image')
      console.error('Error removing image:', err)
    }
  }

  const calculateProfileCompletion = (data: any): number => {
    let completion = 0
    
    if (data.businessName) completion += 20
    if (data.category) completion += 20
    if (data.bio) completion += 15
    if (data.location) completion += 15
    if (portfolioImages.length > 0) completion += 15
    if (data.pricing?.min > 0) completion += 15
    
    return completion
  }

  const autoSaveDraft = useCallback(async () => {
    if (!user) return
    
    try {
      const formData = watch()
      await createOrUpdateVendorProfile(user.uid, {
        ...formData,
        portfolioImages,
        priceRange: `${formData.pricing.currency} ${formData.pricing.min} - ${formData.pricing.max}`,
        images: portfolioImages
      })
      console.log('Auto-saved draft')
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [user, watch, portfolioImages])

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedImageIndex === null) return
    
    const draggedImage = portfolioImages[draggedImageIndex]
    const newImages = [...portfolioImages]
    newImages.splice(draggedImageIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)
    
    setPortfolioImages(newImages)
    setDraggedImageIndex(null)
    setHasUnsavedChanges(true)
  }

  const onSubmit = async (data: VendorProfileFormData) => {
    if (!user) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let updatedPortfolioImages = [...portfolioImages]

      // Upload new images
      if (newImages.length > 0) {
        const uploadedUrls = await uploadMultiplePortfolioImages(user.uid, newImages)
        updatedPortfolioImages = [...updatedPortfolioImages, ...uploadedUrls]
        
        // Ensure we don't exceed 10 images
        if (updatedPortfolioImages.length > 10) {
          updatedPortfolioImages = updatedPortfolioImages.slice(0, 10)
        }
      }

      // Save vendor profile
      await createOrUpdateVendorProfile(user.uid, {
        ...data,
        portfolioImages: updatedPortfolioImages,
        rating: 0,
        reviewCount: 0,
        verified: false,
        priceRange: `${data.pricing.currency} ${data.pricing.min} - ${data.pricing.max}`,
        images: updatedPortfolioImages
      })

      setPortfolioImages(updatedPortfolioImages)
      setNewImages([])
      setHasUnsavedChanges(false)
      setSuccess('Profile updated successfully!')
      
      // Clear auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
        setAutoSaveTimer(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
        <div className="w-8 h-8 border-2 border-solid border-transparent border-t-[#b08850] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
      {/* KUNDA NAVBAR */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: '#ffffff',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)'
      }}>
        {/* Left - Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            border: '1.5px solid #b08850',
            marginRight: '12px'
          }}></div>
          <span style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: '#7a5c30',
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center - Navigation */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <a 
            href="/dashboard/vendor" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#9a7850',
              textDecoration: 'none'
            }}
          >
            Overview
          </a>
          <a 
            href="/dashboard/vendor/profile" 
            style={{
              fontFamily: 'Jost',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#7a5c30',
              textDecoration: 'none'
            }}

      {/* Center - Navigation */}
      <div style={{ display: 'flex', gap: '32px' }}>
        <a 
          href="/dashboard/vendor" 
          style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#9a7850',
            textDecoration: 'none'
          }}
        >
          Overview
        </a>
        <a 
          href="/dashboard/vendor/profile" 
          style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#7a5c30',
            textDecoration: 'none'
          }}
        >
          Profile
        </a>
        <a 
          href="/dashboard/vendor/bookings" 
          style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#7a5c30',
            textDecoration: 'none'
          }}
        >
          Bookings
        </a>
      </div>

      {/* Right - User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#f0e4d0',
          border: '1px solid #b08850',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            color: '#7a5c30',
            fontSize: '13px',
            fontFamily: 'Jost',
            fontWeight: 500
          }}>
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span style={{
          fontFamily: 'Jost',
          fontSize: '13px',
          color: '#7a5c30'
        }}>
          {user?.email}
        </span>
        <button
          onClick={() => {
            window.location.href = '/login'
          }}
          style={{
            border: '0.5px solid #b08850',
            color: '#b08850',
            background: 'transparent',
            padding: '6px 14px',
            fontFamily: 'Jost',
            fontSize: '11px',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>

    {/* Page Title Area */}
    <div style={{ padding: '48px 32px 32px' }}>
      <div className="text-xs uppercase tracking-wider mb-3" style={{ 
        color: '#b08850', 
        fontFamily: 'Jost', 
        fontWeight: 400,
        letterSpacing: '0.15em'
      }}>
        Vendor Profile
      </div>
      <h1 
        className="text-4xl font-light mb-3" 
        style={{ 
          fontFamily: 'Cormorant Garamond', 
          color: '#3a2a1a', 
          fontWeight: 300,
          fontSize: '32px'
        }}
      >
        Edit Your Profile
      </h1>
      <p className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
        Complete your profile to appear in vendor discovery
      </p>
    </div>

    <div className="max-w-4xl mx-auto px-8 py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Information */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '28px'
          }}
        >
          <h2 
            className="text-xl font-light mb-6" 
            style={{ 
              fontFamily: 'Cormorant Garamond', 
              color: '#3a2a1a', 
              fontWeight: 400,
              fontSize: '20px',
              borderBottom: '0.5px solid rgba(180,140,90,0.15)',
              paddingBottom: '10px',
              marginBottom: '20px'
            }}
          >
            Business Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2" style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9a7850'
              }}>
                Business Name *
              </label>
              <input
                {...register('businessName')}
                type="text"
                className="w-full"
                style={{
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  background: '#fdf9f5',
                  padding: '10px 14px',
                  fontFamily: 'Jost',
                  fontSize: '13px',
                  color: '#3a2a1a'
                }}
                placeholder="Your business name"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626', fontFamily: 'Jost', fontSize: '12px' }}>
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9a7850'
              }}>
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full"
                style={{
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  background: '#fdf9f5',
                  padding: '10px 14px',
                  fontFamily: 'Jost',
                  fontSize: '13px',
                  color: '#3a2a1a'
                }}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626', fontFamily: 'Jost', fontSize: '12px' }}>
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9a7850'
              }}>
                Location *
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full"
                style={{
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  background: '#fdf9f5',
                  padding: '10px 14px',
                  fontFamily: 'Jost',
                  fontSize: '13px',
                  color: '#3a2a1a'
                }}
                placeholder="City, Country"
              />
              {errors.location && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626', fontFamily: 'Jost', fontSize: '12px' }}>
                  {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9a7850'
              }}>
                Bio *
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full"
                style={{
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  background: '#fdf9f5',
                  padding: '10px 14px',
                  fontFamily: 'Jost',
                  fontSize: '13px',
                  color: '#3a2a1a',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
                placeholder="Tell couples about your business..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626', fontFamily: 'Jost', fontSize: '12px' }}>
                  {errors.bio.message}
                </p>
              )}
              <p className="mt-1 text-sm" style={{ fontFamily: 'Jost', color: '#b4a090', fontSize: '11px' }}>
                {watch('bio')?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2" style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9a7850'
              }}>
                Minimum Price *
              </label>
              <input
                {...register('pricing.min', { valueAsNumber: true })}
                type="number"
                className="w-full"
                style={{
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  background: '#fdf9f5',
                  padding: '10px 14px',
                  fontFamily: 'Jost',
                  fontSize: '13px',
                  color: '#3a2a1a'
                }}
                placeholder="0"
              />
              {errors.pricing?.min && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626', fontFamily: 'Jost', fontSize: '12px' }}>
                  {errors.pricing.min.message}
                </p>
              )}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2" style={{
                    fontFamily: 'Jost',
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      background: '#fdf9f5',
                      padding: '10px 14px',
                      fontFamily: 'Jost',
                      fontSize: '13px',
                      color: '#3a2a1a'
                    }}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{
                    fontFamily: 'Jost',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#9a7850'
                  }}>
                    Instagram Handle
                  </label>
                  <input
                    {...register('contact.instagram')}
                    type="text"
                    className="w-full"
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      background: '#fdf9f5',
                      padding: '10px 14px',
                      fontFamily: 'Jost',
                      fontSize: '13px',
                      color: '#3a2a1a'
                    }}
                    placeholder="@yourbusiness"
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{
                    fontFamily: 'Jost',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#9a7850'
                  }}>
                    WhatsApp Number
                  </label>
                  <input
                    {...register('contact.whatsapp')}
                    type="tel"
                    className="w-full"
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      background: '#fdf9f5',
                      padding: '10px 14px',
                      fontFamily: 'Jost',
                      fontSize: '13px',
                      color: '#3a2a1a'
                    }}
                    placeholder="+250788123456"
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{
                    fontFamily: 'Jost',
                    fontSize: '11px',
                    textTransform: 'uppercase',

  <div className="mt-6">
    <label className="block mb-2" style={{
      fontFamily: 'Jost',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: '#9a7850'
    }}>
      Languages Spoken
    </label>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {LANGUAGES.map(language => (
        <label key={language} className="flex items-center">
          <input
            type="checkbox"
            value={language}
            {...register('languages')}
            className="mr-2"
            style={{
              accentColor: '#7a5c30'
            }}
          />
          <span className="text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
            {language}
          </span>
        </label>
      ))}
    </div>
  </div>

  <div className="mt-6">
    <label className="block mb-2" style={{
      fontFamily: 'Jost',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: '#9a7850'
    }}>
      Services Offered
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(SERVICE_OPTIONS[watch('category') as keyof typeof SERVICE_OPTIONS] || []).map(service => (
        <label key={service} className="flex items-center">
          <input
            type="checkbox"
            value={service}
            {...register('services')}
            className="mr-2"
            style={{
              accentColor: '#7a5c30'
            }}
          />
          <span className="text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
            {service}
          </span>
        </label>
      ))}
    </div>
  </div>
</div>
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#9a7850'
                }}>
                  Services Offered
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(SERVICE_OPTIONS[watch('category') as keyof typeof SERVICE_OPTIONS] || []).map(service => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        value={service}
                        {...register('services')}
                        className="mr-2"
                        style={{
                          accentColor: '#7a5c30'
                        }}
                      />
                      <span className="text-sm" style={{ fontFamily: 'Jost', color: '#3a2a1a' }}>
                        {service}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Images */}
            <div 
              style={{
                backgroundColor: '#ffffff',
                border: '0.5px solid rgba(180,140,90,0.2)',
                padding: '28px'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 
                  className="text-xl font-light" 
                  style={{ 
                    fontFamily: 'Cormorant Garamond', 
                    color: '#3a2a1a', 
                    fontWeight: 400,
                    fontSize: '20px'
                  }}
                >
                  Portfolio Images ({portfolioImages.length + newImages.length}/10)
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                    Profile Completion:
                  </span>
                  <span 
                    className="text-lg font-light" 
                    style={{ fontFamily: 'Cormorant Garamond', color: '#b08850' }}
                  >
                    {profileCompletion}%
                  </span>
                </div>
              </div>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="flex items-center justify-center w-full cursor-pointer" style={{
                border: '1px dashed rgba(180,140,90,0.4)',
                background: '#fdf9f5',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#b08850' }} />
                  <p className="text-sm mb-1" style={{ fontFamily: 'Jost', color: '#9a7850' }}>
                    Click to upload images
                  </p>
                  <p className="text-xs" style={{ fontFamily: 'Jost', color: '#b4a090' }}>
                    PNG, JPG up to 5MB each
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Existing Images */}
              {portfolioImages.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderRadius: '50%' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* New Images */}
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New upload ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderRadius: '50%' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="p-4" style={{
              background: '#fef2f2',
              border: '0.5px solid #fecaca',
              color: '#dc2626',
              fontFamily: 'Jost',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4" style={{
              background: '#f0fdf4',
              border: '0.5px solid #bbf7d0',
              color: '#16a34a',
              fontFamily: 'Jost',
              fontSize: '13px'
            }}>
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center"
              style={{
                background: '#7a5c30',
                color: '#fdf9f5',
                padding: '13px',
                fontFamily: 'Jost',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.background = '#5c4220'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#7a5c30'
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
