'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Message {
  role: 'user' | 'ai'
  content: string
  time: string
}

export default function AIChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickPrompts = [
    'Help me create a wedding timeline',
    'Budget advice for 100 guests in Kigali',
    'Best venues in Kigali Rwanda',
    'Rwanda wedding traditions'
  ]

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: "Hi! I'm Kunda AI  I'm here to help you plan your perfect wedding in Rwanda. Ask me anything about venues, budgets, vendors, or traditions!",
        time: new Date().toLocaleTimeString([], 
          { hour: '2-digit', minute: '2-digit' })
      }])
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      { behavior: 'smooth' }
    )
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg: Message = {
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString([],
        { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msg,
          weddingContext: null
        })
      })
      const data = await res.json()
      
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.reply || 'Sorry, I could not respond. Try again!',
        time: new Date().toLocaleTimeString([],
          { hour: '2-digit', minute: '2-digit' })
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'AI is taking a break. Please try again in a moment!',
        time: new Date().toLocaleTimeString([],
          { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a56db, #3f83f8)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(26,86,219,0.4)',
          zIndex: 1000,
          fontSize: 24,
          animation: 'heartbeat 2s ease infinite',
          transition: 'transform 0.2s ease',
        }}
      >
        {open ? '×' : ''}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: 92,
          right: 24,
          width: 360,
          height: 500,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 999,
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f2460, #1a56db)',
            padding: '16px 20px',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
               Kunda AI
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 2
            }}>
              Wedding Planning Assistant
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#f8faff',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' 
                  ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '12px 12px 4px 12px'
                    : '12px 12px 12px 4px',
                  background: msg.role === 'user'
                    ? '#1a56db' : '#fff',
                  color: msg.role === 'user'
                    ? '#fff' : '#111928',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  {msg.content}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#9ca3af',
                  marginTop: 4,
                }}>
                  {msg.time}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                background: '#fff',
                borderRadius: '12px 12px 12px 4px',
                width: 'fit-content',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#1a56db',
                    animation: `pulse 1s ease infinite ${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}

            {messages.length === 1 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    style={{
                      background: '#ebf5ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: '#1a56db',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Urbanist, sans-serif',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5edff',
            display: 'flex',
            gap: 8,
            background: '#fff',
            flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your wedding..."
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #e5edff',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'Urbanist, sans-serif',
                color: '#111928',
                outline: 'none',
                background: '#f8faff',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim()
                  ? '#e5edff' : '#1a56db',
                color: loading || !input.trim()
                  ? '#9ca3af' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading || !input.trim()
                  ? 'not-allowed' : 'pointer',
                fontFamily: 'Urbanist, sans-serif',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
