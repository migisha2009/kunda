'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Calendar, 
  MessageSquare,
  Heart,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOutUser } from '../lib/auth'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { userProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      current: pathname === '/dashboard/admin'
    },
    {
      name: 'Vendor Management',
      href: '/dashboard/admin/vendors',
      icon: Store,
      current: pathname === '/dashboard/admin/vendors'
    },
    {
      name: 'User Management',
      href: '/dashboard/admin/users',
      icon: Users,
      current: pathname === '/dashboard/admin/users'
    },
    {
      name: 'Booking Overview',
      href: '/dashboard/admin/bookings',
      icon: Calendar,
      current: pathname === '/dashboard/admin/bookings'
    },
    {
      name: 'Enquiry Overview',
      href: '/dashboard/admin/enquiries',
      icon: MessageSquare,
      current: pathname === '/dashboard/admin/enquiries'
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOutUser()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Heart className="w-8 h-8" style={{ color: '#7a5c30' }} />
        <span className="ml-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant)', color: '#7a5c30' }}>
          Kunda Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = item.current
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => {
                if (onClose) onClose()
                setMobileMenuOpen(false)
              }}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userProfile?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  // Mobile version
  if (!isOpen) {
    return (
      <>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white shadow-md border border-gray-200"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <SidebarContent />
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop version
  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        <SidebarContent />
      </div>
    </div>
  )
}
