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

  const inp: React.CSSProperties = { width: '100%', borderBottom: '1px solid #c7d2fe', background: '#f7f8fd', padding: '10px 14px', fontSize: 13, fontFamily: 'Urbanist', color: '#333', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7eb9', marginBottom: 6, fontFamily: 'Urbanist' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#f7f8fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #c7d2fe', borderTop: '2px solid #4f69f6', animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fd', fontFamily: 'Urbanist' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '0.5px solid #c7d2fe' }}>
        <span style={{ fontFamily: 'Urbanist', fontSize: 20, color: '#4f69f6', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Kunda</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Overview','/dashboard/vendor'],['Profile','/dashboard/vendor/profile'],['Bookings','/dashboard/vendor/bookings']].map(([l,h]) => (
            <a key={l} href={h} style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: l === 'Profile' ? '#7a5c30' : '#9a7850', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 13, color: '#1a56db' }}>{userProfile?.name || 'Vendor'}</span>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1a56db', marginBottom: 6 }}>Vendor Profile</p>
        <h1 style={{ fontFamily: 'Urbanist', fontSize: 36, fontWeight: 300, color: '#111928', marginBottom: 4 }}>Edit Your Profile</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>Complete your profile to appear in vendor discovery</p>

        {saved && <div style={{ background: '#1a56db', border: '0.5px solid #5dcaa5', padding: '12px 16px', marginBottom: 20, color: '#085041', fontSize: 13 }}>Profile saved!</div>}

        <div style={{ background: '#fff', border: '1px solid #e5edff', padding: 28, marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Urbanist', fontSize: 20, color: '#111928', marginBottom: 16, paddingBottom: 10, borderBottom: '0.5px solid ${colors.border}' }}>Basic Information</h2>
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

        <div style={{ background: '#fff', border: '1px solid #e5edff', padding: 28, marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Urbanist', fontSize: 20, color: '#111928', marginBottom: 16, paddingBottom: 10, borderBottom: '0.5px solid ${colors.border}' }}>Contact & Social</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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

        <div style={{ background: '#fff', border: '1px solid #e5edff', padding: 28, marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Urbanist', fontSize: 20, color: '#111928', marginBottom: 16, paddingBottom: 10, borderBottom: '0.5px solid ${colors.border}' }}>Portfolio ({images.length}/10)</h2>
          <label style={{ display: 'block', border: '1px dashed ${colors.border}', background: '#f0f4ff', padding: 32, textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/*" multiple onChange={upload} style={{ display: 'none' }} disabled={images.length >= 10 || uploading} />
            <div style={{ fontSize: 13, color: '#6b7280' }}>{uploading ? 'Uploading...' : 'Click to upload images'}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPG up to 5MB each</div>
          </label>
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 16 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setImages(p => p.filter((_,idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} style={{ width: '100%', background: saving ? '#9ca3af' : '#1a56db', color: '#fdf9f5', border: 'none', padding: 14, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist', marginBottom: 32 }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  )
}
