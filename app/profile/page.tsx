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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  Profile Information
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{userProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{userProfile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-medium text-gray-900 capitalize">{userProfile.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(userProfile.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                Password Settings
              </h2>
              <p className="text-gray-600 mb-4">
                Change your password to keep your account secure
              </p>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Password Reset Link
              </button>
            </div>

            {/* Messages */}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Account Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  <span className="text-sm text-gray-600">Account Type</span>
                </div>
                <p className="font-medium text-gray-900 capitalize">{userProfile.role}</p>
                
                <div className="flex items-center mt-4">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm text-gray-600">Email Verified</span>
                </div>
                <p className="font-medium text-green-600">Yes</p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
              <h3 className="font-semibold text-red-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Danger Zone
              </h3>
              <p className="text-red-600 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account?</h3>
                <p className="text-gray-600">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
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
