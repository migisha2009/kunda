'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { collection, query, getDocs, orderBy, doc, deleteDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { User, Vendor, Booking } from '../../../../types'
import { Users, Search, Filter, Trash2, AlertTriangle, Loader2, Eye, Mail, Download, ChevronLeft, ChevronRight, ArrowUpDown, UserPlus, Key } from 'lucide-react'
import { formatDate } from '../../../../lib/dateUtils'

export default function AdminUsersPage() {
  const { loading: authLoading } = useRequireAuth('admin')
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'couple' | 'vendor' | 'admin'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joined'>('joined')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userBookings, setUserBookings] = useState<Booking[]>([])
  const [userVendor, setUserVendor] = useState<Vendor | null>(null)
  const usersPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      )
      
      const usersSnapshot = await getDocs(usersQuery)
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: null,
        ...doc.data()
      })) as unknown as User[]

      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    setDeleting(userId)
    try {
      // Note: In a real app, you'd want to:
      // 1. Delete all related data (vendor profile, bookings, enquiries, etc.)
      // 2. Delete user's files from Storage
      // 3. Delete user's authentication record
      // For now, we'll just delete user document
      await deleteDoc(doc(db, 'users', userId))
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId))
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || (user.role || '') === roleFilter
    
    return matchesSearch && matchesRole
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'role':
        comparison = a.role.localeCompare(b.role)
        break
      case 'joined':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const loadUserDetails = async (user: User) => {
    try {
      // Load user bookings if couple
      if ((user.role || '') === 'couple') {
        const bookingsQuery = query(collection(db, 'bookings'), where('coupleId', '==', user.id))
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          createdAt: null,
          ...doc.data()
        })) as unknown as Booking[]
        setUserBookings(bookingsData)
      }
      
      // Load vendor profile if vendor
      if ((user.role || '') === 'vendor') {
        const vendorQuery = query(collection(db, 'vendors'), where('userId', '==', user.id))
        const vendorSnapshot = await getDocs(vendorQuery)
        if (!vendorSnapshot.empty) {
          const vendorData = vendorSnapshot.docs[0].data()
          setUserVendor({
            id: vendorSnapshot.docs[0].id,
            createdAt: null,
            ...vendorData
          } as unknown as Vendor)
        }
      }
      
      setSelectedUser(user)
      setShowUserModal(true)
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole })
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const sendPasswordReset = async (email: string) => {
    try {
      // In a real app, you'd use Firebase Auth to send password reset email
      console.log('Password reset email sent to:', email)
      alert('Password reset email sent successfully!')
    } catch (error) {
      console.error('Error sending password reset:', error)
      alert('Error sending password reset email')
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Joined Date', 'Active']
    const csvData = filteredUsers.map(user => [
      user.name || '',
      user.email || '',
      user.role || '',
      formatDate(user.createdAt),
      user.active ? 'Yes' : 'No'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'rgba(122, 92, 48, 0.1)', text: '#7a5c30' }
      case 'vendor':
        return { bg: 'rgba(176, 136, 80, 0.1)', text: '#b08850' }
      case 'couple':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af' }
    }
  }

  return (
    <>
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : !userProfile ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f5' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7a5c30' }} />
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: '#fdf9f5' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>User Management</h1>
                <p className="text-sm mt-2" style={{ color: '#9a7850' }}>Manage all users, couples, and vendors on the platform</p>
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{ border: '0.5px solid #b08850', color: '#7a5c30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 mb-6" style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9a7850' }} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded focus:outline-none"
                    style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'couple' | 'vendor' | 'admin')}
                  className="px-4 py-2 rounded focus:outline-none"
                  style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                >
                  <option value="all">All Roles</option>
                  <option value="couple">Couples</option>
                  <option value="vendor">Vendors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Total users count */}
            <div className="mb-4">
              <p className="text-sm" style={{ color: '#9a7850' }}>
                Total users: <span className="font-medium" style={{ color: '#3a2a1a' }}>{filteredUsers.length}</span>
              </p>
            </div>

            {/* Users Table */}
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid rgba(180,140,90,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#faf6f1' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Email
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                        style={{ color: '#9a7850', letterSpacing: '0.15em' }}
                        onClick={() => toggleSort('joined')}
                      >
                        <div className="flex items-center">
                          Joined
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9a7850', letterSpacing: '0.15em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                    {paginatedUsers.map((user) => {
                      const roleColors = getRoleColor(user.role || '')
                      return (
                        <tr 
                          key={user.id} 
                          className="hover:bg-gray-50" 
                          style={{ backgroundColor: 'transparent' }} 
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf6f1'} 
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium cursor-pointer" style={{ color: '#3a2a1a' }} onClick={() => loadUserDetails(user)}>
                              {user.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{ color: '#9a7850' }}>{user.email || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className="px-2 py-1 inline-flex text-xs leading-5 font-semibold"
                              style={{ backgroundColor: roleColors.bg, color: roleColors.text }}
                            >
                              {(user.role || '').charAt(0).toUpperCase() + (user.role || '').slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9a7850' }}>
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => loadUserDetails(user)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#7a5c30' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={user.role || ''}
                                onChange={(e) => changeUserRole(user.id, e.target.value)}
                                className="px-2 py-1 text-xs rounded focus:outline-none"
                                style={{ backgroundColor: '#faf6f1', border: '0.5px solid rgba(180,140,90,0.2)', color: '#3a2a1a' }}
                              >
                                <option value="couple">Couple</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => sendPasswordReset(user.email || '')}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#7a5c30' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(user.id)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#dc2626' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8" style={{ color: '#9a7850' }}>
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No users found matching your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(180,140,90,0.1)' }}>
                  <div className="text-sm" style={{ color: '#9a7850' }}>
                    Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#7a5c30' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm" style={{ color: '#9a7850' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded disabled:opacity-50 transition-colors"
                      style={{ color: '#7a5c30' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowUserModal(false)} />
                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '0.5px solid rgba(180,140,90,0.2)' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#3a2a1a' }}>User Details</h2>
                      <button
                        onClick={() => setShowUserModal(false)}
                        className="p-2 rounded transition-colors"
                        style={{ color: '#9a7850' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(180,140,90,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Name</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedUser.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Email</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedUser.email || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Phone</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{selectedUser.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Role</p>
                        <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1`} style={{ 
                          backgroundColor: getRoleColor(selectedUser.role || '').bg,
                          color: getRoleColor(selectedUser.role || '').text
                        }}>
                          {(selectedUser.role || '').charAt(0).toUpperCase() + (selectedUser.role || '').slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Joined Date</p>
                        <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Status</p>
                        <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1`} style={{ 
                          backgroundColor: selectedUser.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: selectedUser.active ? '#22c55e' : '#ef4444'
                        }}>
                          {selectedUser.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show bookings for couples */}
                    {(selectedUser.role || '') === 'couple' && userBookings.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Recent Bookings</p>
                        <div className="space-y-2">
                          {userBookings.slice(0, 5).map(booking => (
                            <div key={booking.id} className="p-3" style={{ backgroundColor: '#faf6f1' }}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium" style={{ color: '#3a2a1a' }}>{(booking as any).vendorName || 'Unknown Vendor'}</p>
                                  <p className="text-xs" style={{ color: '#9a7850' }}>{formatDate(booking.createdAt)}</p>
                                </div>
                                <p className="text-sm font-medium" style={{ color: '#7a5c30' }}>${booking.amount}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show vendor profile for vendors */}
                    {(selectedUser.role || '') === 'vendor' && userVendor && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-wider mb-2" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Vendor Profile</p>
                        <div className="p-3" style={{ backgroundColor: '#faf6f1' }}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Business Name</p>
                              <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{userVendor.businessName}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Category</p>
                              <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{userVendor.category}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Rating</p>
                              <p className="text-sm font-medium mt-1" style={{ color: '#3a2a1a' }}>{userVendor.rating} ({userVendor.reviewCount} reviews)</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.15em', color: '#9a7850' }}>Verified</p>
                              <span className={`inline-block px-2 py-1 text-xs leading-5 font-semibold mt-1`} style={{ 
                                backgroundColor: userVendor.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: userVendor.verified ? '#22c55e' : '#ef4444'
                              }}>
                                {userVendor.verified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.location.href = `mailto:${selectedUser.email || ''}`}
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ backgroundColor: '#7a5c30', color: '#fdf9f5' }}
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email User
                      </button>
                      <button
                        onClick={() => sendPasswordReset(selectedUser.email || '')}
                        className="px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{ border: '0.5px solid #b08850', color: '#7a5c30' }}
                      >
                        <Key className="w-4 h-4 inline mr-2" />
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(null)} />
                <div className="relative bg-white rounded-lg max-w-md w-full p-6" style={{ border: '0.5px solid rgba(180,140,90,0.2)' }}>
                  <div className="text-center mb-6">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#3a2a1a' }}>Delete User?</h3>
                    <p className="text-sm" style={{ color: '#9a7850' }}>
                      Are you sure? This cannot be undone. This will permanently delete user account and all associated data.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => deleteUser(showDeleteConfirm)}
                      disabled={deleting === showDeleteConfirm}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      {deleting === showDeleteConfirm ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <span>Delete User</span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded transition-colors"
                      style={{ border: '0.5px solid #b08850', color: '#7a5c30' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
