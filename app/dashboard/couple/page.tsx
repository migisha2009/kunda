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
    <div style={{ 
      backgroundColor: '#f0f4ff', 
      minHeight: '100vh', 
      fontFamily: 'Urbanist, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
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
            width: '32px',
            height: '32px',
            backgroundColor: '#1a56db',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Heart className="w-5 h-5 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
          </div>
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
                Wedding Dashboard
              </div>
              <h1 style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: 6,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-family-heading)',
              }}>
                {wedding.coupleName1} & {wedding.coupleName2}
              </h1>
              <p style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-family-body)',
              }}>
                {wedding.venue}
                {wedding.date && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    {formatDate(wedding.date)}
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
              <a
                href="/vendors"
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
                Browse Vendors
              </a>
              
              <a
                href="/dashboard/couple/guests"
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
                Manage Guests
              </a>
              
              <a
                href="/dashboard/couple/budget"
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
                Budget
              </a>
            </div>

          </div>

          {/* STATS ROW */}
          <div 
            ref={statsRef}
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
              gap: 16,
              padding: '20px 24px',
              animation: 'fadeInUp 0.5s ease',
            }}>
            {/* Days until wedding */}
            <div
              onMouseEnter={() => setHoveredCard('days')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--color-card)',
                borderRadius: 12,
                border: hoveredCard === 'days'
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                boxShadow: hoveredCard === 'days'
                  ? '0 8px 24px rgba(245, 166, 35, 0.25)'
                  : '0 4px 12px rgba(75, 71, 165, 0.15)',
                padding: '18px 20px',
                transform: hoveredCard === 'days'
                  ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                animation: 'fadeInUp 0.5s ease 0s both',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 4,
                background: 'var(--color-accent)',
                borderRadius: '12px 12px 0 0',
              }} />
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(245, 166, 35, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 12,
              }}>
                <Calendar size={20} color="var(--color-accent)" />
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
                {animatedDays}
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
                Days Until Wedding
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-family-body)',
              }}>
                {formatDate(wedding.date)}
              </div>
            </div>

            {/* Guest count */}
            <div
              onMouseEnter={() => setHoveredCard('guests')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--color-card)',
                borderRadius: 12,
                border: hoveredCard === 'guests'
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                boxShadow: hoveredCard === 'guests'
                  ? '0 8px 24px rgba(245, 166, 35, 0.25)'
                  : '0 4px 12px rgba(75, 71, 165, 0.15)',
                padding: '18px 20px',
                transform: hoveredCard === 'guests'
                  ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                animation: 'fadeInUp 0.5s ease 0.1s both',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 4,
                background: 'var(--color-accent)',
                borderRadius: '12px 12px 0 0',
              }} />
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(245, 166, 35, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 12,
              }}>
                <Users size={20} color="var(--color-accent)" />
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
                {animatedGuests}/{animatedTotalGuests}
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
                Guest Count
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-family-body)',
              }}>
                confirmed invited
              </div>
            </div>

            {/* Budget used */}
            <div
              onMouseEnter={() => setHoveredCard('budget')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--color-card)',
                borderRadius: 12,
                border: hoveredCard === 'budget'
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                boxShadow: hoveredCard === 'budget'
                  ? '0 8px 24px rgba(245, 166, 35, 0.25)'
                  : '0 4px 12px rgba(75, 71, 165, 0.15)',
                padding: '18px 20px',
                transform: hoveredCard === 'budget'
                  ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                animation: 'fadeInUp 0.5s ease 0.2s both',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 4,
                background: 'var(--color-accent)',
                borderRadius: '12px 12px 0 0',
              }} />
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(245, 166, 35, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 12,
              }}>
                <DollarSign size={20} color="var(--color-accent)" />
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
                {animatedBudgetUsed}%
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
                Budget Used
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 3,
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div style={{
                  height: '100%',
                  width: `${stats.budgetUsed}%`,
                  background: stats.budgetUsed > 80 ? '#EF4444' : stats.budgetUsed > 60 ? '#F59E0B' : '#10B981',
                  borderRadius: 3,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>

            {/* Vendors booked */}
            <div
              onMouseEnter={() => setHoveredCard('vendors')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--color-card)',
                borderRadius: 12,
                border: hoveredCard === 'vendors'
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                boxShadow: hoveredCard === 'vendors'
                  ? '0 8px 24px rgba(245, 166, 35, 0.25)'
                  : '0 4px 12px rgba(75, 71, 165, 0.15)',
                padding: '18px 20px',
                transform: hoveredCard === 'vendors'
                  ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.25s ease',
                animation: 'fadeInUp 0.5s ease 0.3s both',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 4,
                background: 'var(--color-accent)',
                borderRadius: '12px 12px 0 0',
              }} />
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(245, 166, 35, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 12,
              }}>
                <Star size={20} color="var(--color-accent)" />
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
                {animatedVendors}
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
                Vendors Booked
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-family-body)',
              }}>
                service providers
              </div>
            </div>
          </div>

          {/* COUNTDOWN SECTION */}
          <div style={{
            background: 'var(--color-card)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: '24px',
            margin: '0 24px 20px',
            boxShadow: '0 4px 12px rgba(75, 71, 165, 0.15)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <Clock size={24} color={'var(--color-accent)'} />
              <h3 style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: 0,
                textAlign: 'center'
              }}>Countdown to Your Special Day</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>{countdown.days}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px'
                }}>Days</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>{countdown.hours}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px'
                }}>Hours</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>{countdown.mins}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px'
                }}>Minutes</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>{countdown.secs}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px'
                }}>Seconds</div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
            gap: 16,
            padding: '0 24px 24px',
            flex: 1,
            backgroundColor: 'var(--color-background)',
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

              {/* Recent checklist items - Blue/White Design */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5edff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'Urbanist',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#111928',
                      marginBottom: '4px'
                    }}>Wedding Checklist</h3>
                    <p style={{
                      fontFamily: 'Urbanist',
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>{wedding.checklist.filter(t => t.done).length} of {wedding.checklist.length} completed</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/dashboard/couple/checklist'}
                    style={{
                      fontFamily: 'Urbanist',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1a56db',
                      textTransform: 'uppercase',
                      backgroundColor: 'transparent',
                      border: '1px solid #1a56db',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#1a56db'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#1a56db'
                    }}
                  >
                    View All
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5edff',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: `${(wedding.checklist.filter(t => t.done).length / wedding.checklist.length) * 100}%`,
                    height: '100%',
                    backgroundColor: '#1a56db',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {wedding.checklist.slice(0, 5).map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: item.done ? '#f0f4ff' : '#ffffff',
                      border: `1px solid ${item.done ? '#1a56db' : '#e5edff'}`,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                      onClick={() => handleToggleTask(item.id)}
                      onMouseEnter={e => {
                        if (!item.done) {
                          e.currentTarget.style.backgroundColor = '#f8faff'
                          e.currentTarget.style.borderColor = '#1a56db'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!item.done) {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                          e.currentTarget.style.borderColor = '#e5edff'
                        }
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: item.done ? 'none' : `2px solid #e5edff`,
                        backgroundColor: item.done ? '#1a56db' : '#ffffff',
                        borderRadius: '6px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {item.done && (
                          <div style={{
                            width: '6px',
                            height: '10px',
                            backgroundColor: '#ffffff',
                            clipPath: 'polygon(0% 50%, 30% 80%, 100% 10%, 80% 0%, 30% 60%)'
                          }}></div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Urbanist',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: item.done ? '#6b7280' : '#111928',
                          textDecoration: item.done ? 'line-through' : 'none',
                          marginBottom: '2px'
                        }}>{item.task}</div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            fontFamily: 'Urbanist',
                            fontSize: '11px',
                            color: '#9ca3af',
                            textTransform: 'capitalize'
                          }}>{item.category}</span>
                          {item.urgent && (
                            <span style={{
                              fontFamily: 'Urbanist',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#c2410c',
                              backgroundColor: '#fff7ed',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>Urgent</span>
                          )}
                        </div>
                      </div>
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
    </div>
  )
}
