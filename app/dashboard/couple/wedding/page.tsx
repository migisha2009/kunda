'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { getWedding, createWedding, updateWedding } from '../../../../lib/firestore'
import { Wedding } from '../../../../types'
import { Heart, Calendar, MapPin, Users, DollarSign, Save, Loader2 } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'

export default function WeddingDetailsPage() {
  const { user, userProfile } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    venue: '',
    guestCount: '',
    budgetTotal: '',
    currency: 'USD'
  })

  useEffect(() => {
    if (user) {
      loadWedding()
    }
  }, [user])

  const loadWedding = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const weddingData = await getWedding(user.uid)
      setWedding(weddingData)
      
      if (weddingData) {
        setFormData({
          date: weddingData.date ? new Date(weddingData.date).toISOString().split('T')[0] : '',
          venue: weddingData.venue || '',
          guestCount: weddingData.guestCount.toString(),
          budgetTotal: weddingData.budget.total.toString(),
          currency: weddingData.budget.currency
        })
      }
    } catch (error) {
      console.error('Error loading wedding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const weddingData = {
        coupleId: user.uid,
        date: new Date(formData.date),
        venue: formData.venue,
        venueAddress: wedding?.venueAddress || '',
        ceremonyLocation: wedding?.ceremonyLocation || '',
        guestCount: parseInt(formData.guestCount),
        budget: {
          total: parseFloat(formData.budgetTotal),
          spent: wedding?.budget?.spent || 0,
          currency: formData.currency
        },
        checklist: wedding?.checklist || [],
        coupleName1: wedding?.coupleName1 || '',
        coupleName2: wedding?.coupleName2 || '',
        ceremonyTime: wedding?.ceremonyTime || '',
        receptionTime: wedding?.receptionTime || '',
        dresscode: wedding?.dresscode || 'formal',
        customDresscode: wedding?.customDresscode || '',
        messageToGuests: wedding?.messageToGuests || '',
        scheduleItems: wedding?.scheduleItems || [],
        hashtag: wedding?.hashtag || '',
        rsvpDeadline: wedding?.rsvpDeadline || new Date(),
        colorTheme: wedding?.colorTheme || ['#b08850', '#fdf9f5'],
        heroImage: wedding?.heroImage || '',
        planningStartDate: wedding?.planningStartDate || new Date(),
        profileCompletion: wedding?.profileCompletion || 0,
        budgetExpenses: wedding?.budgetExpenses || [],
        expenses: wedding?.expenses || [],
        currency: wedding?.currency || 'RWF',
        quoteOfTheDay: wedding?.quoteOfTheDay || ''
      }

      if (wedding) {
        // Update existing wedding
        await updateWedding(wedding.id, weddingData)
      } else {
        // Create new wedding
        await createWedding(weddingData)
      }

      // Reload wedding data
      await loadWedding()
    } catch (error) {
      console.error('Error saving wedding:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wedding Details</h1>
          <p className="text-gray-600">Manage your wedding information and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wedding Date */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
              Wedding Date
            </h2>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Venue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
              Venue
            </h2>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="Enter your wedding venue name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Guest Count & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                Guest Count
              </h2>
              <input
                type="number"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', e.target.value)}
                placeholder="Number of guests"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                Budget
              </h2>
              <div className="space-y-3">
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (N)</option>
                  <option value="EUR">EUR (0x20ac)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <input
                  type="number"
                  value={formData.budgetTotal}
                  onChange={(e) => handleInputChange('budgetTotal', e.target.value)}
                  placeholder="Total budget amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Current Wedding Info */}
          {wedding && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                Current Wedding Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Wedding Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(wedding.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="font-medium text-gray-900">{wedding.venue || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guest Count</p>
                  <p className="font-medium text-gray-900">{wedding.guestCount || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium text-gray-900">
                    {wedding.budget.currency} {wedding.budget.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
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
                  Save Wedding Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
