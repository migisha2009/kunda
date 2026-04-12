'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Heart, Camera, MapPin, Music, Cake, Flower, Home as HomeIcon, Car, Shirt, Star, Users, Menu, X, Phone, MessageCircle, ChevronRight, Settings, Calendar, DollarSign, MessageSquare, AlertCircle, Check } from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [activeTab, setActiveTab] = useState('couples')
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())

  // Vendor categories
  const vendorCategories = [
    { name: 'Photography', icon: Camera },
    { name: 'Venues', icon: HomeIcon },
    { name: 'Catering', icon: Cake },
    { name: 'Floristry', icon: Flower },
    { name: 'Music & DJ', icon: Music },
    { name: 'Decor', icon: HomeIcon },
    { name: 'Bridal Wear', icon: Shirt },
    { name: 'Cake', icon: Cake },
    { name: 'Hair & Makeup', icon: Star },
    { name: 'Transport', icon: Car }
  ]

  // Features
  const features = [
    { name: 'Smart Planning Tools', icon: Settings, color: '#1a56db' },
    { name: 'Verified Vendors', icon: Check, color: '#057a55' },
    { name: 'Guest Management', icon: Users, color: '#c27803' },
    { name: 'Budget Tracking', icon: DollarSign, color: '#5b21b6' },
    { name: 'Easy Bookings', icon: Calendar, color: '#c2410c' },
    { name: 'WhatsApp Alerts', icon: MessageSquare, color: '#c81e1e' }
  ]

  // Testimonials
  const testimonials = [
    {
      name: 'Amara & David',
      text: 'Kunda made planning our wedding so much easier! We found the perfect photographer and venue in just a few days.',
      location: 'Kigali, Rwanda'
    },
    {
      name: 'Grace & Emmanuel',
      text: 'The vendors on Kunda are top-notch. Every professional we worked with was exceptional and reasonably priced.',
      location: 'Kigali, Rwanda'
    },
    {
      name: 'Amahoro Photography',
      text: 'Kunda has transformed our business. We get quality leads and can manage bookings seamlessly.',
      location: 'Kigali, Rwanda'
    }
  ]

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30)
    
    const timer = setInterval(() => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setCountdown({ days, hours, minutes, seconds })
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => {
      setFormSubmitted(false)
      setFormData({ name: '', email: '', message: '' })
    }, 3000)
  }

  return (
    <div className="min-h-screen">
      {/* 1. STICKY NAVBAR */}
      <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`} style={{ borderBottom: '1px solid #e5edff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a56db' }}>
                <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
              </div>
              <span className="ml-2" style={{ fontFamily: 'Urbanist', color: '#1a56db', fontWeight: 800, fontSize: '22px' }}>Kunda</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/vendors" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Vendors</Link>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>How it Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Pricing</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors" style={{ color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Contact</a>
              <Link href="/login" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-medium transition-colors hover:bg-blue-50">Login</Link>
              <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: '#1a56db' }}>Get Started</Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <Link href="/vendors" className="text-gray-700 hover:text-gray-900">Vendors</Link>
                <a href="#how-it-works" className="text-gray-700 hover:text-gray-900">How it Works</a>
                <a href="#pricing" className="text-gray-700 hover:text-gray-900">Pricing</a>
                <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
                <Link href="/login" className="text-gray-700 hover:text-gray-900">Login</Link>
                <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium text-center" style={{ backgroundColor: '#1a56db' }}>
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)',
        minHeight: '560px',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background rings */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between relative z-10">
          {/* Left side */}
          <div className="lg:w-1/2 mb-10 lg:mb-0" style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" style={{ animation: 'pulse 2s infinite' }}></div>
              Rwanda's #1 Wedding Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ 
              fontWeight: 900, 
              letterSpacing: '-0.03em',
              fontFamily: 'Urbanist'
            }}>
              Your Perfect Wedding,<br />
              <span style={{ color: '#93c5fd' }}>Beautifully</span><br />
              Orchestrated
            </h1>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
              Connect with verified wedding vendors, manage your budget, and plan every detail of your special day
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/signup" className="px-6 py-3 rounded-lg text-blue-600 font-medium transition-all hover:bg-blue-50" style={{ backgroundColor: 'white' }}>
                Plan My Wedding
              </Link>
              <Link href="/signup" className="px-6 py-3 rounded-lg text-white font-medium border border-white transition-all hover:bg-white hover:text-blue-600">
                Join as Vendor
              </Link>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#1a56db' }}>
                    <span className="text-white text-xs font-bold">{i}</span>
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                2,400+ couples planning their perfect day
              </span>
            </div>
          </div>

          {/* Right side floating card */}
          <div className="lg:w-1/2 lg:pl-10" style={{ animation: 'fadeInUp 0.8s ease 0.2s both' }}>
            <div className="p-6 rounded-2xl" style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="text-white text-sm font-medium mb-4">Next Wedding Countdown</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-bold text-white">{countdown.days}</div>
                  <div className="text-xs uppercase text-white opacity-50">Days</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-xs uppercase text-white opacity-50">Hours</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-xs uppercase text-white opacity-50">Mins</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-bold text-white">{countdown.seconds}</div>
                  <div className="text-xs uppercase text-white opacity-50">Secs</div>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
                <div>
                  <div className="text-white font-medium">Amara & David</div>
                  <div className="text-xs text-white opacity-60">Kigali Convention Center</div>
                </div>
                <div className="ml-auto">
                  <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Live</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATS BAR */}
      <section id="stats" data-animate style={{ backgroundColor: '#1e3a8a', padding: '24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease' : 'none' }}>2,400+</div>
              <div className="text-sm uppercase" style={{ color: '#93c5fd' }}>Weddings</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.2s' : 'none' }}>380+</div>
              <div className="text-sm uppercase" style={{ color: '#93c5fd' }}>Vendors</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.4s' : 'none' }}>98%</div>
              <div className="text-sm uppercase" style={{ color: '#93c5fd' }}>Satisfied</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.6s' : 'none' }}>10+</div>
              <div className="text-sm uppercase" style={{ color: '#93c5fd' }}>Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" data-animate style={{ backgroundColor: 'white', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16" style={{ fontFamily: 'Urbanist', fontWeight: 900, color: '#111928' }}>
            Everything you need for your perfect wedding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1" 
                     style={{ 
                       backgroundColor: 'white', 
                       borderColor: '#e5edff',
                       animation: visibleSections.has('features') ? `fadeInUp 0.6s ease ${index * 0.1}s both` : 'none'
                     }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" 
                       style={{ backgroundColor: `${feature.color}20`, color: feature.color }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#111928' }}>{feature.name}</h3>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    {feature.name === 'Smart Planning Tools' && 'AI-powered timeline and task management'}
                    {feature.name === 'Verified Vendors' && 'All vendors are background-checked and reviewed'}
                    {feature.name === 'Guest Management' && 'RSVP tracking and guest list organization'}
                    {feature.name === 'Budget Tracking' && 'Real-time expense monitoring and alerts'}
                    {feature.name === 'Easy Bookings' && 'Secure payments and instant confirmations'}
                    {feature.name === 'WhatsApp Alerts' && 'Get updates directly on WhatsApp'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. VENDOR CATEGORIES SECTION */}
      <section id="categories" data-animate style={{ backgroundColor: '#f0f4ff', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {vendorCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} 
                     className="p-4 rounded-xl text-center transition-all hover:bg-blue-600 hover:text-white cursor-pointer"
                     style={{ 
                       backgroundColor: '#f0f4ff',
                       borderColor: '#e5edff',
                       border: '1px solid #e5edff',
                       animation: visibleSections.has('categories') ? `fadeInUp 0.6s ease ${index * 0.05}s both` : 'none'
                     }}
                     onMouseEnter={(e) => {
                       const target = e.currentTarget
                       target.style.backgroundColor = '#1a56db'
                       target.style.color = 'white'
                       const iconDiv = target.querySelector('div')
                       if (iconDiv) {
                         iconDiv.style.backgroundColor = 'rgba(255,255,255,0.2)'
                         iconDiv.style.color = 'white'
                       }
                     }}
                     onMouseLeave={(e) => {
                       const target = e.currentTarget
                       target.style.backgroundColor = '#f0f4ff'
                       target.style.color = '#1e3a8a'
                       const iconDiv = target.querySelector('div')
                       if (iconDiv) {
                         iconDiv.style.backgroundColor = 'white'
                         iconDiv.style.color = '#1e3a8a'
                       }
                     }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2 transition-all" 
                       style={{ backgroundColor: 'white', color: '#1e3a8a' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold" style={{ color: '#1e3a8a' }}>{category.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section id="how-it-works" data-animate style={{ backgroundColor: 'white', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('couples')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'couples' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Couples
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'vendors' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Vendors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0"></div>
            
            {(activeTab === 'couples' ? [
              { number: 1, title: 'Create Account', desc: 'Sign up free in 60 seconds' },
              { number: 2, title: 'Discover Vendors', desc: 'Browse verified professionals' },
              { number: 3, title: 'Book & Celebrate', desc: 'Book, pay, enjoy your day' }
            ] : [
              { number: 1, title: 'List Your Business', desc: 'Create your free profile' },
              { number: 2, title: 'Receive Enquiries', desc: 'Get matched with couples' },
              { number: 3, title: 'Grow Revenue', desc: 'Manage bookings and payments' }
            ]).map((step, index) => (
              <div key={index} className="relative z-10 text-center" style={{ animation: visibleSections.has('how-it-works') ? `fadeInUp 0.6s ease ${index * 0.1}s both` : 'none' }}>
                <div className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#111928' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section id="testimonials" data-animate style={{ backgroundColor: '#f0f4ff', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} 
                   className="p-6 rounded-xl border"
                   style={{ 
                     backgroundColor: 'white',
                     borderColor: '#e5edff',
                     animation: visibleSections.has('testimonials') ? `fadeInUp 0.6s ease ${index * 0.1}s both` : 'none'
                   }}>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} />
                  ))}
                </div>
                <p className="text-sm mb-4 italic" style={{ color: '#374151' }}>"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: '#111928' }}>{testimonial.name}</div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CONTACT SECTION */}
      <section id="contact" data-animate style={{ backgroundColor: 'white', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#111928' }}>
            Get in touch with Kunda
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl flex items-center" style={{ backgroundColor: '#f0f4ff' }}>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#111928' }}>Phone</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>+250 783 312 746</div>
                </div>
              </div>
              <div className="p-4 rounded-xl flex items-center" style={{ backgroundColor: '#f0f4ff' }}>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#111928' }}>Phone 2</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>+250 782 526 295</div>
                </div>
              </div>
              <div className="p-4 rounded-xl flex items-center" style={{ backgroundColor: '#f0f4ff' }}>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#111928' }}>Instagram</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>@darkxente</div>
                </div>
              </div>
              <div className="p-4 rounded-xl flex items-center" style={{ backgroundColor: '#f0f4ff' }}>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#111928' }}>Location</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>Kigali, Rwanda</div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="p-7 rounded-xl" style={{ backgroundColor: '#f0f4ff' }}>
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#111928' }}>Message Sent!</h3>
                  <p className="text-sm" style={{ color: '#6b7280' }}>We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:outline-none"
                      style={{ backgroundColor: 'white' }}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:outline-none"
                      style={{ backgroundColor: 'white' }}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <textarea
                      placeholder="Message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:outline-none resize-none"
                      style={{ backgroundColor: 'white' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: '#1a56db' }}
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA BANNER */}
      <section style={{ 
        background: 'linear-gradient(135deg, #0f2460, #1a56db 50%, #3f83f8)',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Urbanist', fontWeight: 900 }}>
            Begin your forever, beautifully
          </h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Join 2,400+ couples who have planned their perfect day with Kunda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-6 py-3 rounded-lg text-blue-600 font-medium transition-all hover:bg-blue-50" style={{ backgroundColor: 'white' }}>
              Start Planning
            </Link>
            <Link href="/signup" className="px-6 py-3 rounded-lg text-white font-medium border border-white transition-all hover:bg-white hover:text-blue-600">
              Join as Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', padding: '60px 64px 20px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Kunda info */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a56db' }}>
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2" style={{ fontFamily: 'Urbanist', color: '#1a56db', fontWeight: 800, fontSize: '20px' }}>Kunda</span>
              </div>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                Your perfect wedding, beautifully orchestrated. Rwanda's premier wedding planning platform.
              </p>
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700">
                  <Phone className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* For Couples */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: 'white' }}>For Couples</h3>
              <ul className="space-y-2">
                <li><Link href="/vendors" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Find Vendors</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Success Stories</a></li>
              </ul>
            </div>

            {/* For Vendors */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: 'white' }}>For Vendors</h3>
              <ul className="space-y-2">
                <li><Link href="/signup" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Join Kunda</Link></li>
                <li><Link href="/dashboard/vendor" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Vendor Dashboard</Link></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Vendor Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Pricing Plans</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: 'white' }}>Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#64748b', fontSize: '14px' }}>Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center" style={{ borderColor: '#1e293b' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>
              &copy; 2024 Kunda. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <span className="text-sm" style={{ color: '#64748b' }}>Made with love in</span>
              <MapPin className="w-4 h-4 mx-1" style={{ color: '#1a56db' }} />
              <span className="text-sm font-medium" style={{ color: '#1a56db' }}>Kigali, Rwanda</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
