'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { db, storage } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const CATS = ['Photography','Venues','Catering','Floristry','Music & DJ','Decor','Bridal Wear','Cake','Hair & Makeup','Transport']

export default function VendorProfile() {
  const { loading } = useRequireAuth('vendor')
  const { user, userProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [generatingBio, setGeneratingBio] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    businessName: '',
    category: 'Photography',
    bio: '',
    location: '',
    minPrice: 0,
    maxPrice: 0,
    currency: 'USD',
    website: '',
    instagram: '',
    whatsapp: '',
  })

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      try {
        const q = query(collection(db, 'vendors'), where('userId', '==', user.uid))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const d = snap.docs[0].data()
          setVendorId(snap.docs[0].id)
          setForm({
            businessName: d.businessName || '',
            category: d.category || 'Photography',
            bio: d.bio || '',
            location: d.location || '',
            minPrice: d.pricing?.min || 0,
            maxPrice: d.pricing?.max || 0,
            currency: d.pricing?.currency || 'USD',
            website: d.contact?.website || '',
            instagram: d.contact?.instagram || '',
            whatsapp: d.contact?.whatsapp || '',
          })
          setImages(d.portfolioImages || [])
        }
      } catch (e) { console.error(e) }
    }
    fetch()
  }, [user])

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      const data = {
        userId: user.uid,
        businessName: form.businessName,
        category: form.category,
        bio: form.bio,
        location: form.location,
        pricing: { min: Number(form.minPrice), max: Number(form.maxPrice), currency: form.currency },
        contact: { website: form.website, instagram: form.instagram, whatsapp: form.whatsapp },
        portfolioImages: images,
        updatedAt: new Date(),
      }
      if (vendorId) {
        await updateDoc(doc(db, 'vendors', vendorId), data)
      } else {
        const r = doc(collection(db, 'vendors'))
        await setDoc(r, { ...data, verified: false, rating: 0, reviewCount: 0, createdAt: new Date() })
        setVendorId(r.id)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || images.length >= 10) return
    setUploading(true)
    try {
      const files = Array.from(e.target.files).slice(0, 10 - images.length)
      const urls: string[] = []
      for (const f of files) {
        const r = ref(storage, `vendors/${user.uid}/${Date.now()}-${f.name}`)
        await uploadBytes(r, f)
        urls.push(await getDownloadURL(r))
      }
      setImages(p => [...p, ...urls])
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  const generateBio = async () => {
    setGeneratingBio(true)
    try {
      const res = await fetch('/api/ai/vendor-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          category: form.category,
          location: form.location,
          specialties: form.category,
        })
      })
      const data = await res.json()
      if (data.bio) {
        setForm(prev => ({ ...prev, bio: data.bio }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingBio(false)
    }
  }

  const calculateProfileCompletion = () => {
    let completion = 0
    const fields = [
      { key: 'businessName', value: form.businessName, weight: 20 },
      { key: 'category', value: form.category !== 'Photography', weight: 15 },
      { key: 'bio', value: form.bio.length > 50, weight: 20 },
      { key: 'location', value: form.location, weight: 15 },
      { key: 'pricing', value: form.minPrice > 0 && form.maxPrice > 0, weight: 15 },
      { key: 'contact', value: form.website || form.instagram || form.whatsapp, weight: 10 },
      { key: 'portfolio', value: images.length >= 3, weight: 5 }
    ]
    
    fields.forEach(field => {
      if (field.value) {
        completion += field.weight
      }
    })
    
    return completion
  }

  const profileCompletion = calculateProfileCompletion()
  const getMissingFields = () => {
    const missing = []
    if (!form.businessName) missing.push('Business Name')
    if (form.category === 'Photography') missing.push('Category')
    if (form.bio.length < 50) missing.push('Bio (50+ chars)')
    if (!form.location) missing.push('Location')
    if (form.minPrice === 0 || form.maxPrice === 0) missing.push('Pricing')
    if (!form.website && !form.instagram && !form.whatsapp) missing.push('Contact Info')
    if (images.length < 3) missing.push('Portfolio (3+ images)')
    return missing
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5edff', background: '#ffffff', padding: '12px 16px', fontSize: 14, fontFamily: 'Urbanist', color: '#111928', outline: 'none', boxSizing: 'border-box', borderRadius: '8px', transition: 'border-color 0.2s ease' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a56db', marginBottom: 8, fontFamily: 'Urbanist' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #ebf5ff', borderTop: '3px solid #1a56db', animation: 'spin 1s linear infinite' }} /></div>

  const dashFooter = (
  <footer style={{
    background: '#ffffff',
    borderTop: '1px solid #e5edff',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Urbanist, sans-serif',
    marginTop: 'auto',
  }}>
    <div style={{ fontSize: 13, color: '#9ca3af' }}>
      © 2026 Kunda Wedding Platform · Kigali, Rwanda
    </div>
    <div style={{
      display: 'flex', gap: 20, alignItems: 'center'
    }}>
      <a href="https://wa.me/250783312746"
        target="_blank"
        style={{ fontSize: 13, color: '#6b7280',
          textDecoration: 'none' }}>
        WhatsApp Support
      </a>
      <a href="https://instagram.com/darkxente"
        target="_blank"
        style={{ fontSize: 13, color: '#6b7280',
          textDecoration: 'none' }}>
        @darkxente
      </a>
      <span style={{ fontSize: 13, color: '#9ca3af' }}>
        Made with in Rwanda
      </span>
    </div>
  </footer>
)

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f0f4ff', 
      fontFamily: 'Urbanist',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#ffffff', borderBottom: '1px solid #e5edff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            background: '#1a56db',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            
          </div>
          <span style={{ fontFamily: 'Urbanist', fontSize: 20, fontWeight: 800, color: '#0f2460', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Kunda</span>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['Overview','/dashboard/vendor'],['Profile','/dashboard/vendor/profile'],['Bookings','/dashboard/vendor/bookings'],['Analytics','/dashboard/vendor/analytics']].map(([l,h]) => (
            <a key={l} href={h} style={{ 
              padding: '0 18px',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: window.location.pathname === h ? '#1a56db' : '#6b7280',
              textDecoration: 'none',
              borderBottom: window.location.pathname === h ? '2px solid #1a56db' : '2px solid transparent',
              transition: 'all 0.2s',
              fontFamily: 'Urbanist, sans-serif',
            }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#1a56db,#3f83f8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
          }}>
            {(userProfile?.name || 'Vendor').substring(0,2).toUpperCase()}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111928' }}>{userProfile?.name || 'Vendor'}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a56db', marginBottom: 8, fontWeight: 700 }}>Vendor Profile</p>
        <h1 style={{ fontFamily: 'Urbanist', fontSize: 36, fontWeight: 800, color: '#111928', marginBottom: 8, letterSpacing: '-0.02em' }}>Edit Your Profile</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32 }}>Complete your profile to appear in vendor discovery</p>

        {/* Profile Completion Bar */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5edff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontFamily: 'Urbanist', fontSize: '16px', fontWeight: 600, color: '#111928', marginBottom: '4px' }}>
                Profile Completion
              </h3>
              <p style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280' }}>
                Complete your profile to get more enquiries from couples
              </p>
            </div>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '32px',
              fontWeight: 800,
              color: profileCompletion === 100 ? '#057a55' : '#1a56db'
            }}>
              {profileCompletion}%
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e5edff',
            borderRadius: '50px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${profileCompletion}%`,
              height: '100%',
              backgroundColor: profileCompletion === 100 ? '#057a55' : '#1a56db',
              borderRadius: '50px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          
          {/* Missing Fields */}
          {profileCompletion < 100 && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Still missing:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getMissingFields().map((field, index) => (
                  <span key={index} style={{
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    fontFamily: 'Urbanist'
                  }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {profileCompletion === 100 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#057a55',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#ffffff', fontSize: '12px' }}>×</span>
              </div>
              <p style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#057a55', fontWeight: 500 }}>
                Your profile is complete! You're ready to receive enquiries.
              </p>
            </div>
          )}
        </div>

        {saved && <div style={{ 
          background: '#def7ec', 
          border: '1px solid #057a55', 
          padding: '12px 16px', 
          marginBottom: 24, 
          color: '#057a55', 
          fontSize: 14,
          fontWeight: 600,
          borderRadius: '8px',
          fontFamily: 'Urbanist'
        }}>Profile saved successfully!</div>}

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e5edff', 
          borderRadius: '12px', 
          padding: '32px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontFamily: 'Urbanist', 
            fontSize: 20, 
            fontWeight: 700, 
            color: '#111928', 
            marginBottom: 24, 
            paddingBottom: 12, 
            borderBottom: '1px solid #e5edff'
          }}>Basic Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Business Name *</label>
              <input value={form.businessName} onChange={e => setForm(p => ({...p, businessName: e.target.value}))} placeholder="Your business name" style={inp} />
            </div>
            <div>
              <label style={lbl}>Category *</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} style={inp}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Location *</label>
            <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="City, Country" style={inp} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={lbl}>Bio</label>
              <button 
                onClick={generateBio}
                disabled={generatingBio}
                style={{
                  background: 'linear-gradient(135deg,#1a56db,#3f83f8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Urbanist, sans-serif',
                }}
              >
                {generatingBio ? 'Writing...' : ' Write with AI'}
              </button>
            </div>
            <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} placeholder="Tell couples about your business..." rows={4} style={{...inp, resize: 'vertical'}} />
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{form.bio.length}/500</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Min Price</label>
              <input type="number" value={form.minPrice} onChange={e => setForm(p => ({...p, minPrice: Number(e.target.value)}))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Max Price</label>
              <input type="number" value={form.maxPrice} onChange={e => setForm(p => ({...p, maxPrice: Number(e.target.value)}))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <select value={form.currency} onChange={e => setForm(p => ({...p, currency: e.target.value}))} style={inp}>
                <option value="USD">USD</option>
                <option value="RWF">RWF</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e5edff', 
          borderRadius: '12px', 
          padding: '32px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontFamily: 'Urbanist', 
            fontSize: 20, 
            fontWeight: 700, 
            color: '#111928', 
            marginBottom: 24, 
            paddingBottom: 12, 
            borderBottom: '1px solid #e5edff'
          }}>Contact & Social</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Website</label>
              <input value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} placeholder="https://..." style={inp} />
            </div>
            <div>
              <label style={lbl}>Instagram</label>
              <input value={form.instagram} onChange={e => setForm(p => ({...p, instagram: e.target.value}))} placeholder="@handle" style={inp} />
            </div>
            <div>
              <label style={lbl}>WhatsApp</label>
              <input value={form.whatsapp} onChange={e => setForm(p => ({...p, whatsapp: e.target.value}))} placeholder="+250..." style={inp} />
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e5edff', 
          borderRadius: '12px', 
          padding: '32px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            fontFamily: 'Urbanist', 
            fontSize: 20, 
            fontWeight: 700, 
            color: '#111928', 
            marginBottom: 24, 
            paddingBottom: 12, 
            borderBottom: '1px solid #e5edff'
          }}>Portfolio ({images.length}/10)</h2>
          <label style={{ 
            display: 'block', 
            border: '2px dashed #e5edff', 
            background: '#f8faff', 
            padding: '40px', 
            textAlign: 'center', 
            cursor: 'pointer',
            borderRadius: '12px',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#1a56db'
              e.currentTarget.style.backgroundColor = '#f0f4ff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e5edff'
              e.currentTarget.style.backgroundColor = '#f8faff'
            }}
          >
            <input type="file" accept="image/*" multiple onChange={upload} style={{ display: 'none' }} disabled={images.length >= 10 || uploading} />
            <div style={{ fontSize: 16, color: '#1a56db', fontWeight: 600, marginBottom: 8 }}>
              {uploading ? 'Uploading...' : 'Click to upload images'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>PNG, JPG up to 5MB each</div>
          </label>
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginTop: 24 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: '8px' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => setImages(p => p.filter((_,idx) => idx !== i))} 
                    style={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      width: 24, 
                      height: 24, 
                      background: 'rgba(0,0,0,0.7)', 
                      color: '#fff', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: 14,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.9)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={save} 
          disabled={saving} 
          style={{ 
            width: '100%', 
            background: saving ? '#9ca3af' : '#1a56db', 
            color: '#ffffff', 
            border: 'none', 
            padding: '16px', 
            fontSize: 14, 
            fontWeight: 700,
            letterSpacing: '0.06em', 
            textTransform: 'uppercase', 
            cursor: saving ? 'not-allowed' : 'pointer', 
            fontFamily: 'Urbanist', 
            marginBottom: 32,
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            if (!saving) {
              e.currentTarget.style.background = '#0f2460'
            }
          }}
          onMouseLeave={e => {
            if (!saving) {
              e.currentTarget.style.background = '#1a56db'
            }
          }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      {dashFooter}
    </div>
  )
}
