'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  MapPin, Calendar, Clock, Users, Palette, Heart, 
  Save, Edit2, X, Upload, Globe, Mail,
  Phone, Camera, Link as LinkIcon, Plus, Trash2
} from 'lucide-react'
import { Wedding, ScheduleItem } from '../../../../types'

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

const dressCodeOptions = [
  { value: 'black_tie', label: 'Black Tie' },
  { value: 'formal', label: 'Formal' },
  { value: 'semi_formal', label: 'Semi-Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'custom', label: 'Custom' }
]

const colorThemes = [
  { name: 'Romantic Blush', colors: ['#f8d7da', '#ffffff'] },
  { name: 'Classic Gold', colors: ['#b08850', '#ffffff'] },
  { name: 'Forest Green', colors: ['#2d5016', '#ffffff'] },
  { name: 'Ocean Blue', colors: ['#1e40af', '#ffffff'] },
  { name: 'Royal Purple', colors: ['#7c3aed', '#ffffff'] },
  { name: 'Champagne', colors: ['#f7e7ce', '#ffffff'] }
]

export default function WeddingDetails() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    venueAddress: '',
    ceremonyLocation: '',
    ceremonyTime: '',
    receptionTime: '',
    guestCount: '',
    dresscode: 'formal' as 'black_tie' | 'formal' | 'semi_formal' | 'casual' | 'custom',
    customDresscode: '',
    messageToGuests: '',
    hashtag: '',
    rsvpDeadline: '',
    colorTheme: ['#b08850', '#ffffff'] as [string, string],
    scheduleItems: [] as ScheduleItem[],
    heroImage: ''
  })

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
        
        // Populate form with existing data
        setFormData({
          coupleName1: weddingData.coupleName1 || '',
          coupleName2: weddingData.coupleName2 || '',
          date: weddingData.date ? new Date(weddingData.date).toISOString().split('T')[0] : '',
          venue: weddingData.venue || '',
          venueAddress: weddingData.venueAddress || '',
          ceremonyLocation: weddingData.ceremonyLocation || '',
          ceremonyTime: weddingData.ceremonyTime || '',
          receptionTime: weddingData.receptionTime || '',
          guestCount: weddingData.guestCount.toString() || '',
          dresscode: weddingData.dresscode || 'formal',
          customDresscode: weddingData.customDresscode || '',
          messageToGuests: weddingData.messageToGuests || '',
          hashtag: weddingData.hashtag || '',
          rsvpDeadline: weddingData.rsvpDeadline ? new Date(weddingData.rsvpDeadline).toISOString().split('T')[0] : '',
          colorTheme: weddingData.colorTheme || ['#b08850', '#ffffff'],
          scheduleItems: weddingData.scheduleItems || [],
          heroImage: weddingData.heroImage || ''
        })
      }
    } catch (error) {
      console.error('Error loading wedding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!wedding) return
    
    try {
      const updatedWedding: Partial<Wedding> = {
        coupleName1: formData.coupleName1,
        coupleName2: formData.coupleName2,
        date: new Date(formData.date),
        venue: formData.venue,
        venueAddress: formData.venueAddress,
        ceremonyLocation: formData.ceremonyLocation,
        ceremonyTime: formData.ceremonyTime,
        receptionTime: formData.receptionTime,
        guestCount: parseInt(formData.guestCount) || 0,
        dresscode: formData.dresscode,
        customDresscode: formData.customDresscode,
        messageToGuests: formData.messageToGuests,
        hashtag: formData.hashtag,
        rsvpDeadline: new Date(formData.rsvpDeadline),
        colorTheme: formData.colorTheme,
        scheduleItems: formData.scheduleItems,
        heroImage: formData.heroImage
      }
      
      await updateDoc(doc(db, 'weddings', user!.uid), updatedWedding)
      setWedding({ ...wedding, ...updatedWedding })
      setEditing(false)
      alert('Wedding details updated successfully!')
    } catch (error) {
      console.error('Error saving wedding details:', error)
      alert('Error saving wedding details. Please try again.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      // Here you would upload to a service like Firebase Storage
      // For now, we'll simulate with a placeholder
      setTimeout(() => {
        const imageUrl = `/wedding-hero-${Date.now()}.jpg`
        setFormData({ ...formData, heroImage: imageUrl })
        setUploadingImage(false)
      }, 1500)
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadingImage(false)
      alert('Error uploading image. Please try again.')
    }
  }

  const handleAddScheduleItem = () => {
    const newItem: ScheduleItem = {
      time: '',
      event: ''
    }
    setFormData({ ...formData, scheduleItems: [...formData.scheduleItems, newItem] })
  }

  const handleUpdateScheduleItem = (index: number, field: 'time' | 'event', value: string) => {
    const updatedItems = formData.scheduleItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setFormData({ ...formData, scheduleItems: updatedItems })
  }

  const handleRemoveScheduleItem = (index: number) => {
    const updatedItems = formData.scheduleItems.filter((_, i) => i !== index)
    setFormData({ ...formData, scheduleItems: updatedItems })
  }

  const generateGoogleMapsLink = () => {
    if (!formData.venueAddress) return ''
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.venueAddress)}`
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '32px',
              fontWeight: 300,
              color: brown,
              marginBottom: '8px'
            }}>Wedding Details</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Manage your wedding information and preferences
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  border: `0.5px solid ${gold}`,
                  color: gold,
                  padding: '8px 16px',
                  fontFamily: 'Jost',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit2 size={16} />
                Edit Details
              </button>
            )}
            {editing && (
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: goldDark,
                  color: cream,
                  padding: '8px 16px',
                  fontFamily: 'Jost',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} />
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Couple Information */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid ${colors.border}',
              padding: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Heart size={18} />
                Couple Information
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    color: muted,
                    marginBottom: '4px'
                  }}>Partner 1 Name</label>
                  <input
                    type="text"
                    value={formData.coupleName1}
                    onChange={(e) => setFormData({ ...formData, coupleName1: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
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
                  }}>Partner 2 Name</label>
                  <input
                    type="text"
                    value={formData.coupleName2}
                    onChange={(e) => setFormData({ ...formData, coupleName2: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Wedding Date & Time */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid ${colors.border}',
              padding: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={18} />
                Date & Time
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
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
                  }}>RSVP Deadline</label>
                  <input
                    type="date"
                    value={formData.rsvpDeadline}
                    onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    color: muted,
                    marginBottom: '4px'
                  }}>Ceremony Time</label>
                  <input
                    type="time"
                    value={formData.ceremonyTime}
                    onChange={(e) => setFormData({ ...formData, ceremonyTime: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
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
                  }}>Reception Time</label>
                  <input
                    type="time"
                    value={formData.receptionTime}
                    onChange={(e) => setFormData({ ...formData, receptionTime: e.target.value })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid ${colors.border}',
              padding: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Users size={18} />
                Guest Information
              </h2>
              
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Expected Guest Count</label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Venue Information */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid ${colors.border}',
              padding: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MapPin size={18} />
                Venue Information
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Venue Name</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Venue Address</label>
                <input
                  type="text"
                  value={formData.venueAddress}
                  onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                />
                {formData.venueAddress && (
                  <a
                    href={generateGoogleMapsLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      fontSize: '12px',
                      color: gold,
                      textDecoration: 'none'
                    }}
                  >
                    <Globe size={14} />
                    View on Google Maps
                  </a>
                )}
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
                  marginBottom: '4px'
                }}>Ceremony Location (if different)</label>
                <input
                  type="text"
                  value={formData.ceremonyLocation}
                  onChange={(e) => setFormData({ ...formData, ceremonyLocation: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Dress Code */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid ${colors.border}',
              padding: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Palette size={18} />
                Dress Code
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <select
                  value={formData.dresscode}
                  onChange={(e) => setFormData({ ...formData, dresscode: e.target.value as any })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown,
                    boxSizing: 'border-box'
                  }}
                >
                  {dressCodeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {formData.dresscode === 'custom' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    color: muted,
                    marginBottom: '4px'
                  }}>Custom Dress Code</label>
                  <input
                    type="text"
                    value={formData.customDresscode}
                    onChange={(e) => setFormData({ ...formData, customDresscode: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Cocktail attire, Garden party chic"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '0.5px solid ${colors.border}',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : cream,
                      color: brown,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', marginTop: '32px' }}>
          {/* Color Theme */}
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            padding: '24px'
          }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Palette size={18} />
              Color Theme
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {colorThemes.map((theme, index) => (
                <div
                  key={index}
                  onClick={() => editing && setFormData({ ...formData, colorTheme: theme.colors as [string, string] })}
                  style={{
                    cursor: editing ? 'pointer' : 'not-allowed',
                    border: formData.colorTheme[0] === theme.colors[0] && formData.colorTheme[1] === theme.colors[1] 
                      ? `2px solid ${gold}` 
                      : '0.5px solid ${colors.border}',
                    borderRadius: '4px',
                    padding: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: theme.colors[0],
                      borderRadius: '50%'
                    }}></div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: theme.colors[1],
                      borderRadius: '50%'
                    }}></div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: brown,
                    fontWeight: 500
                  }}>{theme.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Wedding Hashtag */}
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            padding: '24px'
          }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '16px'
            }}>Wedding Hashtag</h2>
            
            <input
              type="text"
              value={formData.hashtag}
              onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
              disabled={!editing}
              placeholder="#OurWedding2024"
              style={{
                width: '100%',
                padding: '12px',
                border: '0.5px solid ${colors.border}',
                fontFamily: 'Jost',
                fontSize: '14px',
                backgroundColor: editing ? 'white' : cream,
                color: brown,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Hero Image */}
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid ${colors.border}',
            padding: '24px'
          }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Camera size={18} />
              Hero Image
            </h2>
            
            {formData.heroImage ? (
              <div style={{
                position: 'relative',
                marginBottom: '16px'
              }}>
                <img
                  src={formData.heroImage}
                  alt="Wedding hero"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    border: '0.5px solid ${colors.border}'
                  }}
                />
                {editing && (
                  <button
                    onClick={() => setFormData({ ...formData, heroImage: '' })}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'white',
                      border: '0.5px solid ${colors.border}',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} color={muted} />
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f0e4d0',
                border: '0.5px solid ${colors.border}',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Camera size={32} color={muted} />
              </div>
            )}
            
            {editing && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                  id="hero-image-upload"
                />
                <label
                  htmlFor="hero-image-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: goldDark,
                    color: cream,
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingImage ? 0.7 : 1
                  }}
                >
                  <Upload size={16} />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Message to Guests */}
        <div style={{
          backgroundColor: 'white',
          border: '0.5px solid ${colors.border}',
          padding: '24px',
          marginTop: '32px'
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: brown,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Mail size={18} />
            Message to Guests
          </h2>
          
          <textarea
            value={formData.messageToGuests}
            onChange={(e) => setFormData({ ...formData, messageToGuests: e.target.value })}
            disabled={!editing}
            placeholder="Write a personal message to your guests..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '0.5px solid ${colors.border}',
              fontFamily: 'Jost',
              fontSize: '14px',
              backgroundColor: editing ? 'white' : cream,
              color: brown,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Schedule Builder */}
        <div style={{
          backgroundColor: 'white',
          border: '0.5px solid ${colors.border}',
          padding: '24px',
          marginTop: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={18} />
              Wedding Schedule
            </h2>
            
            {editing && (
              <button
                onClick={handleAddScheduleItem}
                style={{
                  backgroundColor: goldDark,
                  color: cream,
                  padding: '6px 12px',
                  fontFamily: 'Jost',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                Add Item
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {formData.scheduleItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={item.time}
                  onChange={(e) => handleUpdateScheduleItem(index, 'time', e.target.value)}
                  disabled={!editing}
                  placeholder="Time"
                  style={{
                    flex: '0 0 120px',
                    padding: '8px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown
                  }}
                />
                <input
                  type="text"
                  value={item.event}
                  onChange={(e) => handleUpdateScheduleItem(index, 'event', e.target.value)}
                  disabled={!editing}
                  placeholder="Event description"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '0.5px solid ${colors.border}',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : cream,
                    color: brown
                  }}
                />
                {editing && (
                  <button
                    onClick={() => handleRemoveScheduleItem(index)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} color={muted} />
                  </button>
                )}
              </div>
            ))}
            
            {formData.scheduleItems.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: muted,
                fontSize: '14px'
              }}>
                No schedule items yet. {editing && 'Click "Add Item" to start building your wedding schedule.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
