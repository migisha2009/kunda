'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, collection, query, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Plus, X, Edit2, Trash2, Search, Filter, Download, Mail, 
  Phone, Users, Calendar, CheckCircle, XCircle, AlertCircle,
  UserPlus, Send, Copy, CheckSquare, Square
} from 'lucide-react'
import { Wedding, Guest } from '../../../../types'
import { colors } from '../../../../lib/styles'
import AIChat from '../../../../components/AIChat'

const dietaryOptions = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Halal',
  'Kosher',
  'Other'
]

export default function GuestManagement() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<string | null>(null)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'declined'>('all')
  const [filterDietary, setFilterDietary] = useState('all')
  const [filterTable, setFilterTable] = useState('all')
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [bulkInviteEmails, setBulkInviteEmails] = useState('')
  const [selectAll, setSelectAll] = useState(false)
  
  // New guest form
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dietaryPreferences: 'None',
    tableNumber: '',
    plusOne: false,
    plusOneName: '',
    notes: '',
    rsvpStatus: 'pending' as 'pending' | 'declined' | 'attending' | 'maybe'
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const weddingDoc = doc(db, 'weddings', user.uid)
      const weddingSnapshot = await getDoc(weddingDoc)
      if (weddingSnapshot.exists()) {
        setWedding(weddingSnapshot.data() as Wedding)
      }

      // Load guests from Firestore
      const guestsQuery = query(collection(db, 'weddings', user.uid, 'guests'))
      const guestsSnapshot = await getDocs(guestsQuery)
      if (!guestsSnapshot.empty) {
        const guestsData = guestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Guest[]
        // Update wedding with guests
        await updateDoc(weddingDoc, { guests: guestsData })
        setWedding(prev => prev ? { ...prev, guests: guestsData } : null)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = async () => {
    if (!wedding || !newGuest.name.trim()) return
    
    const guestItem: Guest = {
      id: Date.now().toString(),
      weddingId: wedding.id || null,
      coupleId: (user || { uid: '' }).uid,
      name: newGuest.name.trim(),
      email: newGuest.email.trim() || undefined,
      phone: newGuest.phone.trim() || undefined,
      address: newGuest.address.trim() || undefined,
      dietaryPreferences: newGuest.dietaryPreferences,
      tableNumber: newGuest.tableNumber ? parseInt(newGuest.tableNumber) : undefined,
      inviteToken: Math.random().toString(36).substring(7),
      plusOne: newGuest.plusOne,
      plusOneName: newGuest.plusOneName.trim() || undefined,
      notes: newGuest.notes.trim() || undefined,
      rsvpStatus: newGuest.rsvpStatus
    }
    
    try {
      const updatedGuests = [...(wedding.guests || []), guestItem]
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { guests: updatedGuests })
      setWedding({ ...wedding, guests: updatedGuests })
      
      // Also add to guests subcollection
      const guestsRef = collection(db, 'weddings', (user || { uid: '' }).uid, 'guests')
      await addDoc(guestsRef, guestItem)
      
      setNewGuest({
        name: '',
        email: '',
        phone: '',
        address: '',
        dietaryPreferences: 'None',
        tableNumber: '',
        plusOne: false,
        plusOneName: '',
        notes: '',
        rsvpStatus: 'pending'
      })
      setShowAddGuest(false)
    } catch (error) {
      console.error('Error adding guest:', error)
    }
  }

  const handleEditGuest = async (guestId: string, updates: Partial<Guest>) => {
    if (!wedding) return
    
    try {
      const updatedGuests = wedding.guests?.map(item =>
        item.id === guestId ? { ...item, ...updates } : item
      ) || []
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { guests: updatedGuests })
      setWedding({ ...wedding, guests: updatedGuests })
      setEditingGuest(null)
    } catch (error) {
      console.error('Error editing guest:', error)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!wedding) return
    
    if (!confirm('Are you sure you want to delete this guest?')) return
    
    try {
      const updatedGuests = wedding.guests?.filter(item => item.id !== guestId) || []
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { guests: updatedGuests })
      setWedding({ ...wedding, guests: updatedGuests })
      
      // Also delete from guests subcollection
      const guestDoc = doc(db, 'weddings', (user || { uid: '' }).uid, 'guests', guestId)
      await deleteDoc(guestDoc)
    } catch (error) {
      console.error('Error deleting guest:', error)
    }
  }

  const handleToggleSelection = (guestId: string) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map(guest => guest.id))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkInvite = async () => {
    if (!wedding || !bulkInviteEmails.trim()) return
    
    const emails = bulkInviteEmails.split(',').map(email => email.trim()).filter(email => email)
    
    try {
      // Here you would integrate with an email service
      alert(`Invitations sent to ${emails.length} guests!`)
      setBulkInviteEmails('')
      setShowBulkInvite(false)
    } catch (error) {
      console.error('Error sending bulk invites:', error)
      alert('Error sending invitations. Please try again.')
    }
  }

  const handleSendInvite = async (guest: Guest) => {
    if (!guest.email) {
      alert('Guest must have an email address to send invitation.')
      return
    }
    
    try {
      // Here you would integrate with an email service
      alert(`Invitation sent to ${guest.name}!`)
    } catch (error) {
      console.error('Error sending invite:', error)
      alert('Error sending invitation. Please try again.')
    }
  }

  const exportGuests = () => {
    if (!wedding?.guests) return
    
    const csv = 'Name,Email,Phone,Address,Dietary Preferences,Table,RSVP Status,Plus One,Plus One Name,Notes\n' +
      wedding.guests.map(guest => 
        `"${guest.name}","${guest.email || ''}","${guest.phone || ''}","${guest.address || ''}","${guest.dietaryPreferences}","${guest.tableNumber || ''}","${guest.rsvpStatus}","${guest.plusOne}","${guest.plusOneName || ''}","${guest.notes || ''}"`
      ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-guests.csv'
    a.click()
  }

  const getFilteredGuests = () => {
    if (!wedding?.guests) return []
    
    return wedding.guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.phone?.includes(searchTerm)
      const matchesStatus = filterStatus === 'all' || guest.rsvpStatus === filterStatus
      const matchesDietary = filterDietary === 'all' || guest.dietaryPreferences === filterDietary
      const matchesTable = filterTable === 'all' || guest.tableNumber?.toString() === filterTable
      
      return matchesSearch && matchesStatus && matchesDietary && matchesTable
    })
  }

  const getGuestStats = () => {
    if (!wedding?.guests) return { total: 0, confirmed: 0, pending: 0, declined: 0, plusOnes: 0 }
    
    const total = wedding.guests.length
    const confirmed = wedding.guests.filter(g => g.rsvpStatus === 'attending').length
    const pending = wedding.guests.filter(g => g.rsvpStatus === 'pending').length
    const declined = wedding.guests.filter(g => g.rsvpStatus === 'declined').length
    const plusOnes = wedding.guests.filter(g => g.plusOne).length
    
    return { total, confirmed, pending, declined, plusOnes }
  }

  const filteredGuests = getFilteredGuests()
  const stats = getGuestStats()

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: colors.bg, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${colors.border}`,
          borderBottom: `3px solid ${colors.primary}`,
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
      backgroundColor: '#f0f4ff', 
      color: '#111928', 
      minHeight: '100vh', 
      fontFamily: 'Urbanist, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5edff',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Urbanist',
              fontSize: '36px',
              fontWeight: 800,
              color: '#0f2460',
              marginBottom: '8px'
            }}>Guest Management</h1>
            <p style={{
              fontFamily: 'Urbanist',
              fontSize: '15px',
              color: '#6b7280',
              fontWeight: 400
            }}>
              Manage your wedding guest list and RSVPs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportGuests}
              style={{
                border: '1.5px solid #1a56db',
                color: '#1a56db',
                padding: '12px 24px',
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px'
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => setShowBulkInvite(true)}
              style={{
                border: '1.5px solid #1a56db',
                color: '#1a56db',
                padding: '12px 24px',
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px'
              }}
            >
              <Send size={16} />
              Bulk Invite
            </button>
            <button
              onClick={() => setShowAddGuest(true)}
              style={{
                backgroundColor: '#1a56db',
                color: '#ffffff',
                padding: '12px 24px',
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(26,86,219,0.3)'
              }}
            >
              <Plus size={16} />
              Add Guest
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.total}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Total Guests</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.confirmed}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Confirmed</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.pending}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Pending</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.declined}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Declined</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f2460'
            }}>{stats.plusOnes}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Plus Ones
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Progress Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5edff',
        padding: '24px 32px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{
                fontFamily: 'Urbanist',
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f2460',
                marginBottom: '4px'
              }}>
                {stats.confirmed} of {stats.total} guests confirmed
              </h3>
              <p style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: 400
              }}>
                Track your RSVP progress
              </p>
            </div>
            <div style={{
              fontFamily: 'Urbanist',
              fontSize: '24px',
              fontWeight: 800,
              color: '#1a56db'
            }}>
              {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e5edff',
            borderRadius: '50px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#1a56db',
              borderRadius: '50px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>

          {/* RSVP Status Pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#d1fae5',
              borderRadius: '20px',
              border: '1px solid #10b981'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 600,
                color: '#047857'
              }}>Confirmed ({stats.confirmed})</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#fef3c7',
              borderRadius: '20px',
              border: '1px solid #f59e0b'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#f59e0b',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 600,
                color: '#d97706'
              }}>Pending ({stats.pending})</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#fee2e2',
              borderRadius: '20px',
              border: '1px solid #ef4444'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 600,
                color: '#dc2626'
              }}>Declined ({stats.declined})</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#dbeafe',
              borderRadius: '20px',
              border: '1px solid #3b82f6'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1d4ed8'
              }}>Maybe ({wedding?.guests?.filter(g => g.rsvpStatus === 'maybe').length || 0})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: colors.bgCard,
        borderBottom: `0.5px solid ${colors.border}`,
        padding: '16px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={20} color={colors.textSecondary} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search guests by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: `1px solid ${colors.border}`,
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: '12px',
                border: `1px solid ${colors.border}`,
                fontFamily: 'Urbanist',
                fontSize: '14px',
                backgroundColor: colors.bgCard,
                color: colors.textPrimary
              }}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
            </select>

            <select
              value={filterDietary}
              onChange={(e) => setFilterDietary(e.target.value)}
              style={{
                padding: '12px',
                border: `1px solid ${colors.border}`,
                fontFamily: 'Urbanist',
                fontSize: '14px',
                backgroundColor: colors.bgCard,
                color: colors.textPrimary
              }}
            >
              <option value="all">All Dietary</option>
              {dietaryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              style={{
                padding: '12px',
                border: `1px solid ${colors.border}`,
                fontFamily: 'Urbanist',
                fontSize: '14px',
                backgroundColor: colors.bgCard,
                color: colors.textPrimary
              }}
            >
              <option value="all">All Tables</option>
              <option value="1">Table 1</option>
              <option value="2">Table 2</option>
              <option value="3">Table 3</option>
              <option value="4">Table 4</option>
              <option value="5">Table 5</option>
            </select>
          </div>

          {selectedGuests.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                {selectedGuests.length} selected
              </span>
              <button
                onClick={() => {
                  if (confirm(`Send invitations to ${selectedGuests.length} selected guests?`)) {
                    selectedGuests.forEach(guestId => {
                      const guest = filteredGuests.find(g => g.id === guestId)
                      if (guest) handleSendInvite(guest)
                    })
                    setSelectedGuests([])
                  }
                }}
                style={{
                  backgroundColor: colors.primaryDark,
                  color: colors.bg,
                  padding: '8px 16px',
                  fontFamily: 'Urbanist',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Send Invites
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guests Table */}
      <div style={{ padding: '32px' }}>
        {filteredGuests.length === 0 ? (
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              color: colors.textSecondary,
              marginBottom: '16px'
            }}> <Users size={48} /> </div>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '20px',
              color: colors.textPrimary,
              marginBottom: '8px'
            }}>No guests found</h3>
            <p style={{
              fontFamily: 'Urbanist',
              fontSize: '14px',
              color: colors.textSecondary
            }}>
              {searchTerm || filterStatus !== 'all' || filterDietary !== 'all' || filterTable !== 'all'
                ? 'Try adjusting your filters or add your first guest.'
                : 'Add your first guest to start building your wedding guest list.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              backgroundColor: colors.bg,
              padding: '16px',
              borderBottom: `0.5px solid ${colors.border}`,
              display: 'grid',
              gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr 120px',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Name</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Email</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Phone</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Dietary</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Table</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Status</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: colors.textSecondary
              }}>Actions</div>
            </div>

            {/* Guest Rows */}
            {filteredGuests.map((guest) => {
              const isEditing = editingGuest === guest.id
              
              return (
                <div key={guest.id} style={{
                  padding: '16px',
                  borderBottom: `0.5px solid ${colors.border}`,
                  display: 'grid',
                  gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr 120px',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedGuests.includes(guest.id)}
                      onChange={() => handleToggleSelection(guest.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        defaultValue={guest.name}
                        onBlur={(e) => handleEditGuest(guest.id, { name: e.target.value })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      />
                      <input
                        type="email"
                        defaultValue={guest.email || ''}
                        onBlur={(e) => handleEditGuest(guest.id, { email: e.target.value })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      />
                      <input
                        type="tel"
                        defaultValue={guest.phone || ''}
                        onBlur={(e) => handleEditGuest(guest.id, { phone: e.target.value })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      />
                      <select
                        defaultValue={guest.dietaryPreferences}
                        onChange={(e) => handleEditGuest(guest.id, { dietaryPreferences: e.target.value })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      >
                        {dietaryOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        defaultValue={guest.tableNumber || ''}
                        onBlur={(e) => handleEditGuest(guest.id, { tableNumber: parseInt(e.target.value) || undefined })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      />
                      <select
                        defaultValue={guest.rsvpStatus}
                        onChange={(e) => handleEditGuest(guest.id, { rsvpStatus: e.target.value as any })}
                        style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                      </select>
                      <button
                        onClick={() => setEditingGuest(null)}
                        style={{
                          backgroundColor: colors.primaryDark,
                          color: colors.bg,
                          padding: '6px 12px',
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: colors.textPrimary,
                          marginBottom: '4px'
                        }}>{guest.name}</div>
                        {guest.plusOne && guest.plusOneName && (
                          <div style={{
                            fontSize: '11px',
                            color: colors.textSecondary,
                            fontStyle: 'italic'
                          }}>+1 {guest.plusOneName}</div>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary
                      }}>{guest.email || '-'}</div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary
                      }}>{guest.phone || '-'}</div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary
                      }}>{guest.dietaryPreferences}</div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary
                      }}>{guest.tableNumber || '-'}</div>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {guest.rsvpStatus === 'attending' && (
                            <CheckCircle size={16} color={colors.success} />
                          )}
                          {guest.rsvpStatus === 'pending' && (
                            <AlertCircle size={16} color={colors.warning} />
                          )}
                          {guest.rsvpStatus === 'declined' && (
                            <XCircle size={16} color={colors.danger} />
                          )}
                          <span style={{
                            fontSize: '12px',
                            color: guest.rsvpStatus === 'attending' ? colors.success : 
                                   guest.rsvpStatus === 'pending' ? colors.warning : colors.danger,
                            fontWeight: 500
                          }}>
                            {guest.rsvpStatus}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (guest.email) {
                              navigator.clipboard.writeText(guest.email)
                              alert('Email copied to clipboard!')
                            }
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Copy email"
                        >
                          <Copy size={14} color={colors.textSecondary} />
                        </button>
                        <button
                          onClick={() => handleSendInvite(guest)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Send invitation"
                        >
                          <Mail size={14} color={colors.textSecondary} />
                        </button>
                        <button
                          onClick={() => setEditingGuest(guest.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Edit guest"
                        >
                          <Edit2 size={14} color={colors.textSecondary} />
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Delete guest"
                        >
                          <Trash2 size={14} color={colors.textSecondary} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '24px',
            width: '90%',
            maxWidth: '600px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Urbanist',
                fontSize: '20px',
                color: colors.textPrimary
              }}>Add New Guest</h2>
              <button
                onClick={() => setShowAddGuest(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Guest Name *"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
                <input
                  type="text"
                  placeholder="Table Number"
                  value={newGuest.tableNumber}
                  onChange={(e) => setNewGuest({ ...newGuest, tableNumber: e.target.value })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                value={newGuest.address}
                onChange={(e) => setNewGuest({ ...newGuest, address: e.target.value })}
                style={{
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={newGuest.dietaryPreferences}
                  onChange={(e) => setNewGuest({ ...newGuest, dietaryPreferences: e.target.value })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                >
                  {dietaryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select
                  value={newGuest.rsvpStatus}
                  onChange={(e) => setNewGuest({ ...newGuest, rsvpStatus: e.target.value as any })}
                  style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Urbanist', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newGuest.plusOne}
                    onChange={(e) => setNewGuest({ ...newGuest, plusOne: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Plus One
                </label>

                {newGuest.plusOne && (
                  <input
                    type="text"
                    placeholder="Plus One Name"
                    value={newGuest.plusOneName}
                    onChange={(e) => setNewGuest({ ...newGuest, plusOneName: e.target.value })}
                    style={{
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      fontFamily: 'Urbanist',
                      fontSize: '14px',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      flex: 1
                    }}
                  />
                )}
              </div>

              <textarea
                placeholder="Notes (optional)"
                value={newGuest.notes}
                onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                rows={3}
                style={{
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddGuest(false)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    color: colors.primary,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGuest}
                  disabled={!newGuest.name.trim()}
                  style={{
                    backgroundColor: colors.primaryDark,
                    color: colors.bg,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: !newGuest.name.trim() ? 'not-allowed' : 'pointer',
                    opacity: !newGuest.name.trim() ? 0.7 : 1
                  }}
                >
                  Add Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkInvite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Urbanist',
                fontSize: '20px',
                color: colors.textPrimary
              }}>Send Bulk Invitations</h2>
              <button
                onClick={() => setShowBulkInvite(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Urbanist',
                  fontSize: '12px',
                  color: colors.textSecondary,
                  marginBottom: '4px'
                }}>
                  Email Addresses (comma separated)
                </label>
                <textarea
                  placeholder="guest1@example.com, guest2@example.com, guest3@example.com"
                  value={bulkInviteEmails}
                  onChange={(e) => setBulkInviteEmails(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowBulkInvite(false)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    color: colors.primary,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkInvite}
                  disabled={!bulkInviteEmails.trim()}
                  style={{
                    backgroundColor: colors.primaryDark,
                    color: colors.bg,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: !bulkInviteEmails.trim() ? 'not-allowed' : 'pointer',
                    opacity: !bulkInviteEmails.trim() ? 0.7 : 1
                  }}
                >
                  Send Invites
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AIChat />
      {dashFooter}
    </div>
  )
}
