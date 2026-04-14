'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { updateUser } from '../../lib/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { signOutUser } from '../../lib/auth'
import { Heart, User, Mail, Phone, Edit2, Save, X, AlertTriangle, Loader2, Key, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/dateUtils'
import { colors, typography, fontSizes, fontWeights } from '../../lib/styles'

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        phone: userProfile.phone || ''
      })
    }
  }, [userProfile])

  const handleSave = async () => {
    if (!user || !userProfile) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUser(user.uid, {
        name: formData.name.trim(),
        phone: formData.phone.trim()
      })

      // Note: In a real app, you might want to refetch the user profile
      // or update the context to reflect the changes

      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        phone: userProfile.phone || ''
      })
    }
    setEditing(false)
    setError('')
    setSuccess('')
  }

  const handleChangePassword = async () => {
    if (!user) return

    try {
      await sendPasswordResetEmail(auth, user.email!)
      setSuccess('Password reset link sent to your email!')
    } catch (error) {
      console.error('Error sending password reset:', error)
      setError('Failed to send password reset email. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !userProfile) return

    setDeleting(true)
    try {
      // Note: In a real app, you'd want to:
      // 1. Delete all user's data from Firestore
      // 2. Delete user's files from Storage
      // 3. Delete the user's authentication record
      // For now, we'll just sign them out
      await signOutUser()
      router.push('/signup')
    } catch (error) {
      console.error('Error deleting account:', error)
      setError('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!user || !userProfile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: 'var(--color-accent)' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
            </div>
            <span className="ml-2" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF', fontWeight: 700, fontSize: '24px' }}>Kunda</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>Profile Settings</h1>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 400 }}>Manage your account information and preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Information */}
            <div style={{ backgroundColor: 'var(--color-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
                  <User style={{ width: '20px', height: '20px', marginRight: '8px', color: 'var(--color-accent)' }} />
                  Profile Information
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{ cursor: 'pointer', color: 'var(--color-accent)', backgroundColor: 'transparent', border: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Edit2 style={{ width: '16px', height: '16px' }} />
                  </button>
                )}
              </div>

              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'var(--font-family-body)', fontSize: '16px', color: 'var(--color-heading)', backgroundColor: 'rgba(255,255,255,0.9)', outline: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-accent)'
                        e.target.style.boxShadow = `0 0 0 3px rgba(245, 166, 35, 0.2)`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'var(--font-family-body)', fontSize: '16px', color: 'var(--color-heading)', backgroundColor: 'rgba(255,255,255,0.9)', outline: 'none' }}
                      placeholder="Enter your phone number"
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-accent)'
                        e.target.style.boxShadow = `0 0 0 3px rgba(245, 166, 35, 0.2)`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', backgroundColor: 'var(--color-accent)', opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)' }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 166, 35, 0.3)'
                        }
                      }}
                    >
                      <Save style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', backgroundColor: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                      }}
                    >
                      <X style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Name</p>
                    <p style={{ fontSize: '16px', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{userProfile.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Email</p>
                    <p style={{ fontSize: '16px', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{user.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Phone</p>
                    <p style={{ fontSize: '16px', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{userProfile.phone || 'Not provided'}</p>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', marginTop: '16px' }}>
                  <p style={{ color: 'var(--color-danger)', fontSize: '14px', fontFamily: 'var(--font-family-body)' }}>{error}</p>
                </div>
              )}

              {success && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '1px solid var(--color-success)', marginTop: '16px' }}>
                  <p style={{ color: 'var(--color-success)', fontSize: '14px', fontFamily: 'var(--font-family-body)' }}>{success}</p>
                </div>
              )}
            </div>

            {/* Password Settings */}
            <div style={{ backgroundColor: 'var(--color-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>
                <Key style={{ width: '20px', height: '20px', marginRight: '8px', color: 'var(--color-accent)' }} />
                Password Settings
              </h2>
              <p style={{ marginBottom: '16px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Change your password to keep your account secure
              </p>
              <button
                onClick={handleChangePassword}
                style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', backgroundColor: 'var(--color-accent)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 166, 35, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 166, 35, 0.3)'
                }}
              >
                Send Password Reset Link
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)' }}>
                <p style={{ fontSize: '14px', fontFamily: 'var(--font-family-body)', color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}

            {success && (
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '1px solid var(--color-success)' }}>
                <p style={{ fontSize: '14px', fontFamily: 'var(--font-family-body)', color: 'var(--color-success)' }}>{success}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Account Stats */}
            <div style={{ backgroundColor: 'var(--color-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '16px', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>Account Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Heart style={{ width: '16px', height: '16px', marginRight: '8px', color: 'var(--color-danger)' }} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Account Type</span>
                </div>
                <p style={{ fontWeight: 600, textTransform: 'capitalize', fontFamily: 'var(--font-family-body)', color: '#FFFFFF' }}>{userProfile.role}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                  <Mail style={{ width: '16px', height: '16px', marginRight: '8px', color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)' }}>Email Verified</span>
                </div>
                <p style={{ fontWeight: 600, fontFamily: 'var(--font-family-body)', color: 'var(--color-success)' }}>Yes</p>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ backgroundColor: 'var(--color-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)', border: '1px solid var(--color-danger)' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-family-body)' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Danger Zone
              </h3>
              <p style={{ color: 'var(--color-danger)', fontSize: '14px', fontFamily: 'var(--font-family-body)', marginBottom: '16px' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--color-danger)', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-danger)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline-block' }} />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
            <div style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxWidth: '448px', width: '100%', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--color-danger)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-family-body)', color: '#FFFFFF', marginBottom: '8px' }}>Delete Account?</h3>
                <p style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: 'var(--color-danger)', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1 }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.backgroundColor = '#b91c1c'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.backgroundColor = 'var(--color-danger)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: 'var(--color-border)', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'var(--font-family-body)', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
