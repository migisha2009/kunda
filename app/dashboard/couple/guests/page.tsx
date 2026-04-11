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

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

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
      await updateDoc(doc(db, 'weddings', user!.uid), { guests: updatedGuests })
      setWedding({ ...wedding, guests: updatedGuests })
      
      // Also add to guests subcollection
      const guestsRef = collection(db, 'weddings', user!.uid, 'guests')
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
      
      await updateDoc(doc(db, 'weddings', user!.uid), { guests: updatedGuests })
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
      await updateDoc(doc(db, 'weddings', user!.uid), { guests: updatedGuests })
      setWedding({ ...wedding, guests: updatedGuests })
      
      // Also delete from guests subcollection
      const guestDoc = doc(db, 'weddings', user!.uid, 'guests', guestId)
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
    const confirmed = wedding.guests.filter(g => g.rsvpStatus === 'confirmed').length
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
    <div style={{ backgroundColor: cream, color: brown, minHeight: '100vh' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;ital&family=Jost:wght@300;400;500&display=swap" 
        rel="stylesheet" 
      />

      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '32px',
              fontWeight: 300,
              color: brown,
              marginBottom: '8px'
            }}>Guest Management</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Manage your wedding guest list and RSVPs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportGuests}
              style={{
                border: `0.5px solid ${gold}`,
                color: gold,
                padding: '8px 16px',
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => setShowBulkInvite(true)}
              style={{
                border: `0.5px solid ${gold}`,
                color: gold,
                padding: '8px 16px',
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={16} />
              Bulk Invite
            </button>
            <button
              onClick={() => setShowAddGuest(true)}
              style={{
                backgroundColor: goldDark,
                color: cream,
                padding: '8px 16px',
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
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
            backgroundColor: cream,
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: brown
            }}>{stats.total}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: muted,
              marginTop: '4px'
            }}>Total Guests</div>
          </div>
          <div style={{
            backgroundColor: '#dcfce7',
            border: '0.5px solid rgba(34, 197, 94, 0.2)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: '#16a34a'
            }}>{stats.confirmed}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#16a34a',
              marginTop: '4px'
            }}>Confirmed</div>
          </div>
          <div style={{
            backgroundColor: '#fef3c7',
            border: '0.5px solid rgba(245, 158, 11, 0.2)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: '#d97706'
            }}>{stats.pending}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#d97706',
              marginTop: '4px'
            }}>Pending</div>
          </div>
          <div style={{
            backgroundColor: '#fee2e2',
            border: '0.5px solid rgba(220, 38, 38, 0.2)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: '#dc2626'
            }}>{stats.declined}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#dc2626',
              marginTop: '4px'
            }}>Declined</div>
          </div>
          <div style={{
            backgroundColor: '#e0e7ff',
            border: '0.5px solid rgba(99, 102, 241, 0.2)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: '#6366f1'
            }}>{stats.plusOnes}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#6366f1',
              marginTop: '4px'
            }}>Plus Ones
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)',
        padding: '16px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={20} color={muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search guests by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: brown,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: '12px',
                border: '0.5px solid rgba(180,140,90,0.3)',
                fontFamily: 'Jost',
                fontSize: '14px',
                backgroundColor: 'white',
                color: brown
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
                border: '0.5px solid rgba(180,140,90,0.3)',
                fontFamily: 'Jost',
                fontSize: '14px',
                backgroundColor: 'white',
                color: brown
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
                border: '0.5px solid rgba(180,140,90,0.3)',
                fontFamily: 'Jost',
                fontSize: '14px',
                backgroundColor: 'white',
                color: brown
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
                fontFamily: 'Jost',
                fontSize: '12px',
                color: muted
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
                  backgroundColor: goldDark,
                  color: cream,
                  padding: '8px 16px',
                  fontFamily: 'Jost',
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
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              color: muted,
              marginBottom: '16px'
            }}> <Users size={48} /> </div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '8px'
            }}>No guests found</h3>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              {searchTerm || filterStatus !== 'all' || filterDietary !== 'all' || filterTable !== 'all'
                ? 'Try adjusting your filters or add your first guest.'
                : 'Add your first guest to start building your wedding guest list.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              backgroundColor: cream,
              padding: '16px',
              borderBottom: '0.5px solid rgba(180,140,90,0.2)',
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
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Name</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Email</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Phone</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Dietary</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Table</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Status</div>
              <div style={{
                fontFamily: 'Jost',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: muted
              }}>Actions</div>
            </div>

            {/* Guest Rows */}
            {filteredGuests.map((guest) => {
              const isEditing = editingGuest === guest.id
              
              return (
                <div key={guest.id} style={{
                  padding: '16px',
                  borderBottom: '0.5px solid rgba(180,140,90,0.2)',
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
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      />
                      <input
                        type="email"
                        defaultValue={guest.email || ''}
                        onBlur={(e) => handleEditGuest(guest.id, { email: e.target.value })}
                        style={{
                          padding: '8px',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      />
                      <input
                        type="tel"
                        defaultValue={guest.phone || ''}
                        onBlur={(e) => handleEditGuest(guest.id, { phone: e.target.value })}
                        style={{
                          padding: '8px',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      />
                      <select
                        defaultValue={guest.dietaryPreferences}
                        onChange={(e) => handleEditGuest(guest.id, { dietaryPreferences: e.target.value })}
                        style={{
                          padding: '8px',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
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
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      />
                      <select
                        defaultValue={guest.rsvpStatus}
                        onChange={(e) => handleEditGuest(guest.id, { rsvpStatus: e.target.value as any })}
                        style={{
                          padding: '8px',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="declined">Declined</option>
                      </select>
                      <button
                        onClick={() => setEditingGuest(null)}
                        style={{
                          backgroundColor: goldDark,
                          color: cream,
                          padding: '6px 12px',
                          fontFamily: 'Jost',
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
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: brown,
                          marginBottom: '4px'
                        }}>{guest.name}</div>
                        {guest.plusOne && guest.plusOneName && (
                          <div style={{
                            fontSize: '11px',
                            color: muted,
                            fontStyle: 'italic'
                          }}>+1 {guest.plusOneName}</div>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: muted
                      }}>{guest.email || '-'}</div>
                      <div style={{
                        fontSize: '12px',
                        color: muted
                      }}>{guest.phone || '-'}</div>
                      <div style={{
                        fontSize: '12px',
                        color: muted
                      }}>{guest.dietaryPreferences}</div>
                      <div style={{
                        fontSize: '12px',
                        color: muted
                      }}>{guest.tableNumber || '-'}</div>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {guest.rsvpStatus === 'confirmed' && (
                            <CheckCircle size={16} color="#16a34a" />
                          )}
                          {guest.rsvpStatus === 'pending' && (
                            <AlertCircle size={16} color="#d97706" />
                          )}
                          {guest.rsvpStatus === 'declined' && (
                            <XCircle size={16} color="#dc2626" />
                          )}
                          <span style={{
                            fontSize: '12px',
                            color: guest.rsvpStatus === 'confirmed' ? '#16a34a' : 
                                   guest.rsvpStatus === 'pending' ? '#d97706' : '#dc2626',
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
                          <Copy size={14} color={muted} />
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
                          <Mail size={14} color={muted} />
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
                          <Edit2 size={14} color={muted} />
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
                          <Trash2 size={14} color={muted} />
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
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '600px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown
              }}>Add New Guest</h2>
              <button
                onClick={() => setShowAddGuest(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={muted} />
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
                  }}
                />
                <input
                  type="text"
                  placeholder="Table Number"
                  value={newGuest.tableNumber}
                  onChange={(e) => setNewGuest({ ...newGuest, tableNumber: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
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
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: brown
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={newGuest.dietaryPreferences}
                  onChange={(e) => setNewGuest({ ...newGuest, dietaryPreferences: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Jost', fontSize: '14px' }}>
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
                      border: '0.5px solid rgba(180,140,90,0.3)',
                      fontFamily: 'Jost',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: brown,
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
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: brown,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddGuest(false)}
                  style={{
                    border: `0.5px solid ${gold}`,
                    color: gold,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
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
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
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
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown
              }}>Send Bulk Invitations</h2>
              <button
                onClick={() => setShowBulkInvite(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color={muted} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Jost',
                  fontSize: '12px',
                  color: muted,
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowBulkInvite(false)}
                  style={{
                    border: `0.5px solid ${gold}`,
                    color: gold,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
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
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
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
    </div>
  )
}
