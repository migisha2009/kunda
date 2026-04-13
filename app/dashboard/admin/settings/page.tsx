'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { colors } from '../../../../lib/styles'
import { Settings, Save, Loader2, Mail, Shield, Bell, Globe, CreditCard, Users, FileText, AlertTriangle } from 'lucide-react'

export default function AdminSettingsPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    platform: {
      name: 'Kunda',
      description: 'Your wedding planning partner',
      email: 'contact@kunda.com',
      phone: '+1 234 567 8900',
      address: '123 Wedding Street, Love City, LC 12345'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newEnquiryAlert: true,
      bookingConfirmationAlert: true,
      paymentReceivedAlert: true
    },
    security: {
      requireEmailVerification: true,
      enableTwoFactorAuth: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8
    },
    payments: {
      enableStripe: true,
      stripePublicKey: '',
      enableFlutterwave: true,
      flutterwavePublicKey: '',
      currency: 'USD',
      taxRate: 0
    },
    features: {
      enableVendorVerification: true,
      enableCoupleMatching: true,
      enableMessaging: true,
      enableReviews: true,
      enableAnalytics: true
    },
    content: {
      welcomeMessage: 'Welcome to Kunda! Start planning your perfect wedding.',
      termsOfService: '',
      privacyPolicy: '',
      vendorGuidelines: '',
      coupleGuide: ''
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'))
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as typeof settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'platform'), settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }))
  }

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Platform Settings</h1>
                <p className="text-sm mt-2" style={{ color: '#9a7850' }}>Configure platform-wide settings and preferences</p>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#7a5c30', color: '#fdf9f5' }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Platform Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <Globe className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Platform Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Platform Name</label>
                    <input
                      type="text"
                      value={settings.platform.name}
                      onChange={(e) => updateSetting('platform', 'name', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Description</label>
                    <textarea
                      value={settings.platform.description}
                      onChange={(e) => updateSetting('platform', 'description', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={3}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Contact Email</label>
                    <input
                      type="email"
                      value={settings.platform.email}
                      onChange={(e) => updateSetting('platform', 'email', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Phone</label>
                    <input
                      type="tel"
                      value={settings.platform.phone}
                      onChange={(e) => updateSetting('platform', 'phone', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Address</label>
                    <input
                      type="text"
                      value={settings.platform.address}
                      onChange={(e) => updateSetting('platform', 'address', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <Bell className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Notifications</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Email Notifications</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Send notifications via email</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.emailNotifications ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>SMS Notifications</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Send notifications via SMS</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'smsNotifications', !settings.notifications.smsNotifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.smsNotifications ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.smsNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Push Notifications</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Send push notifications</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.pushNotifications ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>New Enquiry Alerts</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Alert on new enquiries</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'newEnquiryAlert', !settings.notifications.newEnquiryAlert)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.newEnquiryAlert ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.newEnquiryAlert ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Booking Confirmation Alerts</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Alert on booking confirmations</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'bookingConfirmationAlert', !settings.notifications.bookingConfirmationAlert)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.bookingConfirmationAlert ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.bookingConfirmationAlert ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Payment Received Alerts</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Alert on payments received</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', 'paymentReceivedAlert', !settings.notifications.paymentReceivedAlert)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications.paymentReceivedAlert ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications.paymentReceivedAlert ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <Shield className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Security</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Email Verification Required</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Require email verification for new users</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'requireEmailVerification', !settings.security.requireEmailVerification)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.security.requireEmailVerification ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.security.requireEmailVerification ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Two-Factor Authentication</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable 2FA for admin accounts</p>
                    </div>
                    <button
                      onClick={() => updateSetting('security', 'enableTwoFactorAuth', !settings.security.enableTwoFactorAuth)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.security.enableTwoFactorAuth ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.security.enableTwoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Session Timeout (hours)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Password Min Length</label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <CreditCard className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Payment Gateway</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Enable Stripe</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Accept payments via Stripe</p>
                    </div>
                    <button
                      onClick={() => updateSetting('payments', 'enableStripe', !settings.payments.enableStripe)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.payments.enableStripe ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.payments.enableStripe ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {settings.payments.enableStripe && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Stripe Public Key</label>
                      <input
                        type="text"
                        value={settings.payments.stripePublicKey}
                        onChange={(e) => updateSetting('payments', 'stripePublicKey', e.target.value)}
                        placeholder="pk_test_..."
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Enable Flutterwave</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Accept payments via Flutterwave</p>
                    </div>
                    <button
                      onClick={() => updateSetting('payments', 'enableFlutterwave', !settings.payments.enableFlutterwave)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.payments.enableFlutterwave ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.payments.enableFlutterwave ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {settings.payments.enableFlutterwave && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Flutterwave Public Key</label>
                      <input
                        type="text"
                        value={settings.payments.flutterwavePublicKey}
                        onChange={(e) => updateSetting('payments', 'flutterwavePublicKey', e.target.value)}
                        placeholder="FLWPUBK_TEST-..."
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Default Currency</label>
                    <select
                      value={settings.payments.currency}
                      onChange={(e) => updateSetting('payments', 'currency', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Tax Rate (%)</label>
                    <input
                      type="number"
                      value={settings.payments.taxRate}
                      onChange={(e) => updateSetting('payments', 'taxRate', parseFloat(e.target.value))}
                      step="0.1"
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                </div>
              </div>

              {/* Feature Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <Settings className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Features</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Vendor Verification</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable vendor verification system</p>
                    </div>
                    <button
                      onClick={() => updateSetting('features', 'enableVendorVerification', !settings.features.enableVendorVerification)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.features.enableVendorVerification ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.features.enableVendorVerification ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Couple Matching</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable couple matching algorithm</p>
                    </div>
                    <button
                      onClick={() => updateSetting('features', 'enableCoupleMatching', !settings.features.enableCoupleMatching)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.features.enableCoupleMatching ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.features.enableCoupleMatching ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Messaging System</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable messaging between users</p>
                    </div>
                    <button
                      onClick={() => updateSetting('features', 'enableMessaging', !settings.features.enableMessaging)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.features.enableMessaging ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.features.enableMessaging ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Reviews & Ratings</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable review system</p>
                    </div>
                    <button
                      onClick={() => updateSetting('features', 'enableReviews', !settings.features.enableReviews)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.features.enableReviews ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.features.enableReviews ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>Analytics Dashboard</p>
                      <p className="text-xs" style={{ color: '#9a7850' }}>Enable analytics for vendors</p>
                    </div>
                    <button
                      onClick={() => updateSetting('features', 'enableAnalytics', !settings.features.enableAnalytics)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.features.enableAnalytics ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.features.enableAnalytics ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Settings */}
              <div className="p-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid ${colors.border}' }}>
                <div className="flex items-center mb-6">
                  <FileText className="w-5 h-5 mr-2" style={{ color: '#7a5c30' }} />
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>Content</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Welcome Message</label>
                    <textarea
                      value={settings.content.welcomeMessage}
                      onChange={(e) => updateSetting('content', 'welcomeMessage', e.target.value)}
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={3}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Terms of Service</label>
                    <textarea
                      value={settings.content.termsOfService}
                      onChange={(e) => updateSetting('content', 'termsOfService', e.target.value)}
                      placeholder="Enter terms of service content..."
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={4}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Privacy Policy</label>
                    <textarea
                      value={settings.content.privacyPolicy}
                      onChange={(e) => updateSetting('content', 'privacyPolicy', e.target.value)}
                      placeholder="Enter privacy policy content..."
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={4}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Vendor Guidelines</label>
                    <textarea
                      value={settings.content.vendorGuidelines}
                      onChange={(e) => updateSetting('content', 'vendorGuidelines', e.target.value)}
                      placeholder="Enter vendor guidelines..."
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={3}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Couple Guide</label>
                    <textarea
                      value={settings.content.coupleGuide}
                      onChange={(e) => updateSetting('content', 'coupleGuide', e.target.value)}
                      placeholder="Enter couple guide content..."
                      className="w-full px-4 py-2 rounded focus:outline-none"
                      rows={3}
                      style={{ backgroundColor: '#faf6f1', border: '0.5px solid ${colors.border}', color: '#3a2a1a' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Section */}
            <div className="mt-8 p-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '0.5px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#3a2a1a' }}>Important Notice</h3>
                  <p className="text-sm" style={{ color: '#9a7850' }}>
                    Changes to platform settings may affect all users. Please review carefully before saving. 
                    Some changes may require users to re-login or may affect ongoing processes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
