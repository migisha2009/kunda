'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, 
  onSnapshot, orderBy, limit } from 'firebase/firestore'

export default function NotificationBell() {
  const { user, role } = useAuth()
  const [notifications, setNotifications] = 
    useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    
    let q
    if (role === 'vendor') {
      q = query(
        collection(db, 'enquiries'),
        where('vendorId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    } else if (role === 'couple') {
      q = query(
        collection(db, 'bookings'),
        where('coupleId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    } else return

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNotifications(items)
      setUnread(items.length)
    })

    return () => unsub()
  }, [user, role])

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: open ? '#ebf5ff' : 'transparent',
          border: '1px solid #e5edff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        0d4d
        {unread > 0 && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            background: '#c81e1e',
            borderRadius: '50%',
            fontSize: 10,
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease infinite',
            fontFamily: 'Urbanist, sans-serif',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 48,
          right: 0,
          width: 320,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5edff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          zIndex: 100,
          animation: 'fadeInUp 0.2s ease',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f0f4ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#111928',
              fontFamily: 'Urbanist, sans-serif',
            }}>
              Notifications
            </span>
            {unread > 0 && (
              <span style={{
                background: '#ebf5ff',
                color: '#1a56db',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 50,
                fontFamily: 'Urbanist, sans-serif',
              }}>
                {unread} new
              </span>
            )}
          </div>
          
          <div style={{ 
            maxHeight: 300, 
            overflowY: 'auto' 
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 14,
                fontFamily: 'Urbanist, sans-serif',
              }}>
                No new notifications
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div key={notif.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f4ff',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#ebf5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {role === 'vendor' ? '0d4d' : '0d4d'}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#111928',
                      marginBottom: 2,
                      fontFamily: 'Urbanist, sans-serif',
                    }}>
                      {role === 'vendor' 
                        ? 'New enquiry received'
                        : 'Booking update'
                      }
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#6b7280',
                      fontFamily: 'Urbanist, sans-serif',
                    }}>
                      {notif.message?.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f4ff',
          }}>
            <a 
              href={role === 'vendor' 
                ? '/dashboard/vendor/bookings'
                : '/dashboard/couple/bookings'
              }
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#1a56db',
                textDecoration: 'none',
                fontFamily: 'Urbanist, sans-serif',
              }}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
