'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { db } from '../../../lib/firebase'
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { Search, Users, Calendar, DollarSign, CheckSquare, Plus, LogOut, MapPin, Clock } from 'lucide-react'

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

// Types
interface Wedding {
  id: string
  coupleName1: string
  coupleName2: string
  date: string
  venue: string
  guestCount: number
  budget: {
    total: number
    spent: number
    currency: string
  }
  checklist: Array<{
    id: string
    task: string
    done: boolean
  }>
}

interface Booking {
  id: string
  status: string
  amount: number
  createdAt: Date
}

export default function CoupleDashboard() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user, userProfile, signOutUser } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [saving, setSaving] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  
  // Onboarding form state
  const [onboarding, setOnboarding] = useState({
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    guestCount: '',
    totalBudget: '',
    currency: 'RWF'
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (wedding?.date) {
      const interval = setInterval(() => {
        updateCountdown()
      }, 1000)
      updateCountdown()
      return () => clearInterval(interval)
    }
  }, [wedding])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load wedding data
      const weddingDoc = await doc(db, 'weddings', user.uid)
      const weddingSnapshot = await getDoc(weddingDoc)
      if (weddingSnapshot.exists()) {
        setWedding(weddingSnapshot.data() as Wedding)
      }

      // Load bookings
      const bookingsQuery = query(collection(db, 'bookings'), where('coupleId', '==', user.uid))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[]
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCountdown = () => {
    if (!wedding?.date) return
    
    const now = new Date().getTime()
    const weddingTime = new Date(wedding.date).getTime()
    const difference = weddingTime - now

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((difference % (1000 * 60)) / 1000)
      
      setCountdown({ days, hours, mins, secs })
    } else {
      setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 })
    }
  }

  const createWedding = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const weddingData = {
        coupleName1: onboarding.coupleName1,
        coupleName2: onboarding.coupleName2,
        date: onboarding.date,
        venue: onboarding.venue,
        guestCount: parseInt(onboarding.guestCount),
        budget: {
          total: parseFloat(onboarding.totalBudget),
          spent: 0,
          currency: onboarding.currency
        },
        checklist: []
      }
      
      await setDoc(doc(db, 'weddings', user.uid), weddingData)
      window.location.reload()
    } catch (error) {
      console.error('Error creating wedding:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    if (!wedding) return
    
    const updatedChecklist = wedding.checklist.map(item =>
      item.id === taskId ? { ...item, done: !item.done } : item
    )
    
    try {
      await updateDoc(doc(db, 'weddings', wedding.id), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const handleAddTask = async () => {
    if (!wedding || !newTask.trim()) return
    
    setSaving(true)
    const newTaskItem = {
      id: Date.now().toString(),
      task: newTask.trim(),
      done: false
    }
    
    try {
      const updatedChecklist = [...wedding.checklist, newTaskItem]
      await updateDoc(doc(db, 'weddings', wedding.id), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setSaving(false)
    }
  }

  const calculateDaysUntilWedding = () => {
    if (!wedding?.date) return 0
    const today = new Date()
    const weddingDate = new Date(wedding.date)
    const diffTime = weddingDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateBudgetUsed = () => {
    if (!wedding) return 0
    const spent = wedding.budget.spent
    const total = wedding.budget.total
    return total > 0 ? Math.round((spent / total) * 100) : 0
  }

  const daysUntilWedding = calculateDaysUntilWedding()
  const budgetUsed = calculateBudgetUsed()
  const vendorsBooked = bookings.length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: cream, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f0e4d0',
          borderTop: `3px solid ${gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;ital&family=Jost:wght@300;400;500&display=swap" 
        rel="stylesheet" 
      />
      
      {/* TOP NAVBAR */}
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            border: `1.5px solid ${gold}`,
            borderRadius: '50%'
          }}></div>
          <span style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: goldDark,
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="/" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: goldDark,
            textDecoration: 'none'
          }}>Overview</a>
          <a href="/vendors" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: muted,
            textDecoration: 'none'
          }}>Vendors</a>
          <a href="/dashboard/couple/guests" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: muted,
            textDecoration: 'none'
          }}>Guests</a>
          <a href="/dashboard/couple/bookings" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: muted,
            textDecoration: 'none'
          }}>Bookings</a>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `1px solid ${gold}`,
            backgroundColor: cream,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Jost',
            fontSize: '13px',
            color: goldDark
          }}>
            {userProfile?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: brown
          }}>{userProfile?.name}</span>
          <button
            onClick={() => {
              window.location.href = '/login'
            }}
            style={{
              border: `0.5px solid ${gold}`,
              color: gold,
              padding: '6px 14px',
              fontFamily: 'Jost',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={{ padding: '32px', backgroundColor: cream }}>
        {wedding ? (
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: gold,
              marginBottom: '8px'
            }}>Wedding Dashboard</div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '36px',
              fontWeight: 300,
              color: brown,
              marginBottom: '8px'
            }}>{wedding.coupleName1} & {wedding.coupleName2}</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '13px',
              color: muted
            }}>{wedding.venue}  {formatDate(wedding.date)}</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '32px',
            maxWidth: '600px'
          }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: brown,
              marginBottom: '24px',
              textAlign: 'center'
            }}>Set Up Your Wedding</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Your name"
                value={onboarding.coupleName1}
                onChange={(e) => setOnboarding({...onboarding, coupleName1: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Partner's name"
                value={onboarding.coupleName2}
                onChange={(e) => setOnboarding({...onboarding, coupleName2: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <input
                type="date"
                value={onboarding.date}
                onChange={(e) => setOnboarding({...onboarding, date: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Venue"
                value={onboarding.venue}
                onChange={(e) => setOnboarding({...onboarding, venue: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <input
                type="number"
                placeholder="Guest count"
                value={onboarding.guestCount}
                onChange={(e) => setOnboarding({...onboarding, guestCount: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <input
                type="number"
                placeholder="Total budget"
                value={onboarding.totalBudget}
                onChange={(e) => setOnboarding({...onboarding, totalBudget: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              />
              <select
                value={onboarding.currency}
                onChange={(e) => setOnboarding({...onboarding, currency: e.target.value})}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px'
                }}
              >
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <button
                onClick={createWedding}
                disabled={saving}
                style={{
                  backgroundColor: goldDark,
                  color: cream,
                  padding: '12px 28px',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {wedding && (
        <>
          {/* STATS ROW */}
          <div style={{ 
            padding: '0 32px 32px', 
            backgroundColor: cream,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            {/* Card 1 - Days Until Wedding */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '16px 18px'
            }}>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted,
                marginBottom: '8px'
              }}>Days Until Wedding</div>
              <div style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: brown
              }}>{daysUntilWedding}</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                color: muted,
                marginTop: '4px'
              }}>{formatDate(wedding.date)}</div>
            </div>

            {/* Card 2 - Guest Count */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '16px 18px'
            }}>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted,
                marginBottom: '8px'
              }}>Guest Count</div>
              <div style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: brown
              }}>{wedding.guestCount}</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                color: muted,
                marginTop: '4px'
              }}>guests invited</div>
            </div>

            {/* Card 3 - Budget Used */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '16px 18px'
            }}>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted,
                marginBottom: '8px'
              }}>Budget Used</div>
              <div style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: brown
              }}>{budgetUsed}%</div>
              <div style={{
                width: '100%',
                height: '5px',
                backgroundColor: '#f0e4d0',
                marginTop: '8px',
                borderRadius: '2px'
              }}>
                <div style={{
                  width: `${budgetUsed}%`,
                  height: '100%',
                  backgroundColor: gold,
                  borderRadius: '2px'
                }}></div>
              </div>
            </div>

            {/* Card 4 - Vendors Booked */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '16px 18px'
            }}>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted,
                marginBottom: '8px'
              }}>Vendors Booked</div>
              <div style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: brown
              }}>{vendorsBooked}</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                color: muted,
                marginTop: '4px'
              }}>of 8 planned</div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            gap: '16px',
            padding: '0 32px 32px',
            backgroundColor: cream
          }}>
            {/* LEFT COLUMN - Checklist Card */}
            <div style={{
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '20px'
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '18px',
                color: brown,
                borderBottom: '0.5px solid rgba(180,140,90,0.15)',
                paddingBottom: '12px',
                marginBottom: '16px'
              }}>Wedding Checklist</h2>
              
              {/* Checklist items */}
              <div style={{ marginBottom: '16px' }}>
                {wedding.checklist.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div
                      onClick={() => handleToggleTask(item.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        border: item.done ? 'none' : `0.5px solid ${gold}`,
                        backgroundColor: item.done ? gold : 'transparent',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.done && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'white',
                          clipPath: 'polygon(0% 50%, 30% 80%, 100% 10%, 80% 0%, 30% 60%)'
                        }}></div>
                      )}
                    </div>
                    <span style={{
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      color: item.done ? '#b4a090' : brown,
                      textDecoration: item.done ? 'line-through' : 'none'
                    }}>{item.task}</span>
                  </div>
                ))}
              </div>

              {/* Add new task */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add new task..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    backgroundColor: cream,
                    fontFamily: 'Jost',
                    fontSize: '12px'
                  }}
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.trim() || saving}
                  style={{
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '8px 16px',
                    fontFamily: 'Jost',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: (!newTask.trim() || saving) ? 'not-allowed' : 'pointer',
                    opacity: (!newTask.trim() || saving) ? 0.7 : 1
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN - Two stacked cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card 1 - Countdown */}
              <div style={{
                backgroundColor: 'white',
                border: '0.5px solid rgba(180,140,90,0.2)',
                padding: '20px'
              }}>
                <h3 style={{
                  fontFamily: 'Cormorant Garamond',
                  fontSize: '16px',
                  color: brown,
                  marginBottom: '16px'
                }}>Countdown to Your Day</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div style={{
                    backgroundColor: cream,
                    border: '0.5px solid rgba(180,140,90,0.2)',
                    padding: '12px 8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Cormorant Garamond',
                      fontSize: '28px',
                      color: goldDark
                    }}>{countdown.days}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: muted,
                      marginTop: '4px'
                    }}>Days</div>
                  </div>
                  <div style={{
                    backgroundColor: cream,
                    border: '0.5px solid rgba(180,140,90,0.2)',
                    padding: '12px 8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Cormorant Garamond',
                      fontSize: '28px',
                      color: goldDark
                    }}>{countdown.hours}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: muted,
                      marginTop: '4px'
                    }}>Hours</div>
                  </div>
                  <div style={{
                    backgroundColor: cream,
                    border: '0.5px solid rgba(180,140,90,0.2)',
                    padding: '12px 8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Cormorant Garamond',
                      fontSize: '28px',
                      color: goldDark
                    }}>{countdown.mins}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: muted,
                      marginTop: '4px'
                    }}>Mins</div>
                  </div>
                  <div style={{
                    backgroundColor: cream,
                    border: '0.5px solid rgba(180,140,90,0.2)',
                    padding: '12px 8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Cormorant Garamond',
                      fontSize: '28px',
                      color: goldDark
                    }}>{countdown.secs}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: muted,
                      marginTop: '4px'
                    }}>Secs</div>
                  </div>
                </div>
              </div>

              {/* Card 2 - Quick Actions */}
              <div style={{
                backgroundColor: 'white',
                border: '0.5px solid rgba(180,140,90,0.2)',
                padding: '20px'
              }}>
                <h3 style={{
                  fontFamily: 'Cormorant Garamond',
                  fontSize: '16px',
                  color: brown,
                  marginBottom: '16px'
                }}>Quick Actions</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div
                    onClick={() => window.location.href = '/vendors'}
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ede0'
                      e.currentTarget.style.borderColor = gold
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(180,140,90,0.3)'
                    }}
                  >
                    <Search size={24} color={goldDark} style={{ margin: '0 auto' }} />
                    <div style={{
                      fontFamily: 'Jost',
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: goldDark,
                      marginTop: '8px'
                    }}>Browse Vendors</div>
                  </div>
                  
                  <div
                    onClick={() => window.location.href = '/dashboard/couple/guests'}
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ede0'
                      e.currentTarget.style.borderColor = gold
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(180,140,90,0.3)'
                    }}
                  >
                    <Users size={24} color={goldDark} style={{ margin: '0 auto' }} />
                    <div style={{
                      fontFamily: 'Jost',
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: goldDark,
                      marginTop: '8px'
                    }}>Manage Guests</div>
                  </div>
                  
                  <div
                    onClick={() => window.location.href = '/dashboard/couple/bookings'}
                    style={{
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ede0'
                      e.currentTarget.style.borderColor = gold
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(180,140,90,0.3)'
                    }}
                  >
                    <Calendar size={24} color={goldDark} style={{ margin: '0 auto' }} />
                    <div style={{
                      fontFamily: 'Jost',
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      color: goldDark,
                      marginTop: '8px'
                    }}>My Bookings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
