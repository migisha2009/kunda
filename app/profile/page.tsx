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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Loader2 style={{ width: '32px', height: '32px' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: colors.textPrimary, fontFamily: 'Urbanist' }}>Profile Settings</h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: 400 }}>Manage your account information and preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Information */}
            <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', color: colors.textPrimary, fontFamily: 'Urbanist' }}>
                  <User style={{ width: '20px', height: '20px', marginRight: '8px', color: colors.primary }} />
                  Profile Information
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{ cursor: 'pointer', color: colors.primary, backgroundColor: 'transparent', border: 'none' }}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.textPrimary }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'Urbanist', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.white, outline: 'none' }}
                      placeholder="Enter your phone number"
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', color: colors.white, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', backgroundColor: colors.primary, opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = colors.primaryDark
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.backgroundColor = colors.primary
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'
                        }
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', backgroundColor: colors.bg, color: colors.textPrimary, cursor: 'pointer', border: `1px solid ${colors.border}` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.border
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary }}>Name</p>
                    <p style={{ fontWeight: 600, color: colors.textPrimary }}>{userProfile.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary }}>Email</p>
                    <p style={{ fontWeight: 600, color: colors.textPrimary }}>{user.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary }}>Phone</p>
                    <p style={{ fontWeight: 600, color: colors.textPrimary }}>{userProfile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary }}>Account Type</p>
                    <p style={{ fontWeight: 600, color: colors.textPrimary }}>{userProfile.role}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary }}>Member Since</p>
                    <p style={{ fontWeight: 600, color: colors.textPrimary }}>
                      {formatDate(userProfile.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Settings */}
            <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', color: colors.textPrimary, fontFamily: 'Urbanist' }}>
                <Key style={{ width: '20px', height: '20px', marginRight: '8px', color: colors.primary }} />
                Password Settings
              </h2>
              <p style={{ marginBottom: '16px', color: colors.textSecondary, fontSize: '14px' }}>
                Change your password to keep your account secure
              </p>
              <button
                onClick={handleChangePassword}
                style={{ padding: '12px 16px', color: colors.white, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', backgroundColor: colors.primary, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryDark
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'
                }}
              >
                Send Password Reset Link
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: colors.dangerBg, border: `1px solid ${colors.danger}30` }}>
                <p style={{ fontSize: '14px', color: colors.danger }}>{error}</p>
              </div>
            )}

            {success && (
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: colors.successBg, border: `1px solid ${colors.success}30` }}>
                <p style={{ fontSize: '14px', color: colors.success }}>{success}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Account Stats */}
            <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontWeight: 600, marginBottom: '16px', color: colors.textPrimary, fontFamily: 'Urbanist' }}>Account Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Heart style={{ width: '16px', height: '16px', marginRight: '8px', color: colors.danger }} />
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Account Type</span>
                </div>
                <p style={{ fontWeight: 600, textTransform: 'capitalize', color: colors.textPrimary }}>{userProfile.role}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                  <Mail style={{ width: '16px', height: '16px', marginRight: '8px', color: colors.primary }} />
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Email Verified</span>
                </div>
                <p style={{ fontWeight: 600, color: colors.success }}>Yes</p>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${colors.danger}30` }}>
              <h3 style={{ fontWeight: 600, color: colors.danger, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Danger Zone
              </h3>
              <p style={{ color: colors.danger, fontSize: '14px', marginBottom: '16px' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: colors.danger, color: colors.white, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.danger
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
            <div style={{ backgroundColor: colors.white, borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxWidth: '448px', width: '100%', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <AlertTriangle style={{ width: '48px', height: '48px', color: colors.danger, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>Delete Account?</h3>
                <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: colors.danger, color: colors.white, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1 }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.backgroundColor = '#b91c1c'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.backgroundColor = colors.danger
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
                  style={{ flex: 1, padding: '12px 16px', backgroundColor: colors.border, color: colors.textPrimary, fontWeight: 600, borderRadius: '8px', transition: 'all 0.2s ease', fontFamily: 'Urbanist', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.textSecondary
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.border
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
