'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Plus, X, Edit2, Trash2, Calendar, DollarSign, TrendingUp, 
  TrendingDown, Filter, Download, PieChart, CreditCard, Wallet,
  AlertCircle, CheckCircle
} from 'lucide-react'
import { Wedding, Expense } from '../../../../types'

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

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
        setWedding(weddingSnapshot.data() as Wedding)
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
      const updatedExpenses = [...wedding.expenses, expenseItem]
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        expenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ ...wedding, expenses: updatedExpenses, budget: { ...wedding.budget, spent: totalSpent } })
      setNewExpense({ description: '', category: 'other', amount: '', paid: false, date: '', vendor: '', notes: '', isBooking: false })
      setShowAddExpense(false)
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleEditExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!wedding) return
    
    try {
      const updatedExpenses = wedding.expenses.map(item =>
        item.id === expenseId ? { ...item, ...updates } : item
      )
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        expenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ ...wedding, expenses: updatedExpenses, budget: { ...wedding.budget, spent: totalSpent } })
      setEditingExpense(null)
    } catch (error) {
      console.error('Error editing expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!wedding) return
    
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const updatedExpenses = wedding.expenses.filter(item => item.id !== expenseId)
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        expenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ ...wedding, expenses: updatedExpenses, budget: { ...wedding.budget, spent: totalSpent } })
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleTogglePaid = async (expenseId: string) => {
    if (!wedding) return
    
    const expense = wedding.expenses.find(item => item.id === expenseId)
    if (!expense) return
    
    try {
      const updatedExpenses = wedding.expenses.map(item =>
        item.id === expenseId ? { ...item, paid: !item.paid } : item
      )
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await updateDoc(doc(db, 'weddings', user!.uid), { 
        expenses: updatedExpenses,
        budget: { ...wedding.budget, spent: totalSpent }
      })
      
      setWedding({ ...wedding, expenses: updatedExpenses, budget: { ...wedding.budget, spent: totalSpent } })
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
    
    const csv = 'Description,Category,Amount,Status,Date,Vendor,Notes\n' +
      wedding.expenses.map(expense => 
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
    
    let filtered = wedding.expenses.filter(expense => {
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
    
    const breakdown: Record<string, number> = {}
    wedding.expenses.forEach(expense => {
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
    
    const paid = wedding.expenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0)
    const unpaid = wedding.expenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0)
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
            }}>Budget Tracker</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Manage your wedding budget and expenses
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportBudget}
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
              onClick={() => setShowAddExpense(true)}
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
              Add Expense
            </button>
          </div>
        </div>

        {/* Budget Overview Cards */}
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.total.toLocaleString()}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: muted,
              marginTop: '4px'
            }}>Total Budget</div>
          </div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.spent.toLocaleString()}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: muted,
              marginTop: '4px'
            }}>Spent</div>
          </div>
          <div style={{
            backgroundColor: stats.remaining >= 0 ? '#dcfce7' : '#fee2e2',
            border: `0.5px solid ${stats.remaining >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '28px',
              fontWeight: 300,
              color: stats.remaining >= 0 ? '#16a34a' : '#dc2626'
            }}>{wedding?.budget?.currency || 'USD'} {Math.abs(stats.remaining).toLocaleString()}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: stats.remaining >= 0 ? '#16a34a' : '#dc2626',
              marginTop: '4px'
            }}>{stats.remaining >= 0 ? 'Remaining' : 'Over Budget'}</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.paid.toLocaleString()}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#16a34a',
              marginTop: '4px'
            }}>Paid</div>
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
            }}>{wedding?.budget?.currency || 'USD'} {stats.unpaid.toLocaleString()}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#d97706',
              marginTop: '4px'
            }}>Unpaid</div>
          </div>
        </div>

        {/* Budget Settings */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontFamily: 'Jost', fontSize: '12px', color: muted }}>Total Budget:</label>
            <input
              type="number"
              value={wedding?.budget?.total || 0}
              onChange={(e) => handleUpdateBudget(parseFloat(e.target.value) || 0, wedding?.budget?.currency || 'USD')}
              style={{
                padding: '4px 8px',
                border: '0.5px solid rgba(180,140,90,0.3)',
                fontFamily: 'Jost',
                fontSize: '12px',
                backgroundColor: 'white',
                color: brown,
                width: '100px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontFamily: 'Jost', fontSize: '12px', color: muted }}>Currency:</label>
            <select
              value={wedding?.budget?.currency || 'USD'}
              onChange={(e) => handleUpdateBudget(wedding?.budget?.total || 0, e.target.value)}
              style={{
                padding: '4px 8px',
                border: '0.5px solid rgba(180,140,90,0.3)',
                fontFamily: 'Jost',
                fontSize: '12px',
                backgroundColor: 'white',
                color: brown
              }}
            >
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Jost', fontSize: '12px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', padding: '32px' }}>
        {/* Main Expenses List */}
        <div>
          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    color: brown
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    color: brown
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
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    color: brown
                  }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Jost', fontSize: '12px' }}>
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
              backgroundColor: 'white',
              border: '0.5px solid rgba(180,140,90,0.2)',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                color: muted,
                marginBottom: '16px'
              }}> <Wallet size={48} /> </div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '20px',
                color: brown,
                marginBottom: '8px'
              }}>No expenses found</h3>
              <p style={{
                fontFamily: 'Jost',
                fontSize: '14px',
                color: muted
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
                    backgroundColor: 'white',
                    border: '0.5px solid rgba(180,140,90,0.2)',
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
                              border: '0.5px solid rgba(180,140,90,0.3)',
                              fontFamily: 'Jost',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              color: brown
                            }}
                          />
                          <input
                            type="number"
                            defaultValue={expense.amount}
                            onBlur={(e) => handleEditExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            style={{
                              padding: '8px',
                              border: '0.5px solid rgba(180,140,90,0.3)',
                              fontFamily: 'Jost',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              color: brown
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            defaultValue={expense.category}
                            onChange={(e) => handleEditExpense(expense.id, { category: e.target.value as any })}
                            style={{
                              padding: '6px',
                              border: '0.5px solid rgba(180,140,90,0.3)',
                              fontFamily: 'Jost',
                              fontSize: '12px',
                              backgroundColor: 'white',
                              color: brown
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
                              border: '0.5px solid rgba(180,140,90,0.3)',
                              fontFamily: 'Jost',
                              fontSize: '12px',
                              backgroundColor: 'white',
                              color: brown
                            }}
                          />
                          <button
                            onClick={() => setEditingExpense(null)}
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
                            border: expense.paid ? 'none' : `0.5px solid ${gold}`,
                            backgroundColor: expense.paid ? '#16a34a' : 'transparent',
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
                              fontFamily: 'Jost',
                              fontSize: '15px',
                              fontWeight: 500,
                              color: brown
                            }}>
                              {expense.name}
                            </span>
                            {expense.isBooking && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                backgroundColor: '#dbeafe',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: '#2563eb'
                              }}>
                                <CreditCard size={10} />
                                Booking
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '11px',
                              color: muted,
                              textTransform: 'capitalize'
                            }}>
                              {expense.category}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: muted,
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
                                color: muted
                              }}>
                                {expense.vendorId}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontFamily: 'Cormorant Garamond',
                            fontSize: '18px',
                            fontWeight: 300,
                            color: brown
                          }}>
                            {wedding?.budget?.currency || 'USD'} {expense.amount.toLocaleString()}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: expense.paid ? '#16a34a' : '#d97706',
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
                            <Edit2 size={16} color={muted} />
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
                            <Trash2 size={16} color={muted} />
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
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '18px',
              color: brown,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <PieChart size={18} />
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
                        color: brown,
                        textTransform: 'capitalize'
                      }}>
                        {category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: brown,
                        fontWeight: 500
                      }}>
                        {wedding?.budget?.currency || 'USD'} {amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      backgroundColor: '#f0e4d0',
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
            backgroundColor: 'white',
            border: '0.5px solid rgba(180,140,90,0.2)',
            padding: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '18px',
              color: brown,
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
                fontFamily: 'Cormorant Garamond',
                fontSize: '32px',
                fontWeight: 300,
                color: brown
              }}>
                {(wedding?.budget?.total || 0) > 0 ? Math.round((stats.spent / stats.total) * 100) : 0}%
              </div>
              <div style={{
                fontSize: '12px',
                color: muted
              }}>
                of budget spent
              </div>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#f0e4d0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: stats.remaining >= 0 ? gold : '#dc2626',
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
              }}>Add New Expense</h2>
              <button
                onClick={() => setShowAddExpense(false)}
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
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
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
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
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
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  style={{
                    padding: '12px',
                    border: '0.5px solid rgba(180,140,90,0.3)',
                    fontFamily: 'Jost',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: brown
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
                placeholder="Vendor (optional)"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                style={{
                  padding: '12px',
                  border: '0.5px solid rgba(180,140,90,0.3)',
                  fontFamily: 'Jost',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: brown
                }}
              />

              <textarea
                placeholder="Notes (optional)"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
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

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Jost', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newExpense.paid}
                    onChange={(e) => setNewExpense({ ...newExpense, paid: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Mark as paid
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Jost', fontSize: '14px' }}>
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
                  onClick={handleAddExpense}
                  disabled={!newExpense.description.trim() || !newExpense.amount}
                  style={{
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
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
    </div>
  )
}
