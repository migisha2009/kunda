'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getWedding, updateWedding, getBookingsByCouple } from '../../../lib/firestore'
import { Wedding, Booking } from '../../../types'
import { Heart, Calendar, Users, DollarSign, CheckSquare, Search, Plus, Edit2, Save, X, Loader2, User, UsersIcon } from 'lucide-react'

export default function CoupleDashboard() {
  const { user, userProfile } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState(false)
  const [newBudgetTotal, setNewBudgetTotal] = useState('')
  const [newTask, setNewTask] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load wedding data
      const weddingData = await getWedding(user.uid)
      setWedding(weddingData)

      // Load bookings
      const bookingsData = await getBookingsByCouple(user.uid)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    if (!wedding) return
    
    const updatedChecklist = wedding.checklist.map(item =>
      item.id === taskId ? { ...item, done: !item.done } : item
    )
    
    try {
      await updateWedding(wedding.id, { checklist: updatedChecklist })
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
      await updateWedding(wedding.id, { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateBudget = async () => {
    if (!wedding || !newBudgetTotal) return
    
    setSaving(true)
    try {
      const updatedBudget = {
        ...wedding.budget,
        total: parseFloat(newBudgetTotal)
      }
      await updateWedding(wedding.id, { budget: updatedBudget })
      setWedding({ ...wedding, budget: updatedBudget })
      setEditingBudget(false)
    } catch (error) {
      console.error('Error updating budget:', error)
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

  const calculateTasksDone = () => {
    if (!wedding) return { done: 0, total: 0 }
    const done = wedding.checklist.filter(item => item.done).length
    const total = wedding.checklist.length
    return { done, total }
  }

  const calculateBudgetUsed = () => {
    if (!wedding) return 0
    const spent = wedding.budget.spent
    const total = wedding.budget.total
    return total > 0 ? Math.round((spent / total) * 100) : 0
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show onboarding if no wedding document exists
  if (!wedding) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {userProfile.name}! 0x1f495
            </h1>
            <p className="text-gray-600">Let's start planning your perfect wedding</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#7a5c30' }} />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Up Your Wedding Profile</h2>
              <p className="text-gray-600">Tell us about your wedding so we can help you plan every detail</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-blue-900 font-medium">
                This feature is coming soon! For now, you can browse vendors and start making enquiries.
              </p>
              <div className="mt-4">
                <a href="/vendors" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Vendors
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { done: tasksDone, total: totalTasks } = calculateTasksDone()
  const daysUntilWedding = calculateDaysUntilWedding()
  const budgetUsed = calculateBudgetUsed()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.name}! 0x1f495
          </h1>
          <p className="text-gray-600">Let's make your wedding dreams come true</p>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 mt-4">
            <a
              href="/dashboard/couple/wedding"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Wedding Details
            </a>
            <a
              href="/dashboard/couple/bookings"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              My Bookings
            </a>
            <a
              href="/dashboard/couple/vendors"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              My Vendors
            </a>
            <a
              href="/dashboard/couple/guests"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              Guests
            </a>
            <a
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Days Until Wedding</p>
                <p className="text-2xl font-bold text-gray-900">{daysUntilWedding}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Guest Count</p>
                <p className="text-2xl font-bold text-gray-900">{wedding.guestCount}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold text-gray-900">{budgetUsed}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Done</p>
                <p className="text-2xl font-bold text-gray-900">{tasksDone}/{totalTasks}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wedding Checklist */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Wedding Checklist</h2>
              
              {/* Add new task */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.trim() || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Task list */}
              <div className="space-y-3">
                {wedding.checklist.length > 0 ? (
                  wedding.checklist.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleTask(item.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`flex-1 text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.task}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No tasks yet. Add your first wedding task above!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Bookings</h2>
              <div className="space-y-4">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Booking #{booking.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">{booking.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {wedding.budget.currency} {booking.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No bookings yet. Start browsing vendors to make your first booking!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Find Vendors */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Vendors</h2>
              <div className="space-y-3">
                <a href="/vendors" className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <Search className="w-4 h-4 mr-2" />
                  Browse All Vendors
                </a>
                <div className="grid grid-cols-2 gap-2">
                  {['Photographers', 'Florists', 'Caterers', 'Venues'].map((category) => (
                    <a
                      key={category}
                      href={`/vendors?category=${encodeURIComponent(category)}`}
                      className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      {category}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Budget Overview</h2>
                <button
                  onClick={() => {
                    setEditingBudget(true)
                    setNewBudgetTotal(wedding.budget.total.toString())
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              {editingBudget ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    value={newBudgetTotal}
                    onChange={(e) => setNewBudgetTotal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter total budget"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateBudget}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <Save className="w-4 h-4 mx-auto" />}
                    </button>
                    <button
                      onClick={() => setEditingBudget(false)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="font-medium text-gray-900">
                      {wedding.budget.currency} {wedding.budget.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className="font-medium text-gray-900">
                      {wedding.budget.currency} {wedding.budget.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className="font-medium text-green-600">
                      {wedding.budget.currency} {(wedding.budget.total - wedding.budget.spent).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${budgetUsed}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">{budgetUsed}% of budget used</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
