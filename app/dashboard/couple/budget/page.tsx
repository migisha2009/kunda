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

  return (
    <div style={{ backgroundColor: '#f0f4ff', color: '#111928', minHeight: '100vh', fontFamily: 'Urbanist, sans-serif' }}>

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
            }}>Budget Tracker</h1>
            <p style={{
              fontFamily: 'Urbanist',
              fontSize: '15px',
              color: '#6b7280',
              fontWeight: 400
            }}>
              Manage your wedding budget and expenses
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportBudget}
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
              onClick={() => setShowAddExpense(true)}
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
              Add Expense
            </button>
          </div>
        </div>

        {/* Budget Overview Cards */}
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.total.toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Total Budget</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.spent.toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Spent</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {Math.abs(stats.remaining).toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>{stats.remaining >= 0 ? 'Remaining' : 'Over Budget'}</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.paid.toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Paid</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.unpaid.toLocaleString()}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginTop: '4px'
            }}>Unpaid</div>
          </div>
        </div>

        {/* Budget Settings */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Total Budget:</label>
            <input
              type="number"
              value={wedding?.budget?.total || 0}
              onChange={(e) => handleUpdateBudget(parseFloat(e.target.value) || 0, wedding?.budget?.currency || 'USD')}
              style={{
                padding: '10px 14px',
                border: '1px solid #e5edff',
                borderRadius: '8px',
                fontFamily: 'Urbanist',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                color: '#111928',
                width: '120px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Currency:</label>
            <select
              value={wedding?.budget?.currency || 'USD'}
              onChange={(e) => handleUpdateBudget(wedding?.budget?.total || 0, e.target.value)}
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
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={autoBooking}
              onChange={(e) => setAutoBooking(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-booking amounts
          </label>
        </div>
      </div>

      {/* Budget Breakdown Chart */}
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Progress Bar Section */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f2460',
              marginBottom: '16px'
            }}>Budget Progress</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Urbanist', fontSize: '14px', color: '#6b7280' }}>Total Budget</span>
                <span style={{ fontFamily: 'Urbanist', fontSize: '16px', fontWeight: 600, color: '#0f2460' }}>
                  {wedding?.budget?.currency || 'USD'} {stats.total.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Urbanist', fontSize: '14px', color: '#6b7280' }}>Total Spent</span>
                <span style={{ fontFamily: 'Urbanist', fontSize: '16px', fontWeight: 600, color: '#0f2460' }}>
                  {wedding?.budget?.currency || 'USD'} {stats.spent.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Urbanist', fontSize: '12px', color: '#6b7280' }}>Progress</span>
                <span style={{ 
                  fontFamily: 'Urbanist', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  color: stats.remaining >= 0 ? '#1a56db' : '#c81e1e' 
                }}>
                  {Math.round((stats.spent / stats.total) * 100)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: '#e5edff',
                borderRadius: '50px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((stats.spent / stats.total) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: stats.remaining >= 0 ? '#1a56db' : '#c81e1e',
                  borderRadius: '50px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{ 
                marginTop: '8px',
                fontFamily: 'Urbanist', 
                fontSize: '11px', 
                color: stats.remaining >= 0 ? '#057a55' : '#c81e1e',
                fontWeight: 500
              }}>
                {stats.remaining >= 0 
                  ? `You have ${wedding?.budget?.currency || 'USD'} ${Math.abs(stats.remaining).toLocaleString()} remaining`
                  : `You are ${wedding?.budget?.currency || 'USD'} ${Math.abs(stats.remaining).toLocaleString()} over budget`
                }
              </div>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5edff',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f2460',
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
                        '#1a56db', '#3f83f8', '#0f2460', '#1e3a8a', '#ebf5ff', '#6b7280', '#e5edff'
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
                color: '#6b7280'
              }}>
                <Wallet size={48} style={{ marginBottom: '16px' }} />
                <p style={{ fontFamily: 'Urbanist', fontSize: '14px', textAlign: 'center' }}>
                  No expenses yet. Add your first expense to see the breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', padding: '0 32px 32px' }}>
        {/* Main Expenses List */}
        <div>
          {/* Filters */}
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
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
                  style={{
                    padding: '6px 12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Urbanist', fontSize: '12px' }}>
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
              }}> <Wallet size={48} /> </div>
              <h3 style={{
                fontFamily: 'Urbanist',
                fontSize: '20px',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>No expenses found</h3>
              <p style={{
                fontFamily: 'Urbanist',
                fontSize: '14px',
                color: colors.textSecondary
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
                  <div key={expense.id} style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    padding: '16px',
                    opacity: !showPaid && expense.paid ? 0.5 : 1
                  }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <input
                            type="text"
                            defaultValue={expense.name}
                            onBlur={(e) => handleEditExpense(expense.id, { name: e.target.value })}
                            style={{
                              padding: '8px',
                              border: '1px solid ' + colors.border,
                              fontFamily: 'Urbanist',
                              fontSize: '14px',
                              backgroundColor: colors.bgCard,
                              color: colors.textPrimary
                            }}
                          />
                          <input
                            type="number"
                            defaultValue={expense.amount}
                            onBlur={(e) => handleEditExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            style={{
                              padding: '8px',
                              border: '1px solid ' + colors.border,
                              fontFamily: 'Urbanist',
                              fontSize: '14px',
                              backgroundColor: colors.bgCard,
                              color: colors.textPrimary
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            defaultValue={expense.category}
                            onChange={(e) => handleEditExpense(expense.id, { category: e.target.value as any })}
                            style={{
                              padding: '6px',
                              border: '1px solid ' + colors.border,
                              fontFamily: 'Urbanist',
                              fontSize: '12px',
                              backgroundColor: colors.bgCard,
                              color: colors.textPrimary
                            }}
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
                          <input
                            type="date"
                            defaultValue={new Date(expense.date).toISOString().split('T')[0]}
                            onChange={(e) => handleEditExpense(expense.id, { date: new Date(e.target.value) })}
                            style={{
                              padding: '6px',
                              border: '1px solid ' + colors.border,
                              fontFamily: 'Urbanist',
                              fontSize: '12px',
                              backgroundColor: colors.bgCard,
                              color: colors.textPrimary
                            }}
                          />
                          <button
                            onClick={() => setEditingExpense(null)}
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
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Status Icon */}
                        <div
                          onClick={() => handleTogglePaid(expense.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            border: expense.paid ? 'none' : `0.5px solid ${colors.warning}`,
                            backgroundColor: expense.paid ? colors.success : 'transparent',
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {expense.paid && (
                            <CheckCircle size={14} color="white" />
                          )}
                        </div>

                        {/* Category Color */}
                        <div style={{
                          width: '4px',
                          height: '40px',
                          backgroundColor: categoryColors[expense.category],
                          flexShrink: 0
                        }}></div>

                        {/* Expense Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              fontFamily: 'Urbanist',
                              fontSize: '15px',
                              fontWeight: 500,
                              color: colors.textPrimary
                            }}>
                              {expense.name}
                            </span>
                            {expense.isBooking && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                backgroundColor: colors.warning,
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: colors.textPrimary
                              }}>
                                <CreditCard size={10} />
                                Booking
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '11px',
                              color: colors.textSecondary,
                              textTransform: 'capitalize'
                            }}>
                              {expense.category}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: colors.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Calendar size={12} />
                              {formatDate(expense.date)}
                            </span>
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
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '18px',
              color: colors.textPrimary,
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
                        fontSize: '12px',
                        color: colors.textPrimary,
                        textTransform: 'capitalize'
                      }}>
                        {category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: colors.textPrimary,
                        fontWeight: 500
                      }}>
                        {wedding?.budget?.currency || 'USD'} {amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      backgroundColor: colors.bg,
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

          {/* Budget Progress */}
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Urbanist',
              fontSize: '18px',
              color: colors.textPrimary,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={18} />
              Budget Progress
            </h3>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                fontFamily: 'Urbanist',
                fontSize: '32px',
                fontWeight: 300,
                color: colors.textPrimary
              }}>
                {(wedding?.budget?.total || 0) > 0 ? Math.round((stats.spent / stats.total) * 100) : 0}%
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                of budget spent
              </div>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: colors.bg,
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: stats.remaining >= 0 ? colors.success : colors.danger,
                width: `${Math.min((wedding?.budget?.total || 0) > 0 ? (stats.spent / stats.total) * 100 : 0, 100)}%`,
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
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
              }}>Add New Expense</h2>
              <button
                onClick={() => setShowAddExpense(false)}
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
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  style={{
                    padding: '12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
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

                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid ' + colors.border,
                    fontFamily: 'Urbanist',
                    fontSize: '14px',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Vendor (optional)"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                style={{
                  padding: '12px',
                  border: '1px solid ' + colors.border,
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary
                }}
              />

              <textarea
                placeholder="Notes (optional)"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                rows={3}
                style={{
                  padding: '12px',
                  border: '1px solid ' + colors.border,
                  fontFamily: 'Urbanist',
                  fontSize: '14px',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Urbanist', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newExpense.paid}
                    onChange={(e) => setNewExpense({ ...newExpense, paid: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Mark as paid
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Urbanist', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newExpense.isBooking}
                    onChange={(e) => setNewExpense({ ...newExpense, isBooking: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Booking expense
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddExpense(false)}
                  style={{
                    border: `1px solid ${colors.primary}`,
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
                  onClick={handleAddExpense}
                  disabled={!newExpense.description.trim() || !newExpense.amount}
                  style={{
                    backgroundColor: colors.primaryDark,
                    color: colors.bg,
                    padding: '10px 20px',
                    fontFamily: 'Urbanist',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: (!newExpense.description.trim() || !newExpense.amount) ? 'not-allowed' : 'pointer',
                    opacity: (!newExpense.description.trim() || !newExpense.amount) ? 0.7 : 1
                  }}
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AIChat />
    </div>
  )
}
