'use client'

import { useState, useCallback } from 'react'
import { createContext, useContext } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const ToastContext = createContext<{
  showToast: (message: string, 
    type?: Toast['type']) => void
}>({ showToast: () => {} })

export function ToastProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string, 
    type: Toast['type'] = 'success'
  ) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const colors = {
    success: { bg: '#def7ec', color: '#057a55', 
      border: '#6ee7b7', icon: '0d4d' },
    error: { bg: '#fde8e8', color: '#c81e1e', 
      border: '#fca5a5', icon: '0d4d' },
    info: { bg: '#ebf5ff', color: '#1a56db', 
      border: '#93c5fd', icon: '0d4d' },
    warning: { bg: '#fdf6b2', color: '#c27803', 
      border: '#fcd34d', icon: '0d4d' },
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {toasts.map((toast, i) => (
          <div key={toast.id} style={{
            background: colors[toast.type].bg,
            border: `1px solid ${colors[toast.type].border}`,
            color: colors[toast.type].color,
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'Urbanist, sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 280,
            maxWidth: 380,
            animation: 'fadeInUp 0.3s ease both',
            animationDelay: `${i * 0.05}s`,
          }}>
            <span style={{ fontSize: 16 }}>
              {colors[toast.type].icon}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
