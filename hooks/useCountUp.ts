'use client'

import { useState, useEffect, useRef } from 'react'

export function useCountUp(
  end: number, 
  duration: number = 1500,
  start: number = 0
) {
  const [count, setCount] = useState(start)
  const countRef = useRef(start)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number>()

  useEffect(() => {
    if (end === 0) { setCount(0); return }
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }
      const progress = Math.min(
        (timestamp - startTimeRef.current) / duration, 
        1
      )
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(
        start + (end - start) * eased
      )
      setCount(current)
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }
    
    frameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [end, duration, start])

  return count
}
