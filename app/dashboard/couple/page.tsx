'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRequireAuth } from '../../../hooks/useRequireAuth'
import { db } from '../../../lib/firebase'
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { formatDate } from '../../../lib/dateUtils'
import { 
  Search, Users, Calendar, DollarSign, CheckSquare, Plus, LogOut, MapPin, Clock, 
  Heart, Star, Filter, Download, Share2, Printer, Sun, Moon, Upload, X, Edit2,
  Trash2, ChevronDown, ChevronUp, AlertCircle, TrendingUp, Mail, Copy, Send,
  Settings, Camera, Sparkles, Gift, Music, Cake, Flower, Car, Palette, Bell
} from 'lucide-react'
import { Wedding, Guest, Expense, Vendor, Booking, ChecklistItem, WeatherData } from '../../../types'
import AIChat from '../../../components/AIChat'
import { celebrateTask } from '../../../lib/confetti'
import { useCountUp } from '../../../hooks/useCountUp'
import { useScrollReveal } from '../../../hooks/useScrollReveal'
import AnimatedProgress from '../../../components/AnimatedProgress'
import NotificationBell from '../../../components/NotificationBell'
import { useToast } from '../../../components/Toast'

// Motivational quotes
const quotes = [
  "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
  "A successful marriage requires falling in love many times, always with the same person.",
  "The best thing to hold onto in life is each other.",
  "Love is composed of a single soul inhabiting two bodies.",
  "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage."
]

