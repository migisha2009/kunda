'use client'

export default function VendorFooter() {
  return (
    <footer style={{
      background: '#f8f9fa',
      borderTop: '1px solid #e9ecef',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'var(--font-family-body)',
    }}>
      <div style={{ 
        fontSize: 14, 
        color: '#6c757d', 
        fontFamily: 'var(--font-family-body)' 
      }}>
        © 2024 Kunda Wedding Platform. Kigali Rwanda
      </div>
      <div style={{
        display: 'flex', 
        gap: 24, 
        alignItems: 'center'
      }}>
        <a href="https://wa.me/250783312746"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 14, 
            color: '#6c757d',
            textDecoration: 'none',
            fontFamily: 'var(--font-family-body)',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#495057'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
        >
          WhatsApp Support
        </a>
        <a href="https://instagram.com/darkxente"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 14, 
            color: '#6c757d',
            textDecoration: 'none',
            fontFamily: 'var(--font-family-body)',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#495057'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
        >
          @darkxente
        </a>
        <span style={{ 
          fontSize: 14, 
          color: '#6c757d', 
          fontFamily: 'var(--font-family-body)' 
        }}>
          Made with in Rwanda
        </span>
      </div>
    </footer>
  )
}
