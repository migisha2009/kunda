'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  
  const isDashboard = pathname?.startsWith('/dashboard')
  const isGuest = pathname?.startsWith('/guest')
  
  if (isDashboard) return <DashboardFooter />
  return <PublicFooter />
}

function PublicFooter() {
  return (
    <footer style={{
      background: '#1e3a8a',
      padding: '48px 64px 24px',
      fontFamily: 'Urbanist, sans-serif',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: 40,
        marginBottom: 40,
      }}>
        
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{
              width: 36,
              height: 36,
              background: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#ffffff',
            }}>
              Kunda
            </span>
          </div>
          <p style={{
            fontSize: 14,
            color: '#ffffff',
            lineHeight: 1.7,
            marginBottom: 16,
            maxWidth: 280,
          }}>
            Your perfect wedding, beautifully orchestrated. Rwanda's premier wedding planning platform.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{
              width: 36, height: 36,
              background: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 16,
          }}>
            For Couples
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {[
              ['Find Vendors', '/vendors'],
              ['How It Works', '/how-it-works'],
              ['Pricing', '/pricing'],
              ['Success Stories', '/success-stories'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontSize: 14,
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 16,
          }}>
            For Vendors
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {[
              ['Join Kunda', '/signup/vendor'],
              ['Vendor Dashboard', '/dashboard/vendor'],
              ['Vendor Resources', '/vendor-resources'],
              ['Pricing Plans', '/vendor-pricing'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontSize: 14,
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 16,
          }}>
            Company
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {[
              ['About Us', '/about'],
              ['Contact', '/contact'],
              ['Privacy Policy', '/privacy'],
              ['Terms of Service', '/terms'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontSize: 14,
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#ffffff' }}>
          © 2024 Kunda. All rights reserved.
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          color: '#ffffff',
        }}>
          Made with <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg> in 
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg> Kigali, Rwanda
          </span>
        </div>
      </div>
    </footer>
  )
}

function DashboardFooter() {
  return (
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
      <div style={{
        fontSize: 13,
        color: '#9ca3af',
      }}>
        © 2026 Kunda Wedding Platform · 
        Kigali, Rwanda
      </div>
      <div style={{
        display: 'flex',
        gap: 20,
        alignItems: 'center',
      }}>
        <a 
          href="https://wa.me/250783312746"
          target="_blank"
          style={{
            fontSize: 13,
            color: '#6b7280',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          0d4d WhatsApp Support
        </a>
        <a 
          href="https://instagram.com/darkxente"
          target="_blank"
          style={{
            fontSize: 13,
            color: '#6b7280',
            textDecoration: 'none',
          }}
        >
          0d4d @darkxente
        </a>
        <div style={{
          fontSize: 13,
          color: '#9ca3af',
        }}>
          Made with 0d4d in Rwanda
        </div>
      </div>
    </footer>
  )
}
