'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { useRequireAuth } from '../../../../hooks/useRequireAuth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { formatDate } from '../../../../lib/dateUtils'
import { 
  Plus, X, Edit2, Trash2, Calendar, Clock, AlertCircle, 
  ChevronDown, ChevronUp, Filter, Download, CheckSquare,
  Flower, Music, Camera, Car, Cake, Palette, Heart, Gift, MapPin, Sparkles
} from 'lucide-react'
import { Wedding, ChecklistItem } from '../../../../types'

// Color variables
const gold = '#b08850'
const goldDark = '#7a5c30'
const cream = '#fdf9f5'
const brown = '#3a2a1a'
const muted = '#9a7850'

const categoryIcons: Record<string, any> = {
  venue: MapPin,
  catering: Cake,
  decor: Flower,
  fashion: Heart,
  beauty: Palette,
  music: Music,
  transport: Car,
  other: Gift
}

const categoryColors: Record<string, string> = {
  venue: '#8b5cf6',
  catering: '#f59e0b',
  decor: '#ec4899',
  fashion: '#ef4444',
  beauty: '#06b6d4',
  music: '#10b981',
  transport: '#6366f1',
  other: '#6b7280'
}

export default function WeddingChecklist() {
  const { loading: authLoading } = useRequireAuth('couple')
  const { user } = useAuth()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [sortBy, setSortBy] = useState<'order' | 'dueDate' | 'category'>('order')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending'>('all')
  
  // New task form
  const [newTask, setNewTask] = useState({
    task: '',
    category: 'other' as ChecklistItem['category'],
    dueDate: '',
    notes: '',
    urgent: false
  })
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleToggleTask = async (taskId: string) => {
    if (!wedding) return
    
    const updatedChecklist = wedding.checklist.map(item =>
      item.id === taskId ? { ...item, done: !item.done } : item
    )
    
    try {
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      
      // Celebration animation for completed tasks
      const completedTask = updatedChecklist.find(item => item.id === taskId && item.done)
      if (completedTask) {
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 2000)
      }
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const handleAddTask = async () => {
    if (!wedding || !newTask.task.trim()) return
    
    const taskItem: ChecklistItem = {
      id: Date.now().toString(),
      task: newTask.task.trim(),
      done: false,
      category: newTask.category,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      notes: newTask.notes.trim() || undefined,
      urgent: newTask.urgent,
      order: wedding.checklist.length + 1
    }
    
    try {
      const updatedChecklist = [...wedding.checklist, taskItem]
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      setNewTask({ task: '', category: 'other', dueDate: '', notes: '', urgent: false })
      setShowAddTask(false)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleEditTask = async (taskId: string, updates: Partial<ChecklistItem>) => {
    if (!wedding) return
    
    try {
      const updatedChecklist = wedding.checklist.map(item =>
        item.id === taskId ? { ...item, ...updates } : item
      )
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
      setEditingTask(null)
    } catch (error) {
      console.error('Error editing task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!wedding) return
    
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const updatedChecklist = wedding.checklist.filter(item => item.id !== taskId)
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
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
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
      setWedding({ ...wedding, checklist: updatedChecklist })
    } catch (error) {
      console.error('Error updating task urgency:', error)
    }
  }

  const handleReorderTasks = async (fromIndex: number, toIndex: number) => {
    if (!wedding) return
    
    const reorderedTasks = [...wedding.checklist]
    const [movedTask] = reorderedTasks.splice(fromIndex, 1)
    reorderedTasks.splice(toIndex, 0, movedTask)
    
    // Update order values
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      order: index + 1
    }))
    
    try {
      await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedTasks })
      setWedding({ ...wedding, checklist: updatedTasks })
    } catch (error) {
      console.error('Error reordering tasks:', error)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!wedding) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingDate: wedding.date,
          guestCount: wedding.guestCount || 100,
          alreadyBooked: [],
          preferences: []
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate checklist')
      
      const result = await response.json()
      
      if (result.tasks && Array.isArray(result.tasks)) {
        const newTasks: ChecklistItem[] = result.tasks.map((task: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          task: task.task || task.description || 'Generated task',
          done: false,
          category: (task.category as ChecklistItem['category']) || 'other',
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          notes: task.description || task.notes || undefined,
          urgent: task.priority === 'high' || task.urgent || false,
          order: wedding.checklist.length + index + 1
        }))
        
        const updatedChecklist = [...wedding.checklist, ...newTasks]
        await updateDoc(doc(db, 'weddings', user!.uid), { checklist: updatedChecklist })
        setWedding({ ...wedding, checklist: updatedChecklist })
        
        // Show success message
        alert('Checklist generated successfully!')
      }
    } catch (error) {
      console.error('Error generating checklist:', error)
      alert('Failed to generate checklist. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportChecklist = () => {
    if (!wedding) return
    
    const csv = 'Task,Category,Due Date,Urgent,Status,Notes\n' +
      wedding.checklist.map(task => 
        `"${task.task}","${task.category}","${task.dueDate ? formatDate(task.dueDate) : ''}","${task.urgent}","${task.done ? 'Done' : 'Pending'}","${task.notes || ''}"`
      ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-checklist.csv'
    a.click()
  }

  const getFilteredAndSortedTasks = () => {
    if (!wedding) return []
    
    let filtered = wedding.checklist.filter(task => {
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'done' && task.done) || 
                           (filterStatus === 'pending' && !task.done)
      const matchesVisibility = showCompleted || !task.done
      return matchesCategory && matchesStatus && matchesVisibility
    })

    // Sort tasks
    filtered.sort((a, b) => {
      if (sortBy === 'order') return a.order - b.order
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return 0
    })

    return filtered
  }

  const getTaskStats = () => {
    if (!wedding) return { total: 0, completed: 0, pending: 0, urgent: 0 }
    
    const total = wedding.checklist.length
    const completed = wedding.checklist.filter(t => t.done).length
    const pending = total - completed
    const urgent = wedding.checklist.filter(t => t.urgent && !t.done).length
    
    return { total, completed, pending, urgent }
  }

  const stats = getTaskStats()
  const filteredTasks = getFilteredAndSortedTasks()

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
          <CheckSquare size={48} color={gold} />
          <div style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '24px',
            color: gold,
            textAlign: 'center',
            marginTop: '16px'
          }}>Task Completed! </div>
        </div>
      )}

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
            }}>Wedding Checklist</h1>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              Track all your wedding planning tasks in one place
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportChecklist}
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
              Export
            </button>
            <button
              onClick={() => setShowAddTask(true)}
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
              Add Task
            </button>
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#ffffff',
                padding: '12px 20px',
                fontFamily: 'Jost',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: 'none',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
            }}>Total Tasks</div>
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
            }}>{stats.completed}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: muted,
              marginTop: '4px'
            }}>Completed</div>
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
            }}>{stats.pending}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: muted,
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
            }}>{stats.urgent}</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#dc2626',
              marginTop: '4px'
            }}>Urgent</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '0.5px solid rgba(180,140,90,0.2)',
        padding: '16px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
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
              <option value="order">Sort by Order</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Jost', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show completed
            </label>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ padding: '32px' }}>
        {filteredTasks.length === 0 ? (
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
            }}> <CheckSquare size={48} /> </div>
            <h3 style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '20px',
              color: brown,
              marginBottom: '8px'
            }}>No tasks found</h3>
            <p style={{
              fontFamily: 'Jost',
              fontSize: '14px',
              color: muted
            }}>
              {filterCategory !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your filters or add a new task to get started.'
                : 'Add your first task to start planning your wedding.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.map((task, index) => {
              const IconComponent = categoryIcons[task.category]
              const isEditing = editingTask === task.id
              
              return (
                <div key={task.id} style={{
                  backgroundColor: 'white',
                  border: `0.5px solid ${task.urgent ? 'rgba(220, 38, 38, 0.3)' : 'rgba(180,140,90,0.2)'}`,
                  padding: '16px',
                  opacity: task.done ? 0.7 : 1
                }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="text"
                        defaultValue={task.task}
                        onBlur={(e) => handleEditTask(task.id, { task: e.target.value })}
                        style={{
                          padding: '8px',
                          border: '0.5px solid rgba(180,140,90,0.3)',
                          fontFamily: 'Jost',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: brown
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          defaultValue={task.category}
                          onChange={(e) => handleEditTask(task.id, { category: e.target.value as any })}
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
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="date"
                          defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleEditTask(task.id, { dueDate: e.target.value ? new Date(e.target.value) : undefined })}
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
                          onClick={() => setEditingTask(null)}
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
                      {/* Checkbox */}
                      <div
                        onClick={() => handleToggleTask(task.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: task.done ? 'none' : `0.5px solid ${gold}`,
                          backgroundColor: task.done ? gold : 'transparent',
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {task.done && (
                          <div style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: 'white',
                            clipPath: 'polygon(0% 50%, 30% 80%, 100% 10%, 80% 0%, 30% 60%)'
                          }}></div>
                        )}
                      </div>

                      {/* Category Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: `${categoryColors[task.category]}15`,
                        border: `0.5px solid ${categoryColors[task.category]}30`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconComponent size={16} color={categoryColors[task.category]} />
                      </div>

                      {/* Task Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontFamily: 'Jost',
                            fontSize: '15px',
                            fontWeight: 500,
                            color: task.done ? muted : brown,
                            textDecoration: task.done ? 'line-through' : 'none'
                          }}>
                            {task.task}
                          </span>
                          {task.urgent && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              backgroundColor: '#fee2e2',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 500,
                              color: '#dc2626'
                            }}>
                              <AlertCircle size={10} />
                              Urgent
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            fontSize: '11px',
                            color: muted,
                            textTransform: 'capitalize'
                          }}>
                            {task.category}
                          </span>
                          {task.dueDate && (
                            <span style={{
                              fontSize: '11px',
                              color: muted,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Calendar size={12} />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.notes && (
                            <span style={{
                              fontSize: '11px',
                              color: muted,
                              fontStyle: 'italic'
                            }}>
                              {task.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleUrgent(task.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <AlertCircle 
                            size={16} 
                            color={task.urgent ? '#dc2626' : muted} 
                            fill={task.urgent ? '#dc2626' : 'none'}
                          />
                        </button>
                        <button
                          onClick={() => setEditingTask(task.id)}
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
                          onClick={() => handleDeleteTask(task.id)}
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

      {/* Add Task Modal */}
      {showAddTask && (
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
              }}>Add New Task</h2>
              <button
                onClick={() => setShowAddTask(false)}
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
              <input
                type="text"
                placeholder="Task name"
                value={newTask.task}
                onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
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
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
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
                  <option value="other">Other</option>
                </select>

                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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

              <textarea
                placeholder="Notes (optional)"
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Jost', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={newTask.urgent}
                  onChange={(e) => setNewTask({ ...newTask, urgent: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Mark as urgent
              </label>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddTask(false)}
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
                  onClick={handleAddTask}
                  disabled={!newTask.task.trim()}
                  style={{
                    backgroundColor: goldDark,
                    color: cream,
                    padding: '10px 20px',
                    fontFamily: 'Jost',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: !newTask.task.trim() ? 'not-allowed' : 'pointer',
                    opacity: !newTask.task.trim() ? 0.7 : 1
                  }}
                >
                  Add Task
                </button>
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
    </div>
  )
}