export default function CoupleDashboard() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user, userProfile, signOutUser } = useAuth()
  const { showToast } = useToast()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [todayInfo, setTodayInfo] = useState({ date: '', dayOfWeek: '', daysAgo: 0 })
  const [quote, setQuote] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showVendorPanel, setShowVendorPanel] = useState(false)
  const [vendorFilter, setVendorFilter] = useState('all')
  const [vendorSearch, setVendorSearch] = useState('')
  const [savedVendors, setSavedVendors] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  
  // Onboarding form state
  const [onboarding, setOnboarding] = useState({
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    venueAddress: '',
    guestCount: '',
    totalBudget: '',
    currency: 'RWF' as 'RWF' | 'USD' | 'EUR',
    ceremonyTime: '',
    receptionTime: '',
    dresscode: 'formal' as const,
    messageToGuests: '',
    hashtag: '',
    rsvpDeadline: '',
    colorTheme: ['#b08850', '#fdf9f5'] as [string, string]
  })

  // Checklist state
  const [newTask, setNewTask] = useState('')
  const [taskCategory, setTaskCategory] = useState<ChecklistItem['category']>('other')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskNotes, setTaskNotes] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending'>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [celebrating, setCelebrating] = useState(false)

  // Budget state
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', category: 'other' as const, paid: false, notes: '' })
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [showPaidOnly, setShowPaidOnly] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  // Guest state
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '', dietary: '', plusOne: false, plusOneName: '', notes: '' })
  const [guestFilter, setGuestFilter] = useState<'all' | 'attending' | 'declined' | 'pending' | 'maybe'>('all')
  const [guestSearch, setGuestSearch] = useState('')

  // Wedding details state
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({
    coupleName1: '',
    coupleName2: '',
    date: '',
    venue: '',
    venueAddress: '',
    ceremonyLocation: '',
    ceremonyTime: '',
    receptionTime: '',
    dresscode: 'formal' as const,
    customDresscode: '',
    messageToGuests: '',
    hashtag: '',
    rsvpDeadline: '',
    colorTheme: ['#b08850', '#fdf9f5'] as [string, string]
  })
  const [scheduleItems, setScheduleItems] = useState([{ time: '', event: '' }])

  useEffect(() => {
    if (user) {
      loadData()
      initializeWedding()
      setQuote(quotes[Math.floor(Math.random() * quotes.length)])
      updateTodayInfo()
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

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        // Count new bookings with status pending
        const bookingsQuery = query(collection(db, 'bookings'), where('coupleId', '==', user.uid), where('status', '==', 'pending'))
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const pendingBookings = bookingsSnapshot.docs.length

        // Count unread enquiries
        const enquiriesQuery = query(collection(db, 'enquiries'), where('coupleId', '==', user.uid), where('read', '==', false))
        const enquiriesSnapshot = await getDocs(enquiriesQuery)
        const unreadEnquiries = enquiriesSnapshot.docs.length

        setNotificationCount(pendingBookings + unreadEnquiries)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load wedding data
      const weddingDoc = doc(db, 'weddings', user.uid)
      const weddingSnapshot = await getDoc(weddingDoc)
      if (weddingSnapshot.exists()) {
        const weddingData = weddingSnapshot.data() as Wedding
        setWedding(weddingData)
        setDetailsForm({
          coupleName1: weddingData.coupleName1 || '',
          coupleName2: weddingData.coupleName2 || '',
          date: weddingData.date ? new Date(weddingData.date).toISOString().split('T')[0] : '',
          venue: weddingData.venue || '',
          venueAddress: weddingData.venueAddress || '',
          ceremonyLocation: weddingData.ceremonyLocation || '',
          ceremonyTime: weddingData.ceremonyTime || '',
          receptionTime: weddingData.receptionTime || '',
          dresscode: (weddingData.dresscode || 'formal') as any,
          customDresscode: weddingData.customDresscode || '',
          messageToGuests: weddingData.messageToGuests || '',
          hashtag: weddingData.hashtag || '',
          rsvpDeadline: weddingData.rsvpDeadline ? new Date(weddingData.rsvpDeadline).toISOString().split('T')[0] : '',
          colorTheme: weddingData.colorTheme || ['#1a56db', '#f0f4ff']
        })
        setScheduleItems(weddingData.scheduleItems || [{ time: '', event: '' }])
      }

      // Load guests
      const guestsQuery = query(collection(db, 'guests'), where('coupleId', '==', user.uid))
      const guestsSnapshot = await getDocs(guestsQuery)
      const guestsData = guestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guest[]
      setGuests(guestsData)

      // Load expenses
      const expensesQuery = query(collection(db, 'expenses'), where('coupleId', '==', user.uid))
      const expensesSnapshot = await getDocs(expensesQuery)
      const expensesData = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      setExpenses(expensesData)

      // Load vendors
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'))
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vendor[]
      setVendors(vendorsData)

      // Load bookings
      const bookingsQuery = query(collection(db, 'bookings'), where('coupleId', '==', user.uid))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[]
      setBookings(bookingsData)

      // Load saved vendors
      const savedDoc = await getDoc(doc(db, 'savedVendors', user.uid))
      if (savedDoc.exists()) {
        setSavedVendors(savedDoc.data().vendorIds || [])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeWedding = () => {
    if (!user) return
    
    const defaultChecklist: ChecklistItem[] = [
      { id: '1', task: 'Book venue', done: false, category: 'venue', urgent: true, order: 1 },
      { id: '2', task: 'Hire photographer', done: false, category: 'other', urgent: true, order: 2 },
      { id: '3', task: 'Send invitations', done: false, category: 'other', urgent: false, order: 3 },
      { id: '4', task: 'Book catering', done: false, category: 'catering', urgent: true, order: 4 },
      { id: '5', task: 'Arrange transport', done: false, category: 'transport', urgent: false, order: 5 },
      { id: '6', task: 'Order cake', done: false, category: 'other', urgent: false, order: 6 },
      { id: '7', task: 'Book florist', done: false, category: 'decor', urgent: false, order: 7 },
      { id: '8', task: 'Hire DJ', done: false, category: 'music', urgent: false, order: 8 },
      { id: '9', task: 'Get wedding rings', done: false, category: 'fashion', urgent: true, order: 9 },
      { id: '10', task: 'Book hair and makeup', done: false, category: 'beauty', urgent: false, order: 10 }
    ]

    const weddingData = {
      coupleId: user.uid,
      coupleName1: '',
      coupleName2: '',
      date: new Date(),
      venue: '',
      venueAddress: '',
      guestCount: 0,
      budget: { total: 0, spent: 0, currency: 'RWF' },
      checklist: defaultChecklist,
      ceremonyTime: '',
      receptionTime: '',
      dresscode: 'formal' as const,
      customDresscode: '',
      messageToGuests: '',
      scheduleItems: [],
      hashtag: '',
      rsvpDeadline: new Date(),
      colorTheme: ['#1a56db', '#f0f4ff'] as [string, string],
      heroImage: '',
      planningStartDate: new Date(),
      profileCompletion: 0,
      budgetExpenses: [],
      currency: 'RWF' as const,
      quoteOfTheDay: quotes[Math.floor(Math.random() * quotes.length)]
    }

    setWedding(weddingData as unknown as Wedding)
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

  const updateTodayInfo = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const dateString = today.toLocaleDateString('en-US', options)
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Calculate days since planning started (default to 30 days ago if no wedding exists)
    const planningStart = wedding?.planningStartDate ? new Date(wedding.planningStartDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const daysAgo = Math.floor((today.getTime() - planningStart.getTime()) / (1000 * 60 * 60 * 24))
    
    setTodayInfo({ date: dateString, dayOfWeek, daysAgo })
  }

  const createWedding = async () => {
    if (!user) return
    
    try {
      const weddingData = {
        coupleId: user.uid,
        coupleName1: onboarding.coupleName1,
        coupleName2: onboarding.coupleName2,
        date: new Date(onboarding.date),
        venue: onboarding.venue,
        venueAddress: onboarding.venueAddress,
        guestCount: parseInt(onboarding.guestCount),
        budget: {
          total: parseFloat(onboarding.totalBudget),
          spent: 0,
          currency: onboarding.currency
        },
        checklist: [
          { id: '1', task: 'Book venue', done: false, category: 'venue' as const, urgent: true, order: 1 },
          { id: '2', task: 'Hire photographer', done: false, category: 'other' as const, urgent: true, order: 2 },
          { id: '3', task: 'Send invitations', done: false, category: 'other' as const, urgent: false, order: 3 },
          { id: '4', task: 'Book catering', done: false, category: 'catering' as const, urgent: true, order: 4 },
          { id: '5', task: 'Arrange transport', done: false, category: 'transport' as const, urgent: false, order: 5 },
          { id: '6', task: 'Order cake', done: false, category: 'other' as const, urgent: false, order: 6 },
          { id: '7', task: 'Book florist', done: false, category: 'decor' as const, urgent: false, order: 7 },
          { id: '8', task: 'Hire DJ', done: false, category: 'music' as const, urgent: false, order: 8 },
          { id: '9', task: 'Get wedding rings', done: false, category: 'fashion' as const, urgent: true, order: 9 },
          { id: '10', task: 'Book hair and makeup', done: false, category: 'beauty' as const, urgent: false, order: 10 }
        ],
        ceremonyTime: onboarding.ceremonyTime,
        receptionTime: onboarding.receptionTime,
        dresscode: onboarding.dresscode,
        messageToGuests: onboarding.messageToGuests,
        scheduleItems: [],
        hashtag: onboarding.hashtag,
        rsvpDeadline: new Date(onboarding.rsvpDeadline),
        colorTheme: onboarding.colorTheme,
        planningStartDate: new Date(),
        profileCompletion: 25,
        budgetExpenses: [],
        currency: onboarding.currency,
        quoteOfTheDay: quote
      }
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), weddingData)
      window.location.reload()
    } catch (error) {
      console.error('Error creating wedding:', error)
    }
  }

  const calculateStats = () => {
    if (!wedding || !guests) return {
      totalGuests: 0,
      confirmedGuests: 0,
      pendingGuests: 0,
      declinedGuests: 0,
      maybeGuests: 0,
      vendorsBooked: bookings.length,
      tasksCompleted: 0,
      tasksTotal: 0,
      daysUntilWedding: 0,
      budgetUsed: 0,
      budgetRemaining: 0,
      profileCompletion: 0
    }

    const confirmedGuests = guests.filter((g: Guest) => g.rsvpStatus === 'attending').length
    const pendingGuests = guests.filter((g: Guest) => g.rsvpStatus === 'pending').length
    const declinedGuests = guests.filter((g: Guest) => g.rsvpStatus === 'declined').length
    const maybeGuests = guests.filter((g: Guest) => g.rsvpStatus === 'maybe').length
    const tasksCompleted = wedding.checklist.filter((t: ChecklistItem) => t.done).length
    const tasksTotal = wedding.checklist.length
    const budgetUsed = wedding.budget.total > 0 ? Math.round((wedding.budget.spent / wedding.budget.total) * 100) : 0
    const budgetRemaining = wedding.budget.total - wedding.budget.spent
    const daysUntilWedding = Math.ceil((new Date(wedding.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    return {
      totalGuests: guests.length,
      confirmedGuests,
      pendingGuests,
      declinedGuests,
      maybeGuests,
      vendorsBooked: bookings.length,
      tasksCompleted,
      tasksTotal,
      daysUntilWedding: Math.max(0, daysUntilWedding),
      budgetUsed,
      budgetRemaining,
      profileCompletion: wedding.profileCompletion || 0
    }
  }

  const stats = calculateStats()
  
  // Animated counters
  const animatedDays = useCountUp(stats.daysUntilWedding)
  const animatedGuests = useCountUp(stats.confirmedGuests)
  const animatedTotalGuests = useCountUp(stats.totalGuests)
  const animatedBudgetUsed = useCountUp(stats.budgetUsed)
  const animatedVendors = useCountUp(stats.vendorsBooked)
  const animatedTasksCompleted = useCountUp(stats.tasksCompleted)
  const animatedTasksTotal = useCountUp(stats.tasksTotal)
  const animatedProfileCompletion = useCountUp(stats.profileCompletion)
  
  // Scroll reveal for stats
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal(0.1)
  
  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Task management functions
  const handleToggleTask = async (taskId: string) => {
    if (!wedding) return
    
    const updatedChecklist = wedding.checklist.map(item =>
      item.id === taskId ? { ...item, done: !item.done } : item
    )
    
    try {
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      
      // Celebration animation for completed tasks
      const completedTask = updatedChecklist.find(item => item.id === taskId && item.done)
      if (completedTask) {
        celebrateTask()
        showToast('Task completed! Great job! 🎉', 'success')
      }
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const handleAddTask = async () => {
    if (!wedding || !newTask.trim()) return
    
    const newTaskItem: ChecklistItem = {
      id: Date.now().toString(),
      task: newTask.trim(),
      done: false,
      category: taskCategory,
      dueDate: taskDueDate ? new Date(taskDueDate) : undefined,
      notes: taskNotes.trim() || undefined,
      urgent: false,
      order: wedding.checklist.length + 1
    }
    
    try {
      const updatedChecklist = [...wedding.checklist, newTaskItem]
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      setNewTask('')
      setTaskNotes('')
      setTaskDueDate('')
      setTaskCategory('other')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!wedding) return
    
    try {
      const updatedChecklist = wedding.checklist.filter(item => item.id !== taskId)
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleToggleUrgent = async (taskId: string) => {
    if (!wedding) return
    
    const updatedChecklist = wedding.checklist.map(item =>
      item.id === taskId ? { ...item, urgent: !item.urgent } : item
    )
    
    try {
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error updating task urgency:', error)
    }
  }

  // Budget management functions
  const handleAddExpense = async () => {
    if (!wedding || !newExpense.name.trim() || !newExpense.amount) return
    
    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name.trim(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      paid: newExpense.paid,
      date: new Date(),
      notes: newExpense.notes.trim() || undefined
    }
    
    try {
      const updatedExpenses = [...(wedding.budgetExpenses || []), expense]
      const newSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setExpenses(updatedExpenses)
      setNewExpense({ name: '', amount: '', category: 'other', paid: false, notes: '' })
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleEditExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!wedding) return
    
    try {
      const updatedExpenses = (wedding.budgetExpenses || []).map(exp =>
        exp.id === expenseId ? { ...exp, ...updates } : exp
      )
      const newSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setExpenses(updatedExpenses)
      setEditingExpense(null)
    } catch (error) {
      console.error('Error editing expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!wedding) return
    
    try {
      const updatedExpenses = (wedding.budgetExpenses || []).filter(exp => exp.id !== expenseId)
      const newSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: newSpent }
      })
      
      setExpenses(updatedExpenses)
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  // Guest management functions
  const handleAddGuest = async () => {
    if (!user || !newGuest.name.trim()) return
    
    const guest: Guest = {
      id: Date.now().toString(),
      weddingId: wedding?.id || null,
      coupleId: user.uid,
      name: newGuest.name.trim(),
      email: newGuest.email.trim(),
      phone: newGuest.phone.trim(),
      rsvpStatus: 'pending',
      dietaryPreferences: newGuest.dietary.trim(),
      plusOne: newGuest.plusOne,
      plusOneName: newGuest.plusOneName.trim() || undefined,
      notes: newGuest.notes.trim() || undefined,
      inviteToken: Math.random().toString(36).substring(2, 15)
    }
    
    try {
      await addDoc(collection(db, 'guests'), guest)
      setGuests([...guests, guest])
      setNewGuest({ name: '', email: '', phone: '', dietary: '', plusOne: false, plusOneName: '', notes: '' })
    } catch (error) {
      console.error('Error adding guest:', error)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    try {
      await deleteDoc(doc(db, 'guests', guestId))
      setGuests(guests.filter(g => g.id !== guestId))
    } catch (error) {
      console.error('Error deleting guest:', error)
    }
  }

  const handleUpdateGuestRSVP = async (guestId: string, status: Guest['rsvpStatus']) => {
    try {
      await updateDoc(doc(db, 'guests', guestId), { rsvpStatus: status })
      setGuests(guests.map(g => g.id === guestId ? { ...g, rsvpStatus: status } : g))
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }

  // Vendor management functions
  const handleSaveVendor = async (vendorId: string) => {
    if (!user) return
    
    try {
      const updatedSavedVendors = savedVendors.includes(vendorId)
        ? savedVendors.filter(id => id !== vendorId)
        : [...savedVendors, vendorId]
      
      await setDoc(doc(db, 'savedVendors', (user || { uid: '' }).uid), { vendorIds: updatedSavedVendors })
      setSavedVendors(updatedSavedVendors)
    } catch (error) {
      console.error('Error saving vendor:', error)
    }
  }

  const handleViewVendor = (vendorId: string) => {
    const updatedRecentlyViewed = [vendorId, ...recentlyViewed.filter(id => id !== vendorId)].slice(0, 10)
    setRecentlyViewed(updatedRecentlyViewed)
  }

  // Wedding details functions
  const handleSaveWeddingDetails = async () => {
    if (!wedding) return
    
    try {
      const updatedWedding = {
        ...wedding,
        ...detailsForm,
        date: new Date(detailsForm.date),
        rsvpDeadline: new Date(detailsForm.rsvpDeadline),
        scheduleItems: scheduleItems.filter(item => item.time.trim() && item.event.trim())
      }
      
      await updateDoc(doc(db, 'weddings', (user || { uid: '' }).uid), updatedWedding)
      setWedding(updatedWedding)
      setEditingDetails(false)
    } catch (error) {
      console.error('Error saving wedding details:', error)
    }
  }

  const handleAddScheduleItem = () => {
    setScheduleItems([...scheduleItems, { time: '', event: '' }])
  }

  const handleUpdateScheduleItem = (index: number, field: 'time' | 'event', value: string) => {
    const updated = [...scheduleItems]
    updated[index] = { ...updated[index], [field]: value }
    setScheduleItems(updated)
  }

  const handleRemoveScheduleItem = (index: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index))
  }

  // Utility functions
  const exportGuestList = () => {
    const csv = 'Name,Email,Phone,RSVP Status,Dietary Preferences,Plus One,Notes\n' +
      guests.map(g => `"${g.name}","${g.email}","${g.phone}","${g.rsvpStatus}","${g.dietaryPreferences}","${g.plusOne ? g.plusOneName : ''}","${g.notes || ''}"`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-guests.csv'
    a.click()
  }

  const exportBudget = () => {
    const csv = 'Name,Amount,Category,Paid,Date,Notes\n' +
      expenses.map(e => `"${e.name}","${e.amount}","${e.category}","${e.paid}","${formatDate(e.date)}","${e.notes || ''}"`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-budget.csv'
    a.click()
  }

  const shareWeddingPage = () => {
    if (navigator.share) {
      navigator.share({
        title: `${wedding?.coupleName1} & ${wedding?.coupleName2}'s Wedding`,
        text: `Join us in celebrating our special day!`,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(window.location.origin)
    }
  }

  const printWeddingSummary = () => {
    window.print()
  }

  const copyInviteLink = (guest: Guest) => {
    const inviteLink = `${window.location.origin}/invite/${guest.inviteToken}`
    navigator.clipboard.writeText(inviteLink)
  }

  const sendInviteEmail = async (guest: Guest) => {
    // This would integrate with an email service
    console.log('Sending invite to:', guest.email)
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesCategory = vendorFilter === 'all' || vendor.category === vendorFilter
    const matchesSearch = (vendor.businessName || vendor.name).toLowerCase().includes(vendorSearch.toLowerCase()) ||
                         vendor.location.toLowerCase().includes(vendorSearch.toLowerCase())
    return matchesCategory && matchesSearch
  }).slice(0, 6)

  const filteredGuests = guests.filter(guest => {
    const matchesStatus = guestFilter === 'all' || guest.rsvpStatus === guestFilter
    const matchesSearch = guest.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
                         (guest.email || '').toLowerCase().includes(guestSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredTasks = wedding?.checklist.filter(task => {
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'done' && task.done) || 
                         (filterStatus === 'pending' && !task.done)
    const matchesVisibility = showCompleted || !task.done
    return matchesCategory && matchesStatus && matchesVisibility
  }) || []

  const filteredExpenses = expenses.filter(expense => {
    return !showPaidOnly || expense.paid
  })

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--color-background)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid var(--color-border)`,
          borderTop: `3px solid var(--color-primary)`,
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
    <div style={{ backgroundColor: '#f0f4ff', minHeight: '100vh', fontFamily: 'Urbanist, sans-serif' }}>
      
      {/* Celebration Animation */}
      {celebrating && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '48px',
          zIndex: 1000,
          animation: 'celebrate 2s ease-out'
        }}>
          <Sparkles size={48} color={'var(--color-primary)'} />
          <div style={{
            fontFamily: 'Urbanist',
            fontSize: '24px',
            color: 'var(--color-primary)',
            textAlign: 'center',
            marginTop: '16px'
          }}>Task Completed! </div>
        </div>
      )}
      
      {/* TOP NAVBAR */}
      <div style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5edff',
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
            border: '1.5px solid #1a56db',
            borderRadius: '50%'
          }}></div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f2460',
            letterSpacing: '0.1em'
          }}>Kunda</span>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="/dashboard/couple" style={{
            fontFamily: 'Urbanist',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1a56db',
            textDecoration: 'none'
          }}>Overview</a>
          <a href="/dashboard/couple/checklist" style={{
            fontFamily: 'Urbanist',
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            textDecoration: 'none'
          }}>Checklist</a>
          <a href="/dashboard/couple/budget" style={{
            fontFamily: 'Urbanist',
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            textDecoration: 'none'
          }}>Budget</a>
          <a href="/dashboard/couple/guests" style={{
            fontFamily: 'Urbanist',
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            textDecoration: 'none'
          }}>Guests</a>
          <a href="/dashboard/couple/wedding" style={{
            fontFamily: 'Urbanist',
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            textDecoration: 'none'
          }}>Details</a>
          <a href="/dashboard/couple/bookings" style={{
            fontFamily: 'Urbanist',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#6b7280',
            textDecoration: 'none'
          }}>Bookings</a>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              border: '1px solid #e5edff',
              backgroundColor: 'transparent',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            {darkMode ? <Sun size={16} color={'#1a56db'} /> : <Moon size={16} color={'#1a56db'} />}
          </button>
          
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #1a56db',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Urbanist',
            fontSize: '13px',
            color: '#0f2460'
          }}>
            {userProfile?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span style={{
            fontFamily: 'Urbanist',
            fontSize: '13px',
            color: '#111928'
          }}>{userProfile?.name}</span>
          <button
            onClick={signOutUser}
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
              borderRadius: '8px',
              letterSpacing: '0.05em'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* WEDDING SETUP OR MAIN DASHBOARD */}
      {!wedding || (!wedding.coupleName1 && !wedding.coupleName2) ? (
        <div style={{ padding: '32px', backgroundColor: '#f0f4ff' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            margin: '0 auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontFamily: 'Urbanist',
              fontSize: '36px',
              fontWeight: 800,
              color: '#0f2460',
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
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="text"
                placeholder="Partner's name"
                value={onboarding.coupleName2}
                onChange={(e) => setOnboarding({...onboarding, coupleName2: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="date"
                value={onboarding.date}
                onChange={(e) => setOnboarding({...onboarding, date: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="text"
                placeholder="Venue name"
                value={onboarding.venue}
                onChange={(e) => setOnboarding({...onboarding, venue: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="text"
                placeholder="Venue address"
                value={onboarding.venueAddress}
                onChange={(e) => setOnboarding({...onboarding, venueAddress: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="number"
                placeholder="Guest count"
                value={onboarding.guestCount}
                onChange={(e) => setOnboarding({...onboarding, guestCount: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="number"
                placeholder="Total budget"
                value={onboarding.totalBudget}
                onChange={(e) => setOnboarding({...onboarding, totalBudget: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <select
                value={onboarding.currency}
                onChange={(e) => setOnboarding({...onboarding, currency: e.target.value as 'RWF' | 'USD' | 'EUR'})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              >
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                type="time"
                placeholder="Ceremony time"
                value={onboarding.ceremonyTime}
                onChange={(e) => setOnboarding({...onboarding, ceremonyTime: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="time"
                placeholder="Reception time"
                value={onboarding.receptionTime}
                onChange={(e) => setOnboarding({...onboarding, receptionTime: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <select
                value={onboarding.dresscode}
                onChange={(e) => setOnboarding({...onboarding, dresscode: e.target.value as any})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              >
                <option value="black_tie">Black Tie</option>
                <option value="formal">Formal</option>
                <option value="semi_formal">Semi-Formal</option>
                <option value="casual">Casual</option>
                <option value="custom">Custom</option>
              </select>
              <textarea
                placeholder="Message to guests"
                value={onboarding.messageToGuests}
                onChange={(e) => setOnboarding({...onboarding, messageToGuests: e.target.value})}
                rows={3}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928',
                  resize: 'vertical'
                }}
              />
              <input
                type="text"
                placeholder="Wedding hashtag"
                value={onboarding.hashtag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOnboarding({...onboarding, hashtag: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <input
                type="date"
                placeholder="RSVP deadline"
                value={onboarding.rsvpDeadline}
                onChange={(e) => setOnboarding({...onboarding, rsvpDeadline: e.target.value})}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5edff',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#111928'
                }}
              />
              <button
                onClick={createWedding}
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
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(26,86,219,0.3)'
                }}
              >
                Create Wedding
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* HERO SECTION WITH WEDDING OVERVIEW */}
          <div style={{ 
            padding: '32px', 
            backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-background)',
            backgroundImage: wedding.heroImage ? `url(${wedding.heroImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}>
            {wedding.heroImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(253, 249, 245, 0.85)',
                zIndex: 1
              }}></div>
            )}
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Welcome message and date info */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--color-muted)',
                  marginBottom: '8px'
                }}>
                  {todayInfo.dayOfWeek} {todayInfo.date}
                </div>
                <div style={{
                  fontFamily: 'Urbanist',
                  fontSize: '13px',
                  color: 'var(--color-muted)',
                  marginBottom: '16px'
                }}>
                  {todayInfo.daysAgo} days ago you started planning your wedding
                </div>
              </div>

              {/* Couple names and venue */}
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                  fontFamily: 'Urbanist',
                  fontSize: '40px',
                  fontWeight: 800,
                  color: 'var(--color-text)',
                  marginBottom: '8px'
                }}>
                  Welcome, {wedding.coupleName1} & {wedding.coupleName2}
                </h1>
                <p style={{
                  fontFamily: 'Urbanist',
                  fontSize: '16px',
                  fontWeight: 400,
                  color: 'var(--color-muted)',
                  marginBottom: '8px'
                }}>
                  {wedding.venue} {wedding.venueAddress && `· ${wedding.venueAddress}`}
                </p>
                <p style={{
                  fontFamily: 'Urbanist',
                  fontSize: '16px',
                  fontWeight: 400,
                  color: 'var(--color-muted)'
                }}>
                  {formatDate(wedding.date)} · {wedding.ceremonyTime} Ceremony
                </p>
              </div>

              {/* Live countdown timer */}
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontFamily: 'Urbanist',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>Countdown to Your Special Day</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid var(--color-border)`,
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Urbanist',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      letterSpacing: '-0.02em'
                    }}>{countdown.days}</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-muted)',
                      marginTop: '4px'
                    }}>Days</div>
                  </div>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid var(--color-border)`,
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Urbanist',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      letterSpacing: '-0.02em'
                    }}>{countdown.hours}</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-muted)',
                      marginTop: '4px'
                    }}>Hours</div>
                  </div>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid var(--color-border)`,
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Urbanist',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      letterSpacing: '-0.02em'
                    }}>{countdown.mins}</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-muted)',
                      marginTop: '4px'
                    }}>Minutes</div>
                  </div>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid var(--color-border)`,
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontFamily: 'Urbanist',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      letterSpacing: '-0.02em'
                    }}>{countdown.secs}</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-muted)',
                      marginTop: '4px'
                    }}>Seconds</div>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button
                  onClick={() => window.location.href = '/vendors'}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Search size={16} color={'var(--color-primary)'} />
                  Browse Vendors
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/couple/guests'}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Users size={16} color={'var(--color-primary)'} />
                  Guests
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/couple/bookings'}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Calendar size={16} color={'var(--color-primary)'} />
                  Bookings
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/couple/budget'}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <DollarSign size={16} color={'var(--color-primary)'} />
                  Budget
                </button>
                <button
                  onClick={shareWeddingPage}
                  style={{
                    border: `0.5px solid var(--color-border)`,
                    color: 'var(--color-primary)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Share2 size={16} color={'var(--color-primary)'} />
                  Share
                </button>
                <button
                  onClick={printWeddingSummary}
                  style={{
                    border: `0.5px solid var(--color-border)`,
                    color: 'var(--color-primary)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Printer size={16} color={'var(--color-primary)'} />
                  Print
                </button>
              </div>

              {/* Wedding photo upload slot */}
              {!wedding.heroImage && (
                <div style={{
                  backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                  border: `1px solid var(--color-border)`,
                  padding: '32px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <Upload size={48} color={'var(--color-primary)'} style={{ margin: '0 auto 16px' }} />
                  <p style={{
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    color: 'var(--color-muted)',
                    marginBottom: '16px'
                  }}>
                    Upload your wedding photo
                  </p>
                  <button style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    Choose Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* STATS ROW */}
          <div 
            ref={statsRef}
            style={{ 
              padding: '0 32px 32px', 
              backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-background)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              opacity: statsVisible ? 1 : 0,
              transform: statsVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.6s ease'
            }}>
            {/* Days until wedding */}
            <div 
              onMouseEnter={() => setHoveredCard('days')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'days' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'days' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'days' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Days Until Wedding</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em'
              }}>{animatedDays}</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                color: 'var(--color-muted)',
                marginTop: '4px'
              }}>{formatDate(wedding.date)}</div>
            </div>

            {/* Guest count */}
            <div 
              onMouseEnter={() => setHoveredCard('guests')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'guests' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'guests' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'guests' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Guest Count</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em'
              }}>{animatedGuests}/{animatedTotalGuests}</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                color: 'var(--color-muted)',
                marginTop: '4px'
              }}>confirmed invited</div>
            </div>

            {/* Budget used */}
            <div 
              onMouseEnter={() => setHoveredCard('budget')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'budget' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'budget' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'budget' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Budget Used</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em'
              }}>{animatedBudgetUsed}%</div>
              <AnimatedProgress 
                value={stats.budgetUsed} 
                height={5}
                color={stats.budgetUsed > 80 ? 'var(--color-danger)' : stats.budgetUsed > 60 ? 'var(--color-warning)' : 'var(--color-success)'}
              />
            </div>

            {/* Vendors booked */}
            <div 
              onMouseEnter={() => setHoveredCard('vendors')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'vendors' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'vendors' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'vendors' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Vendors Booked</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '30px',
                fontWeight: 300,
                color: 'var(--color-text)',
              }}>{animatedVendors}</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                color: 'var(--color-muted)',
                marginTop: '4px'
              }}>service providers</div>
            </div>

            {/* Tasks completed */}
            <div 
              onMouseEnter={() => setHoveredCard('tasks')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'tasks' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'tasks' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'tasks' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Tasks Completed</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '30px',
                fontWeight: 300,
                color: 'var(--color-text)',
              }}>{animatedTasksCompleted}/{animatedTasksTotal}</div>
              <AnimatedProgress 
                value={stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0} 
                height={5}
                color="var(--color-success)"
              />
            </div>

            {/* Profile completion */}
            <div 
              onMouseEnter={() => setHoveredCard('profile')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: hoveredCard === 'profile' ? '1px solid var(--color-primary)' : `1px solid var(--color-border)`,
                padding: '16px 18px',
                borderRadius: '12px',
                boxShadow: hoveredCard === 'profile' ? '0 8px 24px rgba(26,86,219,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                transform: hoveredCard === 'profile' ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}>Profile Completion</div>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '30px',
                fontWeight: 300,
                color: 'var(--color-text)',
              }}>{animatedProfileCompletion}%</div>
              <AnimatedProgress 
                value={stats.profileCompletion} 
                height={5}
                color="var(--color-success)"
              />
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '16px',
            padding: '0 32px 32px',
            backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-background)'
          }}>
            {/* LEFT COLUMN - Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Next upcoming task */}
              {wedding.checklist.filter(t => !t.done).length > 0 && (
                <div style={{
                  backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                  border: `1px solid var(--color-border)`,
                  padding: '20px'
                }}>
                  <h3 style={{
                    fontFamily: 'Urbanist',
                    fontSize: '16px',
                    color: 'var(--color-text)',
                    marginBottom: '12px'
                  }}>Next Upcoming Task</h3>
                  {(() => {
                    const nextTask = wedding.checklist
                      .filter(t => !t.done)
                      .sort((a, b) => {
                        if (a.urgent && !b.urgent) return -1
                        if (!a.urgent && b.urgent) return 1
                        return a.order - b.order
                      })[0]
                    
                    return nextTask ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {nextTask.urgent && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--color-danger)',
                            borderRadius: '50%'
                          }}></div>
                        )}
                        <div>
                          <div style={{
                            fontFamily: 'Urbanist',
                            fontSize: '14px',
                            color: 'var(--color-text)',
                            marginBottom: '4px'
                          }}>{nextTask.task}</div>
                          {nextTask.dueDate && (
                            <div style={{
                              fontFamily: 'Urbanist',
                              fontSize: '11px',
                              color: 'var(--color-muted)',
                            }}>
                              Due: {formatDate(nextTask.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Weather widget */}
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px'
              }}>
                <h3 style={{
                  fontFamily: 'Urbanist',
                  fontSize: '16px',
                  color: 'var(--color-text)',
                  marginBottom: '12px'
                }}>Weather on Your Wedding Day</h3>
                {weather ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      fontSize: '32px',
                      color: 'var(--color-primary)',
                    }}>{weather.icon}</div>
                    <div>
                      <div style={{
                        fontFamily: 'Urbanist',
                        fontSize: '24px',
                        color: 'var(--color-text)',
                      }}>{weather.temperature}°C</div>
                      <div style={{
                        fontFamily: 'Urbanist',
                        fontSize: '12px',
                        color: 'var(--color-muted)',
                      }}>{weather.condition}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                  }}>
                    Weather forecast will be available closer to your wedding date
                  </div>
                )}
              </div>

              {/* Motivational quote */}
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px'
              }}>
                <h3 style={{
                  fontFamily: 'Urbanist',
                  fontSize: '16px',
                  color: 'var(--color-text)',
                  marginBottom: '12px'
                }}>Quote of the Day</h3>
                <p style={{
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  fontStyle: 'italic',
                  lineHeight: 1.5
                }}>{quote}</p>
              </div>

              {/* Recent checklist items */}
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{
                    fontFamily: 'Urbanist',
                    fontSize: '16px',
                    color: 'var(--color-text)',
                  }}>Recent Tasks</h3>
                  <button
                    onClick={() => window.location.href = '/dashboard/couple/checklist'}
                    style={{
                      fontFamily: 'Urbanist',
                      fontSize: '11px',
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    View All
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {wedding.checklist.slice(0, 5).map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div
                        onClick={() => handleToggleTask(item.id)}
                        style={{
                          width: '16px',
                          height: '16px',
                          border: item.done ? 'none' : `0.5px solid var(--color-primary)`,
                          backgroundColor: item.done ? 'var(--color-primary)' : 'transparent',
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
                            backgroundColor: '#ffffff',
                            clipPath: 'polygon(0% 50%, 30% 80%, 100% 10%, 80% 0%, 30% 60%)'
                          }}></div>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'Urbanist',
                        fontSize: '13px',
                        color: item.done ? 'var(--color-muted)' : 'var(--color-text)',
                        textDecoration: item.done ? 'line-through' : 'none'
                      }}>{item.task}</span>
                      {item.urgent && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-danger)',
                          borderRadius: '50%'
                        }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent guests */}
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{
                    fontFamily: 'Urbanist',
                    fontSize: '16px',
                    color: 'var(--color-text)',
                  }}>Recent Guests</h3>
                  <button
                    onClick={() => window.location.href = '/dashboard/couple/guests'}
                    style={{
                      fontFamily: 'Urbanist',
                      fontSize: '11px',
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Manage All
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {guests.slice(0, 3).map((guest) => (
                    <div key={guest.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontFamily: 'Urbanist',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                        }}>{guest.name}</div>
                        <div style={{
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          color: 'var(--color-muted)',
                        }}>{guest.rsvpStatus}</div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: guest.rsvpStatus === 'attending' ? 'var(--color-success)' : 
                                       guest.rsvpStatus === 'declined' ? 'var(--color-danger)' : 'var(--color-background)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 500
                      }}>
                        {guest.rsvpStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Vendor Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                border: `1px solid var(--color-border)`,
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{
                    fontFamily: 'Urbanist',
                    fontSize: '16px',
                    color: 'var(--color-text)',
                  }}>Featured Vendors</h3>
                  <button
                    onClick={() => setShowVendorPanel(!showVendorPanel)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {showVendorPanel ? <ChevronUp size={16} color={'var(--color-primary)'} /> : <ChevronDown size={16} color={'var(--color-primary)'} />}
                  </button>
                </div>

                {showVendorPanel && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Vendor filters */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <select
                        value={vendorFilter}
                        onChange={(e) => setVendorFilter(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          border: `1px solid var(--color-border)`,
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                          color: darkMode ? 'var(--color-text)' : 'var(--color-text)'
                        }}
                      >
                        <option value="all">All Categories</option>
                        <option value="photography">Photography</option>
                        <option value="catering">Catering</option>
                        <option value="decor">Decor</option>
                        <option value="music">Music</option>
                        <option value="beauty">Beauty</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          border: `1px solid var(--color-border)`,
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          backgroundColor: darkMode ? 'var(--color-primary-dark)' : 'var(--color-card)',
                          color: darkMode ? 'var(--color-text)' : 'var(--color-text)'
                        }}
                      />
                    </div>

                    {/* Vendor cards */}
                    {filteredVendors.map((vendor) => (
                      <div key={vendor.id} style={{
                        border: `1px solid var(--color-border)`,
                        padding: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleViewVendor(vendor.id)}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-primary-dark)' : 'var(--color-background)'
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{
                              fontFamily: 'Urbanist',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--color-text)',
                              marginBottom: '4px'
                            }}>{vendor.businessName}</div>
                            <div style={{
                              fontFamily: 'Urbanist',
                              fontSize: '11px',
                              color: 'var(--color-muted)',
                              marginBottom: '4px'
                            }}>{vendor.category}</div>
                            <div style={{
                              fontFamily: 'Urbanist',
                              fontSize: '11px',
                              color: 'var(--color-muted)',
                            }}>{vendor.location}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveVendor(vendor.id)
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Heart 
                              size={16} 
                              color={savedVendors.includes(vendor.id) ? 'var(--color-primary)' : 'var(--color-muted)'}
                              fill={savedVendors.includes(vendor.id) ? 'var(--color-primary)' : 'none'}
                            />
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                color={i < Math.floor((vendor.rating || 0)) ? 'var(--color-primary)' : 'var(--color-muted)'} 
                                fill={i < Math.floor((vendor.rating || 0)) ? 'var(--color-primary)' : 'none'}
                              />
                            ))}
                          </div>
                          <span style={{
                            fontFamily: 'Urbanist',
                            fontSize: '10px',
                            color: 'var(--color-muted)'
                          }}>{vendor.rating || 0} ({vendor.reviewCount || vendor.reviews || 0})</span>
                        </div>
                        
                        <div style={{
                          fontFamily: 'Urbanist',
                          fontSize: '11px',
                          color: 'var(--color-primary)',
                          marginTop: '4px'
                        }}>
                          {(vendor.pricing as any)?.currency || 'RWF'} {(vendor.pricing as any)?.min || 0} - {(vendor.pricing as any)?.max || 0}
                        </div>

                        {vendor.featured && (
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            padding: '2px 6px',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            marginTop: '4px'
                          }}>
                            Featured
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes celebrate {
          0% { 
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
      <AIChat />
    </div>
  )
}
