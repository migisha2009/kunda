'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../../../context/AuthContext'
import { getVendorByUserId, createOrUpdateVendorProfile } from '../../../../lib/firestore'
import { uploadMultiplePortfolioImages, deletePortfolioImage } from '../../../../lib/storage'
import { Loader2, Upload, X, Camera, Save } from 'lucide-react'

const vendorProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.enum(['Photography', 'Catering', 'Floristry', 'Venues', 'Music', 'Decor', 'Bridal Wear', 'Cake', 'Hair & Makeup', 'Transport']),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500, 'Bio must be less than 500 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  pricing: z.object({
    min: z.number().min(0, 'Minimum price must be positive'),
    max: z.number().min(0, 'Maximum price must be positive'),
    currency: z.string().default('USD')
  })
})

type VendorProfileFormData = z.infer<typeof vendorProfileSchema>

const CATEGORIES = ['Photography', 'Catering', 'Floristry', 'Venues', 'Music', 'Decor', 'Bridal Wear', 'Cake', 'Hair & Makeup', 'Transport']

export default function VendorProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

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
      category: 'Photography',
      bio: '',
      location: '',
      pricing: {
        min: 0,
        max: 0,
        currency: 'USD'
      }
    }
  })

  useEffect(() => {
    if (user) {
      loadVendorProfile()
    }
  }, [user])

  const loadVendorProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const vendorProfile = await getVendorByUserId(user.uid)
      if (vendorProfile) {
        reset({
          businessName: vendorProfile.businessName,
          category: vendorProfile.category as VendorProfileFormData['category'],
          bio: vendorProfile.bio,
          location: vendorProfile.location,
          pricing: vendorProfile.pricing
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
        verified: false
      })

      setPortfolioImages(updatedPortfolioImages)
      setNewImages([])
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Profile</h1>
          <p className="text-gray-600">Manage your business information and portfolio</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  {...register('businessName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your business name"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, State/Country"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price *
                  </label>
                  <input
                    {...register('pricing.min', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                  />
                  {errors.pricing?.min && (
                    <p className="mt-1 text-sm text-red-600">{errors.pricing.min.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price *
                  </label>
                  <input
                    {...register('pricing.max', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                  {errors.pricing?.max && (
                    <p className="mt-1 text-sm text-red-600">{errors.pricing.max.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell couples about your business, services, and what makes you special..."
                maxLength={500}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">{watch('bio')?.length || 0}/500 characters</p>
            </div>
          </div>

          {/* Portfolio Images */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Images ({portfolioImages.length + newImages.length}/10)</h2>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
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
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
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
