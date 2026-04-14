'use client'

import { useEffect, useState } from 'react'

interface Props {
  value: number
  max?: number
  color?: string
  height?: number
  animated?: boolean
  showLabel?: boolean
}

export default function AnimatedProgress({
  value,
  max = 100,
  color = '#1a56db',
  height = 8,
  animated = true,
  showLabel = false,
}: Props) {
  const [width, setWidth] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
        }}>
          <span>{value}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        background: '#e5edff',
        borderRadius: height,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: animated ? `${width}%` : `${percentage}%`,
          background: color,
          borderRadius: height,
          transition: animated 
            ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'none',
        }} />
      </div>
    </div>
  )
}
