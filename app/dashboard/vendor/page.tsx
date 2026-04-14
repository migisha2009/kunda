'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { db } from '@/lib/firebase'
import { collection, query, where, 
  getDocs, onSnapshot, orderBy, 
  limit } from 'firebase/firestore'
import { formatDate } from '@/lib/dateUtils'
import { Heart } from 'lucide-react'

export default function VendorDashboard() {
  const { loading } = useRequireAuth('vendor')
  const { user, userProfile } = useAuth()
  
  const [vendorProfile, setVendorProfile] = 
    useState<any>(null)
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    weekEnquiries: 0,
    confirmedBookings: 0,
    upcomingBookings: 0,
    totalRevenue: 0,
    avgRating: 0,
    reviewCount: 0,
    profileCompletion: 0,
  })
  const [recentEnquiries, setRecentEnquiries] = 
    useState<any[]>([])
  const [dataLoading, setDataLoading] = 
    useState(true)
  const [hoveredCard, setHoveredCard] = 
    useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = 
    useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      const vQuery = query(
        collection(db, 'vendors'),
        where('userId', '==', user.uid)
      )
      const vSnap = await getDocs(vQuery)
      
      if (!vSnap.empty) {
        const vData = {
          id: vSnap.docs[0].id,
          ...vSnap.docs[0].data()
        }
        setVendorProfile(vData)
        
        const completion = calcCompletion(vData)
        
        const eQuery = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', user.uid)
        )
        const eSnap = await getDocs(eQuery)
        const enquiries = eSnap.docs.map(d => ({
          id: d.id, ...d.data()
        }))
        
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const bQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', user.uid)
        )
        const bSnap = await getDocs(bQuery)
        const bookings = bSnap.docs.map(d => ({
          id: d.id, ...d.data()
        }))
        
        const paid = bookings.filter(
          (b: any) => b.status === 'paid'
        )
        const confirmed = bookings.filter(
          (b: any) => b.status === 'confirmed' 
            || b.status === 'paid'
        )
        const revenue = paid.reduce(
          (sum: number, b: any) => sum + (b.amount || 0), 0
        )
        
        setStats({
          totalEnquiries: enquiries.length,
          weekEnquiries: enquiries.filter((e: any) => {
            if (!e.createdAt) return false
            const d = e.createdAt?.toDate?.() 
              || new Date(e.createdAt)
            return d > weekAgo
          }).length,
          confirmedBookings: confirmed.length,
          upcomingBookings: confirmed.length,
          totalRevenue: revenue,
          avgRating: (vData as any).rating || 0,
          reviewCount: (vData as any).reviewCount || 0,
          profileCompletion: completion,
        })
        
        const recentQ = query(
          collection(db, 'enquiries'),
          where('vendorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const recentSnap = await getDocs(recentQ)
        setRecentEnquiries(recentSnap.docs.map(d => ({
          id: d.id, ...d.data()
        })))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDataLoading(false)
    }
  }

  const calcCompletion = (v: any) => {
    let score = 0
    if (v.businessName) score += 20
    if (v.category) score += 20
    if (v.bio) score += 15
    if (v.location) score += 15
    if (v.portfolioImages?.length > 0) score += 15
    if (v.pricing?.min) score += 15
    return score
  }

  const signOut = async () => {
    const { signOutUser } = await import('@/lib/auth')
    await signOutUser()
    window.location.href = '/login'
  }

  const name = vendorProfile?.businessName 
    || userProfile?.name || 'Vendor'
  const initials = name.substring(0, 2).toUpperCase()

  const statCards = [
    {
      id: 'enquiries',
      label: 'Total Enquiries',
      value: stats.totalEnquiries,
      hint: `${stats.weekEnquiries} this week`,
      color: '#1a56db',
      bg: '#ebf5ff',
      icon: ' ',
    },
    {
      id: 'bookings',
      label: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      hint: `${stats.upcomingBookings} upcoming`,
      color: '#7c3aed',
      bg: '#ede9fe',
      icon: ' ',
    },
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      hint: 'from paid bookings',
      color: '#057a55',
      bg: '#def7ec',
      icon: ' ',
    },
    {
      id: 'rating',
      label: 'Avg Rating',
      value: stats.avgRating || ' ',
      hint: `${stats.reviewCount} reviews`,
      color: '#c2410c',
      bg: '#fff7ed',
      icon: ' ',
    },
  ]

  if (loading || dataLoading) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '3px solid rgba(245, 166, 35, 0.2)',
        borderTop: '3px solid var(--color-accent)',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      fontFamily: 'var(--font-family-body)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg) } 
        }
        @keyframes fadeInUp { 
          from { opacity:0; transform:translateY(20px) } 
          to { opacity:1; transform:translateY(0) } 
        }
        @keyframes pulse {
          0%,100% { opacity:0.5; }
          50% { opacity:1; }
        }
      `}</style>

      <nav style={{
        background: 'var(--color-card)',
        height: 64,
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)',
        className: 'nav-padding',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'var(--color-accent)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            <Heart className="w-5 h-5 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
          </div>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#FFFFFF',
            fontFamily: 'var(--font-family-heading)',
          }}>
            Kunda
          </span>
          <span style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            marginLeft: 4,
            fontFamily: 'var(--font-family-body)',
          }}>
            · Vendor
          </span>
        </div>

        <div className="desktop-nav" style={{
          gap: 0,
        }}>
          {[
            ['Overview', '/dashboard/vendor'],
            ['Profile', '/dashboard/vendor/profile'],
            ['Bookings', '/dashboard/vendor/bookings'],
            ['Analytics', '/dashboard/vendor/analytics'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{
                padding: '0 18px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: window.location.pathname === href
                  ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                borderBottom: window.location.pathname === href
                  ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-family-body)',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--gradient-hero)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#FFFFFF',
            fontFamily: 'var(--font-family-body)',
          }}>
            {name}
          </span>
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1.5px solid var(--color-accent)',
              color: 'var(--color-accent)',
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu" style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          background: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border)',
          zIndex: 40,
          padding: '16px',
        }}>
          {[
            ['Overview', '/dashboard/vendor'],
            ['Profile', '/dashboard/vendor/profile'],
            ['Bookings', '/dashboard/vendor/bookings'],
            ['Analytics', '/dashboard/vendor/analytics'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{
                display: 'block',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: window.location.pathname === href
                  ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                borderRadius: 8,
                marginBottom: '4px',
                fontFamily: 'var(--font-family-body)',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      <div className="hero-padding" style={{
        background: 'var(--gradient-hero)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
          top: -100,
          right: 200,
        }} />
        <div style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
          top: -200,
          right: 100,
        }} />

        <div style={{ zIndex: 1 }}>
          {/* Welcome badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'var(--font-family-body)',
            }}>
              Vendor Dashboard
            </span>
          </div>
          
          {/* Vendor name */}
          <h1 className="hero-title" style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '12px',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-family-heading)',
            lineHeight: 1.1,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {name}
          </h1>
          
          {/* Business details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 16,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'var(--font-family-body)',
              fontWeight: 500
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V5C16 3.93913 15.5786 2.92172 14.8284 2.17157C14.0783 1.42143 13.0609 1 12 1H9C7.93913 1 6.92172 1.42143 6.17157 2.17157C5.42143 2.92172 5 3.93913 5 5V21M8 21H16M12 11H12.01" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {vendorProfile?.category || 'Wedding Vendor'}
            </div>
            {vendorProfile?.location && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 16,
                color: 'rgba(255,255,255,0.9)',
                fontFamily: 'var(--font-family-body)',
                fontWeight: 500
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.58172 7.02944 2 12 2C16.9706 2 21 5.58172 21 10Z" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {vendorProfile.location}
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          zIndex: 1,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {vendorProfile?.verified ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
              color: 'var(--color-success)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-family-body)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Verified Vendor
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(245, 166, 35, 0.1))',
              color: 'var(--color-accent)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-family-body)',
              border: '1px solid rgba(245, 166, 35, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V11M12 15H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Pending Verification
            </div>
          )}
          
          <a
            href="/dashboard/vendor/profile"
            style={{
              background: '#ffffff',
              color: 'var(--color-accent)',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'var(--font-family-body)',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit Profile
          </a>
          
          <a
            href="/dashboard/vendor/bookings"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-family-body)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H9M9 5V3M9 5H15M15 5V3M15 5H17C18.1046 5 19 5.89543 19 7V19C19 20.1046 18.1046 21 17 21H15M15 5V3M9 3H15M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            My Bookings
          </a>
        </div>
      </div>

      {stats.profileCompletion < 100 && (
        <div style={{
          margin: '20px 24px 0',
          background: 'linear-gradient(135deg, var(--color-card), rgba(245, 166, 35, 0.05))',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
          onClick={() => window.location.href = 
            '/dashboard/vendor/profile'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 166, 35, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--color-accent), rgba(245, 166, 35, 0.8), var(--color-accent))',
            animation: 'shimmer 2s linear infinite'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-accent), rgba(245, 166, 35, 0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '4px',
                fontFamily: 'var(--font-family-body)',
                letterSpacing: '-0.01em'
              }}>
                Complete Your Profile
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'var(--font-family-body)',
                lineHeight: 1.4
              }}>
                Add more details to attract couples and increase your chances of getting verified
              </div>
            </div>
            
            <div style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--color-accent)',
              minWidth: '60px',
              textAlign: 'center',
              fontFamily: 'var(--font-family-body)',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              lineHeight: 1
            }}>
              {stats.profileCompletion}%
            </div>
          </div>
          
          <div style={{
            height: '8px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${stats.profileCompletion}%`,
              background: 'linear-gradient(90deg, var(--color-accent), rgba(245, 166, 35, 0.8))',
              borderRadius: 4,
              transition: 'width 1.5s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `${stats.profileCompletion}%`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '3px solid var(--color-accent)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '12px'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-family-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Click to complete profile
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid content-padding" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        animation: 'fadeInUp 0.5s ease',
      }}>
        {statCards.map((card, i) => (
          <div
            key={card.id}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--color-card)',
              borderRadius: 12,
              border: hoveredCard === card.id
                ? '1px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              boxShadow: hoveredCard === card.id
                ? '0 8px 24px rgba(245, 166, 35, 0.25)'
                : '0 4px 12px rgba(75, 71, 165, 0.15)',
              padding: '18px 20px',
              transform: hoveredCard === card.id
                ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.25s ease',
              animation: `fadeInUp 0.5s ease ${i*0.1}s both`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 4,
              background: card.color === '#1a56db' ? 'var(--color-accent)' : 
                       card.color === '#7c3aed' ? 'var(--color-accent)' :
                       card.color === '#057a55' ? 'var(--color-success)' :
                       card.color === '#c2410c' ? 'var(--color-accent)' : 'var(--color-accent)',
              borderRadius: '12px 12px 0 0',
            }} />
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: card.color === '#1a56db' ? 'linear-gradient(135deg, var(--color-accent), rgba(245, 166, 35, 0.8))' :
                       card.color === '#7c3aed' ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)' :
                       card.color === '#057a55' ? 'linear-gradient(135deg, #10B981, #34D399)' :
                       card.color === '#c2410c' ? 'linear-gradient(135deg, #F59E0B, #FCD34D)' : 'linear-gradient(135deg, var(--color-accent), rgba(245, 166, 35, 0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: card.color === '#1a56db' ? '0 4px 12px rgba(245, 166, 35, 0.3)' :
                       card.color === '#7c3aed' ? '0 4px 12px rgba(139, 92, 246, 0.3)' :
                       card.color === '#057a55' ? '0 4px 12px rgba(16, 185, 129, 0.3)' :
                       card.color === '#c2410c' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 4px 12px rgba(245, 166, 35, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                color: '#ffffff',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {card.icon}
              </div>
            </div>
            <div className="stat-value" style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 6,
              fontFamily: 'var(--font-family-body)',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 6,
              fontFamily: 'var(--font-family-body)',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: card.color === '#1a56db' ? 'rgba(245, 166, 35, 0.8)' : 
                     card.color === '#7c3aed' ? 'rgba(139, 92, 246, 0.8)' :
                     card.color === '#057a55' ? 'rgba(16, 185, 129, 0.8)' :
                     card.color === '#c2410c' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 166, 35, 0.8)',
              fontFamily: 'var(--font-family-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {card.hint}
            </div>
          </div>
        ))}
      </div>

      <div className="main-content-grid content-padding" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 16,
        flex: 1,
      }}>

        <div style={{
          background: 'var(--color-card)',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(75, 71, 165, 0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.05), transparent)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--color-accent), rgba(245, 166, 35, 0.8))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-family-body)',
                  letterSpacing: '-0.02em',
                  marginBottom: '2px'
                }}>
                  Recent Enquiries
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'var(--font-family-body)',
                  fontWeight: 500
                }}>
                  {recentEnquiries.length} {recentEnquiries.length === 1 ? 'enquiry' : 'enquiries'} received
                </div>
              </div>
            </div>
            <a href="/dashboard/vendor/bookings"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontFamily: 'var(--font-family-body)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-accent)',
                background: 'rgba(245, 166, 35, 0.1)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245, 166, 35, 0.1)'
                e.currentTarget.style.color = 'var(--color-accent)'
              }}
            >
              View All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {recentEnquiries.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.1), rgba(245, 166, 35, 0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(245, 166, 35, 0.2)',
                marginBottom: '8px'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10H16M8 14H13" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ maxWidth: '300px' }}>
                <div style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-family-body)',
                  letterSpacing: '-0.02em'
                }}>
                  No enquiries yet
                </div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-family-body)',
                  marginBottom: '16px'
                }}>
                  Complete your profile and optimize your services to start receiving enquiries from couples looking for vendors like you.
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <a href="/dashboard/vendor/profile"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-family-body)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'var(--color-accent)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 166, 35, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Complete Profile
                  </a>
                  <a href="/dashboard/vendor/services"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-family-body)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-accent)',
                      background: 'rgba(245, 166, 35, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(245, 166, 35, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(245, 166, 35, 0.1)'
                    }}
                  >
                    Add Services
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              {recentEnquiries.map((enq, i) => (
                <div key={enq.id} style={{
                  padding: '20px 24px',
                  borderBottom: i < recentEnquiries.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--gradient-hero), rgba(245, 166, 35, 0.8))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(245, 166, 35, 0.2)',
                    position: 'relative'
                  }}>
                    {(enq.coupleName || 'C')
                      .substring(0,2).toUpperCase()}
                    {enq.status === 'new' && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '2px solid var(--color-card)',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-family-body)',
                        letterSpacing: '-0.01em'
                      }}>
                        {enq.coupleName || 'Couple'}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'var(--font-family-body)',
                        fontWeight: 500
                      }}>
                        {formatDate(enq.createdAt)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1.4,
                      fontFamily: 'var(--font-family-body)',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {enq.message || 'No message provided'}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: enq.status === 'pending'
                          ? 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(245, 166, 35, 0.1))' 
                          : enq.status === 'new'
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                          : 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                        color: enq.status === 'pending'
                          ? 'var(--color-accent)' 
                          : enq.status === 'new'
                          ? '#EF4444'
                          : 'var(--color-success)',
                        border: '1px solid ' + (enq.status === 'pending'
                          ? 'rgba(245, 166, 35, 0.3)' 
                          : enq.status === 'new'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(76, 175, 80, 0.3)'),
                        fontFamily: 'var(--font-family-body)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {enq.status === 'new' && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#EF4444',
                            animation: 'pulse 2s infinite'
                          }} />
                        )}
                        {enq.status || 'pending'}
                      </div>
                      {enq.budget && (
                        <div style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.6)',
                          fontFamily: 'var(--font-family-body)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          ${enq.budget}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'var(--color-card)',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(75, 71, 165, 0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#FFFFFF',
                fontFamily: 'var(--font-family-body)',
                letterSpacing: '-0.03em',
                marginBottom: '4px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Business Profile
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'var(--font-family-body)',
                fontWeight: 600,
                letterSpacing: '0.02em'
              }}>
                Complete business overview & details
              </div>
            </div>
          </div>
          <div style={{ padding: '0 20px' }}>
            {[
              {
                label: 'Category',
                value: vendorProfile?.category || 'Not specified',
                icon: '📋',
                color: '#8B5CF6'
              },
              {
                label: 'Location',
                value: vendorProfile?.location || 'Not specified',
                icon: '📍',
                color: '#F59E0B'
              },
              {
                label: 'Price Range',
                value: vendorProfile?.pricing?.min
                  ? `$${vendorProfile.pricing.min} - $${vendorProfile.pricing.max}` 
                  : 'Not set',
                icon: '💰',
                color: '#10B981'
              },
              {
                label: 'Verification Status',
                value: vendorProfile?.verified 
                  ? '✅ Verified' : '⏳ Pending',
                icon: vendorProfile?.verified ? '✅' : '⏳',
                color: vendorProfile?.verified ? '#10B981' : '#F59E0B'
              },
              {
                label: 'Portfolio',
                value: `${vendorProfile?.portfolioImages?.length || 0} images`,
                icon: '🎨',
                color: '#EF4444'
              },
              {
                label: 'Customer Rating',
                value: stats.avgRating 
                  ? `⭐ ${stats.avgRating} (${stats.reviewCount} reviews)` 
                  : '⭐ No reviews yet',
                icon: '⭐',
                color: '#F59E0B'
              },
            ].map((item, index) => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: index < 5 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.paddingLeft = '8px'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.paddingLeft = '0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    fontSize: 18,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}>
                    {item.icon}
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.9)',
                    fontFamily: 'var(--font-family-body)',
                  }}>
                    {item.label}
                  </div>
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.color,
                  fontFamily: 'var(--font-family-body)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 20px' }}>
            <a
              href="/dashboard/vendor/profile"
              style={{
                display: 'block',
                width: '100%',
                background: 'var(--color-accent)',
                color: '#ffffff',
                padding: '11px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                fontFamily: 'var(--font-family-body)',
              }}
            >
              Edit Profile
            </a>
            
            <a
              href="/dashboard/vendor/analytics"
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                color: 'var(--color-accent)',
                padding: '11px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                border: '1.5px solid var(--color-accent)',
                marginTop: 8,
                fontFamily: 'var(--font-family-body)',
              }}
            >
              View Analytics
            </a>
          </div>
        </div>
      </div>

          </div>
  )
}
