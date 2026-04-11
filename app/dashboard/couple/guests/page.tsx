'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { 
  getWedding, 
  getGuestsByWedding, 
  createGuest, 
  deleteGuest, 
  updateGuestRSVP 
} from '../../../../lib/firestore'
import { Wedding, Guest } from '../../../../types'
import { 
  Users, 
  Plus, 
  Mail, 
  Download, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Check, 
  XCircle, 
  Clock, 
  HelpCircle,
  Copy,
  Send
} from 'lucide-react'

export default function GuestsManagement() {
  const { user, userProfile } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' })
  const [addingGuest, setAddingGuest] = useState(false)
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editingTableNumber, setEditingTableNumber] = useState('')
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)
  const [inviteLinks, setInviteLinks] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const weddingData = await getWedding(user?.uid || '')
      setWedding(weddingData)

      if (weddingData) {
        const guestsData = await getGuestsByWedding(weddingData.id)
        setGuests(guestsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wedding || !newGuest.name || !newGuest.email) return

    setAddingGuest(true)
    try {
      const guestId = await createGuest({
        weddingId: wedding.id,
        coupleId: user?.uid || '',
        name: newGuest.name,
        email: newGuest.email,
        phone: newGuest.phone,
        rsvpStatus: 'pending',
        dietaryPreferences: ''
      })

      // Generate invite link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kunda-kappa.vercel.app'
      const inviteLink = `${baseUrl}/guest/${guestId}`
      setInviteLinks(prev => ({ ...prev, [guestId]: inviteLink }))

      // Reset form and reload data
      setNewGuest({ name: '', email: '', phone: '' })
      setShowAddModal(false)
      await loadData()
    } catch (error) {
      console.error('Error adding guest:', error)
    } finally {
      setAddingGuest(false)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    setDeletingGuestId(guestId)
    try {
      await deleteGuest(guestId)
      await loadData()
    } catch (error) {
      console.error('Error deleting guest:', error)
    } finally {
      setDeletingGuestId(null)
    }
  }

  const handleUpdateTableNumber = async (guestId: string) => {
    if (!editingTableNumber) return

    try {
      const tableNumber = parseInt(editingTableNumber)
      await updateGuestRSVP(guestId, guests.find(g => g.id === guestId)!.rsvpStatus, undefined, tableNumber)
      setEditingTableId(null)
      setEditingTableNumber('')
      await loadData()
    } catch (error) {
      console.error('Error updating table number:', error)
    }
  }

  const handleSendInvite = async (guest: Guest) => {
    setSendingInviteId(guest.id)
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest.id,
          guestName: guest.name,
          guestEmail: guest.email,
          inviteToken: guest.inviteToken,
          coupleName: wedding?.coupleName1 && wedding?.coupleName2 
            ? `${wedding.coupleName1} & ${wedding.coupleName2}` 
            : userProfile?.name || 'The Happy Couple',
          weddingDate: wedding?.date,
          weddingVenue: wedding?.venue
        })
      })

      const data = await response.json()
      if (!response.ok) {
        console.error('Invite API error:', data)
        throw new Error(data.error || 'Failed to send invite')
      }
      alert('Invite sent successfully!')
    } catch (error: any) {
      console.error('Error sending invite:', error)
      alert('Email error: ' + error.message)
    } finally {
      setSendingInviteId(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Dietary Preferences', 'Table Number']
    const rows = guests.map(guest => [
      guest.name,
      guest.email,
      guest.phone,
      guest.rsvpStatus,
      guest.dietaryPreferences,
      guest.tableNumber || 'Not assigned'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getRSVPStats = () => {
    const stats = {
      total: guests.length,
      attending: guests.filter(g => g.rsvpStatus === 'attending').length,
      declined: guests.filter(g => g.rsvpStatus === 'declined').length,
      pending: guests.filter(g => g.rsvpStatus === 'pending').length,
      maybe: guests.filter(g => g.rsvpStatus === 'maybe').length
    }
    return stats
  }

  const getRSVPBadgeColor = (status: Guest['rsvpStatus']) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-blue-100 text-blue-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  const getRSVPIcon = (status: Guest['rsvpStatus']) => {
    switch (status) {
      case 'attending': return <Check className="w-4 h-4" />
      case 'declined': return <XCircle className="w-4 h-4" />
      case 'maybe': return <HelpCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a5c30] mx-auto mb-4"></div>
          <p className="text-[#3a2a1a] font-jost">Loading guests...</p>
        </div>
      </div>
    )
  }

  const stats = getRSVPStats()

  return (
    <div>
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
            border: '1.5px solid #b08850',
            borderRadius: '50%'
          }}></div>
          <span style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '20px',
            color: '#7a5c30',
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="/dashboard/couple" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#7a5c30',
            textDecoration: 'none'
          }}>Overview</a>
          <a href="/vendors" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#9a7850',
            textDecoration: 'none'
          }}>Vendors</a>
          <a href="/dashboard/couple/guests" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#7a5c30',
            textDecoration: 'none'
          }}>Guests</a>
          <a href="/dashboard/couple/bookings" style={{
            fontFamily: 'Jost',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#9a7850',
            textDecoration: 'none'
          }}>Bookings</a>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #b08850',
            backgroundColor: '#fdf9f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#7a5c30'
          }}>
            {userProfile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
          </div>
          <span style={{
            fontFamily: 'Jost',
            fontSize: '13px',
            color: '#3a2a1a'
          }}>{userProfile?.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-[#fdf9f5] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#7a5c30] font-cormorant">Guest Management</h1>
            <p className="text-[#3a2a1a] opacity-75 font-jost mt-1">Manage your wedding guests and RSVPs</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#7a5c30] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[#6a4c20] transition-colors font-jost"
            >
              <Plus className="w-5 h-5" />
              <span>Add Guest</span>
            </button>
            <button
              onClick={exportToCSV}
              className="bg-[#b08850] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[#a07840] transition-colors font-jost"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* RSVP Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <div>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9a7850',
                marginBottom: '8px'
              }}>Total Invited</p>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: '#3a2a1a'
              }}>{stats.total}</p>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <div>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9a7850',
                marginBottom: '8px'
              }}>Attending</p>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: '#3a2a1a'
              }}>{stats.attending}</p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <div>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9a7850',
                marginBottom: '8px'
              }}>Declined</p>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: '#3a2a1a'
              }}>{stats.declined}</p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <div>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9a7850',
                marginBottom: '8px'
              }}>Pending</p>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: '#3a2a1a'
              }}>{stats.pending}</p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <div>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9a7850',
                marginBottom: '8px'
              }}>Maybe</p>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: '#3a2a1a'
              }}>{stats.maybe}</p>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fdf9f5] border-b border-[#e8dcc6]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">RSVP Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">Dietary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a2a1a] uppercase tracking-wider font-jost">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dcc6]">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-[#fdf9f5]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#3a2a1a] font-jost">{guest.name}</div>
                      <div className="text-sm text-[#3a2a1a] opacity-60 font-jost">{guest.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#3a2a1a] font-jost">{guest.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.rsvpStatus === 'pending' ? (
                        <span style={{
                          backgroundColor: '#faeeda',
                          color: '#633806',
                          border: '0.5px solid #fac775',
                          padding: '3px 10px',
                          fontSize: '10px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          fontFamily: 'Jost',
                          letterSpacing: '0.1em'
                        }}>
                          Pending
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRSVPBadgeColor(guest.rsvpStatus)}`}>
                          {getRSVPIcon(guest.rsvpStatus)}
                          <span className="ml-1">{guest.rsvpStatus.charAt(0).toUpperCase() + guest.rsvpStatus.slice(1)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#3a2a1a] font-jost">
                        {guest.dietaryPreferences || 'None specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingTableId === guest.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editingTableNumber}
                            onChange={(e) => setEditingTableNumber(e.target.value)}
                            className="w-16 px-2 py-1 border border-[#b08850] rounded text-sm"
                            placeholder="Table #"
                          />
                          <button
                            onClick={() => handleUpdateTableNumber(guest.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTableId(null)
                              setEditingTableNumber('')
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-[#3a2a1a] font-jost">
                            {guest.tableNumber ? `Table ${guest.tableNumber}` : 'Not assigned'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTableId(guest.id)
                              setEditingTableNumber(guest.tableNumber?.toString() || '')
                            }}
                            className="text-[#7a5c30] hover:text-[#6a4c20]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {inviteLinks[guest.id] && (
                          <button
                            onClick={() => copyToClipboard(inviteLinks[guest.id])}
                            className="hover:opacity-80 transition-opacity"
                            title="Copy invite link"
                          >
                            <Copy className="w-4 h-4" style={{ width: '16px', height: '16px', color: '#b08850' }} />
                          </button>
                        )}
                        <button
                          onClick={() => handleSendInvite(guest)}
                          disabled={sendingInviteId === guest.id}
                          className="hover:opacity-80 transition-opacity disabled:opacity-50"
                          title="Send invite email"
                        >
                          {sendingInviteId === guest.id ? (
                            <div className="w-4 h-4 border-2 border-[#7a5c30] border-t-transparent rounded-full animate-spin" style={{ width: '16px', height: '16px', borderColor: '#7a5c30' }} />
                          ) : (
                            <Send className="w-4 h-4" style={{ width: '16px', height: '16px', color: '#7a5c30' }} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${guest.name}?`)) {
                              handleDeleteGuest(guest.id)
                            }
                          }}
                          disabled={deletingGuestId === guest.id}
                          className="hover:opacity-80 transition-opacity disabled:opacity-50"
                          title="Delete guest"
                        >
                          {deletingGuestId === guest.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" style={{ width: '16px', height: '16px', borderColor: '#cc4444' }} />
                          ) : (
                            <Trash2 className="w-4 h-4" style={{ width: '16px', height: '16px', color: '#cc4444' }} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Guest Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-[#7a5c30] mb-4 font-cormorant">Add New Guest</h2>
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3a2a1a] mb-1 font-jost">Name *</label>
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
                    placeholder="Guest name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3a2a1a] mb-1 font-jost">Email *</label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
                    placeholder="guest@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3a2a1a] mb-1 font-jost">Phone (optional)</label>
                  <input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#b08850] rounded-lg focus:ring-2 focus:ring-[#7a5c30] focus:border-transparent font-jost"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={addingGuest}
                    className="flex-1 bg-[#7a5c30] text-white py-2 px-4 rounded-lg font-jost hover:bg-[#6a4c20] transition-colors disabled:opacity-50"
                  >
                    {addingGuest ? 'Adding...' : 'Add Guest'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setNewGuest({ name: '', email: '', phone: '' })
                    }}
                    className="flex-1 bg-gray-200 text-[#3a2a1a] py-2 px-4 rounded-lg font-jost hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
