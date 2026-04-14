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
        padding: '0 32px',
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

        <div style={{
          display: 'flex',
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

      <div style={{
        background: 'var(--gradient-hero)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
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
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 8,
            fontFamily: 'var(--font-family-body)',
          }}>
            Vendor Dashboard
          </div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 6,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-family-heading)',
          }}>
            {name}
          </h1>
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-family-body)',
          }}>
            {vendorProfile?.category || 'Wedding Vendor'}
            {vendorProfile?.location && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                {vendorProfile.location}
              </>
            )}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          zIndex: 1,
          alignItems: 'center',
        }}>
          {vendorProfile?.verified ? (
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              color: 'var(--color-success)',
              padding: '6px 14px',
              borderRadius: 50,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-family-body)',
            }}>
              Verified
            </div>
          ) : (
            <div style={{
              background: 'rgba(245, 166, 35, 0.2)',
              color: 'var(--color-accent)',
              padding: '6px 14px',
              borderRadius: 50,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-family-body)',
            }}>
              Unverified
            </div>
          )}
          
          <a
            href="/dashboard/vendor/profile"
            style={{
              background: '#ffffff',
              color: 'var(--color-accent)',
              padding: '9px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'var(--font-family-body)',
            }}
          >
            Edit Profile
          </a>
          
          <a
            href="/dashboard/vendor/bookings"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-family-body)',
            }}
          >
            My Bookings
          </a>
        </div>
      </div>

      {stats.profileCompletion < 100 && (
        <div style={{
          margin: '16px 24px 0',
          background: 'var(--color-card)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-accent)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
        }}
          onClick={() => window.location.href = 
            '/dashboard/vendor/profile'}
        >
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 3,
              fontFamily: 'var(--font-family-body)',
            }}>
              Profile Completion
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#FFFFFF',
              fontFamily: 'var(--font-family-body)',
            }}>
              Complete your profile to attract 
              more couples and get verified
            </div>
          </div>
          <div style={{
            flex: 1,
            height: 6,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${stats.profileCompletion}%`,
              background: 'var(--color-accent)',
              borderRadius: 3,
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--color-accent)',
            minWidth: 52,
            textAlign: 'right',
            fontFamily: 'var(--font-family-body)',
          }}>
            {stats.profileCompletion}%
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: 16,
        padding: '20px 24px',
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
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: card.bg === '#ebf5ff' ? 'rgba(245, 166, 35, 0.2)' :
                       card.bg === '#ede9fe' ? 'rgba(245, 166, 35, 0.2)' :
                       card.bg === '#def7ec' ? 'rgba(76, 175, 80, 0.2)' :
                       card.bg === '#fff7ed' ? 'rgba(245, 166, 35, 0.2)' : 'rgba(245, 166, 35, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              marginBottom: 12,
            }}>
              {card.icon}
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 4,
              fontFamily: 'var(--font-family-body)',
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 4,
              fontFamily: 'var(--font-family-body)',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: card.color === '#1a56db' ? 'var(--color-accent)' : 
                     card.color === '#7c3aed' ? 'var(--color-accent)' :
                     card.color === '#057a55' ? 'var(--color-success)' :
                     card.color === '#c2410c' ? 'var(--color-accent)' : 'var(--color-accent)',
              fontFamily: 'var(--font-family-body)',
            }}>
              {card.hint}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
        gap: 16,
        padding: '0 24px 24px',
        flex: 1,
      }}>

        <div style={{
          background: 'var(--color-card)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-family-body)',
            }}>
              Recent Enquiries
            </div>
            <a href="/dashboard/vendor/bookings"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontFamily: 'var(--font-family-body)',
              }}>
              View All 
            </a>
          </div>

          {recentEnquiries.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 48,
                marginBottom: 12,
              }}> </div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 6,
                fontFamily: 'var(--font-family-body)',
              }}>
                No enquiries yet
              </div>
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'var(--font-family-body)',
              }}>
                Complete your profile to start 
                receiving enquiries from couples
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              {recentEnquiries.map((enq, i) => (
                <div key={enq.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => 
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => 
                    (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'var(--gradient-hero)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {(enq.coupleName || 'C')
                      .substring(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      marginBottom: 3,
                      fontFamily: 'var(--font-family-body)',
                    }}>
                      {enq.coupleName || 'Couple'}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.8)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'var(--font-family-body)',
                    }}>
                      {enq.message?.substring(0,65)}...
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 6,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: 'var(--font-family-body)',
                    }}>
                      {formatDate(enq.createdAt)}
                    </div>
                    <div style={{
                      padding: '3px 10px',
                      borderRadius: 50,
                      fontSize: 11,
                      fontWeight: 700,
                      background: enq.status === 'pending'
                        ? 'rgba(245, 166, 35, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                      color: enq.status === 'pending'
                        ? 'var(--color-accent)' : 'var(--color-success)',
                      fontFamily: 'var(--font-family-body)',
                    }}>
                      {enq.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'var(--color-card)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-family-body)',
            }}>
              Business Profile
            </div>
          </div>
          <div style={{ padding: '0 20px' }}>
            {[
              ['Category', vendorProfile?.category || ' '],
              ['Location', vendorProfile?.location || ' '],
              ['Price Range', vendorProfile?.pricing?.min
                ? `$${vendorProfile.pricing.min} - $${vendorProfile.pricing.max}` 
                : ' '],
              ['Status', vendorProfile?.verified 
                ? ' Verified' : ' Unverified'],
              ['Portfolio', `${vendorProfile?.portfolioImages?.length || 0} images`],
              ['Rating', stats.avgRating 
                ? `${stats.avgRating} (${stats.reviewCount} reviews)` 
                : 'No reviews yet'],
            ].map(([key, val]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'var(--font-family-body)',
                }}>
                  {key}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-family-body)',
                }}>
                  {val}
                </span>
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

      <footer style={{
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--font-family-body)',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
          © 2026 Kunda Wedding Platform · Kigali, Rwanda
        </div>
        <div style={{
          display: 'flex', gap: 20, alignItems: 'center'
        }}>
          <a href="https://wa.me/250783312746"
            target="_blank"
            style={{
              fontSize: 13, color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontFamily: 'var(--font-family-body)'
            }}>
            WhatsApp Support
          </a>
          <a href="https://instagram.com/darkxente"
            target="_blank"
            style={{
              fontSize: 13, color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontFamily: 'var(--font-family-body)'
            }}>
            @darkxente
          </a>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-family-body)' }}>
            Made with in Rwanda
          </span>
        </div>
      </footer>
    </div>
  )
}
