'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Heart, Camera, MapPin, Music, Cake, Flower, Home as HomeIcon, Car, Shirt, Star, Users, Menu, X, Phone, MessageCircle, ChevronRight, Settings, Calendar, DollarSign, MessageSquare, AlertCircle, Check } from 'lucide-react'
import FloatingParticles from '@/components/FloatingParticles'

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
    { name: 'Smart Planning Tools', icon: Settings, color: 'var(--color-accent)' },
    { name: 'Verified Vendors', icon: Check, color: 'var(--color-success)' },
    { name: 'Guest Management', icon: Users, color: 'var(--color-accent)' },
    { name: 'Budget Tracking', icon: DollarSign, color: 'var(--color-accent)' },
    { name: 'Easy Bookings', icon: Calendar, color: 'var(--color-accent)' },
    { name: 'WhatsApp Alerts', icon: MessageSquare, color: 'var(--color-accent)' }
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
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`} style={{ backgroundColor: 'var(--color-background)', borderBottom: `1px solid var(--color-border)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Heart className="w-6 h-6 text-white" style={{ animation: 'heartbeat 2s infinite' }} />
              </div>
              <span className="ml-2" style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-heading)', fontWeight: '700', fontSize: 'var(--font-size-2xl)' }}>Kunda</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/vendors" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>Vendors</Link>
              <a href="#how-it-works" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>How it Works</a>
              <a href="#pricing" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>Pricing</a>
              <a href="#contact" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>Contact</a>
              <Link href="/login" className="px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-purple-50" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Login</Link>
              <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: 'var(--color-accent)' }}>Get Started</Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:text-purple-600 transition-colors"
                style={{ color: 'var(--color-heading)' }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex flex-col space-y-3">
                <Link href="/vendors" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)' }}>Vendors</Link>
                <a href="#how-it-works" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)' }}>How it Works</a>
                <a href="#pricing" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)' }}>Pricing</a>
                <a href="#contact" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)' }}>Contact</a>
                <Link href="/login" className="hover:text-purple-600 transition-colors" style={{ color: 'var(--color-heading)' }}>Login</Link>
                <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium text-center transition-colors" style={{ backgroundColor: 'var(--color-accent)' }}>
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* 2. HERO SECTION */}
      <section className="landing-hero hero-section" style={{ minHeight: '560px', position: 'relative', overflow: 'hidden', background: 'var(--gradient-hero)' }}>
        {/* Floating Particles */}
        <FloatingParticles />
        
        {/* Decorative background rings */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between relative z-10">
          {/* Left side */}
          <div className="lg:w-1/2 mb-10 lg:mb-0" style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--color-success)', animation: 'pulse 2s infinite' }}></div>
              Rwanda's #1 Wedding Platform
            </div>
            <h1 className="hero-title-landing text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'var(--font-family-heading)', color: '#FFFFFF' }}>
              Your Perfect Wedding,<br />
              <span style={{ color: 'var(--color-accent)' }}>Beautifully</span><br />
              Orchestrated
            </h1>
            <p className="hero-subtitle-landing text-lg mb-8" style={{ fontFamily: 'var(--font-family-body)', color: 'rgba(255,255,255,0.85)', fontWeight: '400' }}>
              Connect with verified wedding vendors, manage your budget, and plan every detail of your special day
            </p>
            <div className="hero-buttons flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/signup" className="btn-primary">
                Plan My Wedding
              </Link>
              <Link href="/signup" className="btn-secondary">
                Join as Vendor
              </Link>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
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
            <div className="card-glass">
              <div className="text-white text-sm font-medium mb-4">Next Wedding Countdown</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, index) => (
                  <div key={unit} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="text-2xl font-bold text-white">{countdown[unit]}</div>
                    <div className="text-xs uppercase text-white opacity-50">{unit.charAt(0).toUpperCase() + unit.slice(1, -1)}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">A</div>
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
      <section id="stats" data-animate className="stats-section page-wrapper" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease' : 'none' }}>2,400+</div>
              <div className="text-sm uppercase" style={{ color: 'var(--color-accent)' }}>Weddings</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.2s' : 'none' }}>380+</div>
              <div className="text-sm uppercase" style={{ color: 'var(--color-accent)' }}>Vendors</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.4s' : 'none' }}>98%</div>
              <div className="text-sm uppercase" style={{ color: 'var(--color-accent)' }}>Satisfied</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2" style={{ animation: visibleSections.has('stats') ? 'countUp 1s ease 0.6s' : 'none' }}>10+</div>
              <div className="text-sm uppercase" style={{ color: 'var(--color-accent)' }}>Categories</div>
            </div>
          </div>
        </div>
      </section>
      {/* 4. FEATURES SECTION */}
      <section id="features" data-animate className="features-section page-wrapper" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16" style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-heading)' }}>
            Everything you need for your perfect wedding
          </h2>
          <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card" 
                     style={{ 
                       animation: visibleSections.has('features') ? `fadeInUp 0.6s ease ${index * 0.1}s both` : 'none'
                     }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" 
                       style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: feature.color }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{feature.name}</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
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
      <section id="categories" data-animate className="categories-section page-wrapper" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="categories-grid grid grid-cols-2 md:grid-cols-5 gap-4">
            {vendorCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} 
                     className="p-4 rounded-xl text-center transition-all cursor-pointer"
                     style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', border: `1px solid var(--color-border)`, animation: visibleSections.has('categories') ? `fadeInUp 0.6s ease ${index * 0.05}s both` : 'none' }}
                     onMouseEnter={(e) => {
                       const target = e.currentTarget
                       target.style.backgroundColor = 'var(--color-accent)'
                       target.style.color = '#ffffff'
                       const iconDiv = target.querySelector('div')
                       if (iconDiv) {
                         iconDiv.style.backgroundColor = 'rgba(255,255,255,0.2)'
                         iconDiv.style.color = '#ffffff'
                       }
                     }}
                     onMouseLeave={(e) => {
                       const target = e.currentTarget
                       target.style.backgroundColor = 'var(--color-card)'
                       target.style.color = 'var(--color-text)'
                       const iconDiv = target.querySelector('div')
                       if (iconDiv) {
                         iconDiv.style.backgroundColor = 'rgba(255,255,255,0.1)'
                         iconDiv.style.color = 'var(--color-accent)'
                       }
                     }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2 transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-accent)' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{category.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      {/* 6. HOW IT WORKS SECTION */}
      <section id="how-it-works" data-animate className="page-wrapper" style={{ backgroundColor: 'var(--color-card)', padding: '80px 64px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setActiveTab('couples')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'couples' 
                    ? 'bg-accent text-white' 
                    : 'text-white hover:text-accent'
                }`}
                style={{ 
                  backgroundColor: activeTab === 'couples' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'couples' ? '#FFFFFF' : 'var(--color-text)'
                }}
              >
                For Couples
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'vendors' 
                    ? 'bg-accent text-white' 
                    : 'text-white hover:text-accent'
                }`}
                style={{ 
                  backgroundColor: activeTab === 'vendors' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'vendors' ? '#FFFFFF' : 'var(--color-text)'
                }}
              >
                For Vendors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 z-0" style={{ backgroundColor: 'var(--color-accent)' }}></div>
            
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
                <div className="w-13 h-13 rounded-full text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 7. TESTIMONIALS SECTION */}
      <section id="testimonials" data-animate className="testimonials-section page-wrapper" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-heading)' }}>
            Love Stories from Happy Couples
          </h2>
          <p style={{ fontFamily: 'var(--font-family-body)', color: 'var(--color-heading)', opacity: 0.8 }}>
            See what couples are saying about their Kunda experience
          </p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} 
                   className="card"
                   style={{ 
                     animation: visibleSections.has('testimonials') ? `fadeInUp 0.6s ease ${index * 0.1}s both` : 'none'
                   }}>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'var(--color-accent)' }} />
                  ))}
                </div>
                <p className="text-sm mb-4 italic" style={{ color: 'rgba(255,255,255,0.8)' }}>"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3" style={{ background: 'var(--gradient-hero)' }}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>{testimonial.name}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 8. CONTACT SECTION */}
      <section id="contact" data-animate className="contact-section page-wrapper md:py-12 lg:py-20" style={{ backgroundColor: 'var(--color-card)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-text)' }}>
            Get in touch with Kunda
          </h2>
          <div className="contact-grid grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card flex items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Phone</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>+250 783 312 746</div>
                </div>
              </div>
              <div className="card flex items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Phone 2</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>+250 782 526 295</div>
                </div>
              </div>
              <div className="card flex items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Instagram</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>@darkxente</div>
                </div>
              </div>
              <div className="card flex items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Location</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Kigali, Rwanda</div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="card" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                    <Check className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>Message Sent!</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <textarea
                      placeholder="Message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full p-3 rounded-lg border focus:outline-none resize-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-accent)' }}
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
      <section className="cta-section hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite' }}></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full border border-white opacity-8" style={{ animation: 'pulse 4s infinite 2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="cta-title text-4xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-family)', fontWeight: 'var(--font-weight-black)' }}>
            Begin your forever, beautifully
          </h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Join 2,400+ couples who have planned their perfect day with Kunda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary">
              Start Planning
            </Link>
            <Link href="/signup" className="btn-secondary">
              Join as Vendor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
