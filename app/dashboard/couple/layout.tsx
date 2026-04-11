'use client'
import ClientOnly from '@/components/ClientOnly'

export default function CoupleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      {children}
    </ClientOnly>
  )
}
