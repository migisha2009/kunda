'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Plus, X, Edit2, Trash2, Calendar, DollarSign, TrendingUp, 
  TrendingDown, Filter, Download, CreditCard, Wallet,
  AlertCircle, CheckCircle, PieChart as PieChartIcon
} from 'lucide-react'
import { Wedding, Expense } from '../../../../types'
import AIChat from '../../../../components/AIChat'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

// Color definitions
const colors = {
  bg: '#f0f4ff',
  bgCard: '#ffffff',
  border: '#e5edff',
  primary: '#1a56db',
  primaryDark: '#0f2460',
  textPrimary: '#111928',
  textSecondary: '#6b7280',
  success: '#057a55',
  warning: '#c27803',
  danger: '#c81e1e'
}

const categoryColors: Record<string, string> = {
  venue: '#8b5cf6',
  catering: '#f59e0b',
  decor: '#ec4899',
  fashion: '#ef4444',
  beauty: '#06b6d4',
  music: '#10b981',
  transport: '#6366f1',
  photography: '#f97316',
  other: '#6b7280'
}

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: 'â' },
  { code: 'GBP', symbol: 'Â£' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' }
]

export default function BudgetTracker() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [showPaid, setShowPaid] = useState(true)
  const [autoBooking, setAutoBooking] = useState(true)
  
  // New expense form
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: 'other' as Expense['category'],
    amount: '',
    paid: false,
    date: '',
    vendor: '',
    notes: '',
    isBooking: false
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
        const weddingData = {
          id: weddingSnapshot.id,
          createdAt: null,
          ...weddingSnapshot.data()
        } as unknown as Wedding
        setWedding(weddingData)
      }
    } catch (error) {
      console.error('Error loading wedding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!wedding || !newExpense.description.trim() || !newExpense.amount) return
    
    const expenseItem: Expense = {
      id: Date.now().toString(),
      name: newExpense.description.trim(),
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      paid: newExpense.paid,
      date: newExpense.date ? new Date(newExpense.date) : new Date(),
      vendorId: newExpense.vendor.trim() || undefined,
      notes: newExpense.notes.trim() || undefined,
    }
    
    try {
      // Use budgetExpenses if it exists, otherwise use expenses
      const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
      const updatedExpenses = [...currentExpenses, expenseItem]
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses, 
        budget: { ...wedding.budget, spent: totalSpent } 
      })
      setNewExpense({ description: '', category: 'other', amount: '', paid: false, date: '', vendor: '', notes: '', isBooking: false })
      setShowAddExpense(false)
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleEditExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!wedding) return
    
    try {
      const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
      const updatedExpenses = currentExpenses.map(item =>
        item.id === expenseId ? { ...item, ...updates } : item
      )
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses, 
        budget: { ...wedding.budget, spent: totalSpent } 
      })
      setEditingExpense(null)
    } catch (error) {
      console.error('Error editing expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!wedding) return
    
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
      const updatedExpenses = currentExpenses.filter(item => item.id !== expenseId)
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses, 
        budget: { ...wedding.budget, spent: totalSpent } 
      })
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleTogglePaid = async (expenseId: string) => {
    if (!wedding) return
    
    const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
    const expense = currentExpenses.find(item => item.id === expenseId)
    if (!expense) return
    
    try {
      const updatedExpenses = currentExpenses.map(item =>
        item.id === expenseId ? { ...item, paid: !item.paid } : item
      )
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        budgetExpenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ 
        ...wedding, 
        budgetExpenses: updatedExpenses, 
        budget: { ...wedding.budget, spent: totalSpent } 
      })
    } catch (error) {
      console.error('Error updating expense status:', error)
    }
  }

  const handleUpdateBudget = async (newTotal: number, newCurrency: string) => {
    if (!wedding) return
    
    try {
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        budget: { ...wedding.budget, total: newTotal, currency: newCurrency }
      })
      
      setWedding({ ...wedding, budget: { ...wedding.budget, total: newTotal, currency: newCurrency } })
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  const exportBudget = () => {
    if (!wedding) return
    
    const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
    const csv = 'Description,Category,Amount,Status,Date,Vendor,Notes\n' +
      currentExpenses.map(expense => 
        `"${expense.name}","${expense.category}","${expense.amount}","${expense.paid ? 'Paid' : 'Unpaid'}","${formatDate(expense.date)}","${expense.vendorId || ''}","${expense.notes || ''}"`
      ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-budget.csv'
    a.click()
  }

  const getFilteredAndSortedExpenses = () => {
    if (!wedding) return []
    
    const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
    let filtered = currentExpenses.filter(expense => {
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'paid' && expense.paid) || 
                           (filterStatus === 'unpaid' && !expense.paid)
      const matchesVisibility = showPaid || !expense.paid
      return matchesCategory && matchesStatus && matchesVisibility
    })

    // Sort expenses
    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'amount') return b.amount - a.amount
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return 0
    })

    return filtered
  }

  const getCategoryBreakdown = () => {
    if (!wedding) return []
    
    const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
    const breakdown: Record<string, number> = {}
    currentExpenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount
    })
    
    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: wedding.budget.total > 0 ? (amount / wedding.budget.total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount)
  }

  const getBudgetStats = () => {
    if (!wedding) return { total: 0, spent: 0, remaining: 0, paid: 0, unpaid: 0 }
    
    const currentExpenses = wedding.budgetExpenses || wedding.expenses || []
    const paid = currentExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0)
    const unpaid = currentExpenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0)
    const remaining = wedding.budget.total - wedding.budget.spent
    
    return {
      total: wedding.budget.total,
      spent: wedding.budget.spent,
      remaining,
      paid,
      unpaid
    }
  }

  const stats = getBudgetStats()
  const filteredExpenses = getFilteredAndSortedExpenses()
  const categoryBreakdown = getCategoryBreakdown()

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
          borderTop: `3px solid ${colors.primary}`,
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
    <div className="min-h-screen" style={{ 
      backgroundColor: 'var(--color-background)', 
      fontFamily: 'var(--font-family)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Hero Section Header */}
      <section className="hero-section" style={{ 
        minHeight: '200px',
        padding: '60px 64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background rings */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-24 h-24 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-20 right-32 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: '#ffffff',
                margin: 0,
                marginBottom: '8px'
              }}>Budget Tracker</h1>
              <p style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-lg)',
                color: 'rgba(255,255,255,0.75)',
                margin: 0
              }}>Track and manage your wedding expenses</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={exportBudget}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Overview Section */}
      <section className="page-wrapper" style={{ backgroundColor: 'white', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-family)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-text)' }}>
            Budget Overview
          </h2>
          
          {/* Budget Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="card">
              <div style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: 'var(--color-primary-dark)',
                marginBottom: '8px'
              }}>{wedding?.budget?.currency || 'USD'} {stats.total.toLocaleString()}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)'
              }}>Total Budget</div>
            </div>
            <div className="card">
              <div style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: 'var(--color-primary-dark)',
                marginBottom: '8px'
              }}>{wedding?.budget?.currency || 'USD'} {stats.spent.toLocaleString()}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)'
              }}>Spent</div>
            </div>
            <div className="card">
              <div style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: stats.remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                marginBottom: '8px'
              }}>{wedding?.budget?.currency || 'USD'} {Math.abs(stats.remaining).toLocaleString()}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)'
              }}>{stats.remaining >= 0 ? 'Remaining' : 'Over Budget'}</div>
            </div>
            <div className="card">
              <div style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: 'var(--color-success)',
                marginBottom: '8px'
              }}>{wedding?.budget?.currency || 'USD'} {stats.paid.toLocaleString()}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)'
              }}>Paid</div>
            </div>
            <div className="card">
              <div style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-black)',
                color: 'var(--color-warning)',
                marginBottom: '8px'
              }}>{wedding?.budget?.currency || 'USD'} {stats.unpaid.toLocaleString()}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)'
              }}>Unpaid</div>
            </div>
          </div>

          {/* Budget Settings */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              marginBottom: '16px'
            }}>Budget Settings</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)', fontWeight: 'var(--font-weight-medium)' }}>Total Budget:</label>
                <input
                  type="number"
                  value={wedding?.budget?.total || 0}
                  onChange={(e) => handleUpdateBudget(parseFloat(e.target.value) || 0, wedding?.budget?.currency || 'USD')}
                  className="form-input"
                  style={{ width: '120px' }}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)', fontWeight: 'var(--font-weight-medium)' }}>Currency:</label>
                <select
                  value={wedding?.budget?.currency || 'USD'}
                  onChange={(e) => handleUpdateBudget(wedding?.budget?.total || 0, e.target.value)}
                  className="form-select"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2" style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                <input
                  type="checkbox"
                  checked={autoBooking}
                  onChange={(e) => setAutoBooking(e.target.checked)}
                  className="form-checkbox"
                />
                Auto-booking amounts
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Breakdown Section */}
      <section className="page-wrapper" style={{ backgroundColor: 'var(--color-background)', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-family)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-text)' }}>
            Budget Breakdown
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Progress Bar Section */}
            <div className="card">
              <h3 style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                marginBottom: '16px'
              }}>Budget Progress</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Urbanist', fontSize: '14px', color: '#6b7280' }}>Total Budget</span>
                <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
                  {wedding?.budget?.currency || 'USD'} {stats.total.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>Total Spent</span>
                <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
                  {wedding?.budget?.currency || 'USD'} {stats.spent.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>Progress</span>
                <span style={{ 
                  fontFamily: 'var(--font-family)', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: 'var(--font-weight-black)', 
                  color: stats.remaining >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' 
                }}>
                  {Math.round((stats.spent / stats.total) * 100)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '50px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((stats.spent / stats.total) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: stats.remaining >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                  borderRadius: '50px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{ 
                marginTop: '8px',
                fontFamily: 'var(--font-family)', 
                fontSize: 'var(--font-size-xs)', 
                color: stats.remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {stats.remaining >= 0 
                  ? `You have ${wedding?.budget?.currency || 'USD'} ${Math.abs(stats.remaining).toLocaleString()} remaining`
                  : `You are ${wedding?.budget?.currency || 'USD'} ${Math.abs(stats.remaining).toLocaleString()} over budget`
                }
              </div>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="card">
            <h3 style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              marginBottom: '16px'
            }}>Spending by Category</h3>
            
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown.map(item => ({
                      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
                      value: item.amount
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        'var(--color-primary)', 'var(--color-primary-light)', 'var(--color-primary-dark)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-muted)'
                      ][index % 7]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value ? [`${wedding?.budget?.currency} ${value.toLocaleString()}`, 'Amount'] : ['', 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--color-muted)'
              }}>
                <Wallet size={48} style={{ marginBottom: '16px', color: 'var(--color-muted)' }} />
                <p style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-sm)', textAlign: 'center', color: 'var(--color-muted)' }}>
                  No expenses yet. Add your first expense to see the breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

      {/* Expenses Section */}
      <section className="page-wrapper" style={{ backgroundColor: 'white', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-family)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-text)' }}>
            Expense Management
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
            {/* Main Expenses List */}
            <div>
              {/* Filters */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Categories</option>
                      <option value="venue">Venue</option>
                      <option value="catering">Catering</option>
                      <option value="decor">Decor</option>
                      <option value="fashion">Fashion</option>
                      <option value="beauty">Beauty</option>
                      <option value="music">Music</option>
                      <option value="transport">Transport</option>
                      <option value="photography">Photography</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                      <option value="category">Sort by Category</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-xs)' }}>
                    <input
                      type="checkbox"
                      checked={showPaid}
                      onChange={(e) => setShowPaid(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Show paid expenses
                  </label>
                </div>
              </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Wallet size={48} style={{ marginBottom: '16px', color: 'var(--color-muted)' }} />
              <h3 style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>No expenses found</h3>
              <p style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-muted)'
              }}>
                {filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your filters or add your first expense.'
                  : 'Add your first expense to start tracking your wedding budget.'
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredExpenses.map((expense) => {
                const isEditing = editingExpense === expense.id
                
                return (
                  <div key={expense.id} className="card" style={{
                    opacity: !showPaid && expense.paid ? 0.5 : 1
                  }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <input
                            type="text"
                            defaultValue={expense.name}
                            onBlur={(e) => handleEditExpense(expense.id, { name: e.target.value })}
                            className="form-input"
                          />
                          <input
                            type="number"
                            defaultValue={expense.amount}
                            onBlur={(e) => handleEditExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="form-input"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            defaultValue={expense.category}
                            onChange={(e) => handleEditExpense(expense.id, { category: e.target.value as any })}
                            className="form-select"
                          >
                            <option value="venue">Venue</option>
                            <option value="catering">Catering</option>
                            <option value="decor">Decor</option>
                            <option value="fashion">Fashion</option>
                            <option value="beauty">Beauty</option>
                            <option value="music">Music</option>
                            <option value="transport">Transport</option>
                            <option value="photography">Photography</option>
                            <option value="other">Other</option>
                          </select>
                          <select
                            defaultValue={expense.paid ? 'paid' : 'unpaid'}
                            onChange={(e) => handleEditExpense(expense.id, { paid: e.target.value === 'paid' })}
                            className="form-select"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                          <button
                            onClick={() => setEditingExpense(null)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              fontFamily: 'var(--font-family)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text)'
                            }}>{expense.name}</span>
                            <span className="px-2 py-1 text-xs rounded" style={{
                              backgroundColor: categoryColors[expense.category] + '20',
                              color: categoryColors[expense.category]
                            }}>
                              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                            </span>
                            {expense.paid && (
                              <span className="px-2 py-1 text-xs rounded" style={{
                                backgroundColor: 'var(--color-success-bg)',
                                color: 'var(--color-success)'
                              }}>
                                Paid
                            </span>
                            )}
                            {expense.vendorId && (
                              <span style={{
                                fontSize: '11px',
                                color: colors.textSecondary
                              }}>
                                {expense.vendorId}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontFamily: 'Urbanist',
                            fontSize: '18px',
                            fontWeight: 300,
                            color: colors.textPrimary
                          }}>
                            {wedding?.budget?.currency || 'USD'} {expense.amount.toLocaleString()}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: expense.paid ? colors.success : colors.danger,
                            fontWeight: 500
                          }}>
                            {expense.paid ? 'Paid' : 'Unpaid'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setEditingExpense(expense.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Edit2 size={16} color={colors.textSecondary} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={16} color={colors.textSecondary} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Category Breakdown */}
              <div className="card">
                <h3 style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <PieChartIcon size={18} />
                  Category Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryBreakdown.map(({ category, amount, percentage }) => (
                    <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: categoryColors[category],
                        borderRadius: '50%'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text)',
                            textTransform: 'capitalize'
                          }}>
                            {category}
                          </span>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text)',
                            fontWeight: 'var(--font-weight-medium)'
                          }}>
                            {wedding?.budget?.currency || 'USD'} {amount.toLocaleString()}
                          </span>
                        </div>
                        <div style={{
                          height: '4px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '2px',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: categoryColors[category],
                            width: `${Math.min(percentage, 100)}%`,
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text)',
                  marginBottom: '16px'
                }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="btn-primary"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    Add Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Component */}
      <AIChat />
      {dashFooter}
    </div>
  )
}
