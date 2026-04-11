'use client'
import ClientOnly from '@/components/ClientOnly'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      {children}
    </ClientOnly>
  )
}
