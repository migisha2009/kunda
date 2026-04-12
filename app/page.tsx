'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Camera, MapPin, Music, Cake, Flower, Home as HomeIcon, Car, Shirt, Star, Users, TrendingUp, Menu, X, ChevronRight, Check } from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const vendorCategories = [
    { name: 'Photography', icon: Camera, color: 'bg-purple-100 text-purple-600' },
    { name: 'Venues', icon: HomeIcon, color: 'bg-blue-100 text-blue-600' },
    { name: 'Catering', icon: Cake, color: 'bg-orange-100 text-orange-600' },
    { name: 'Floristry', icon: Flower, color: 'bg-pink-100 text-pink-600' },
    { name: 'Music', icon: Music, color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Decor', icon: HomeIcon, color: 'bg-green-100 text-green-600' },
    { name: 'Bridal Wear', icon: Shirt, color: 'bg-red-100 text-red-600' },
    { name: 'Cake', icon: Cake, color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Hair & Makeup', icon: Star, color: 'bg-purple-100 text-purple-600' },
    { name: 'Transport', icon: Car, color: 'bg-gray-100 text-gray-600' }
  ]

  const testimonials = [
    {
      name: 'Sarah & Michael',
      text: 'Kunda made planning our wedding so much easier! We found the perfect photographer and venue in just a few days.',
      rating: 5,
      location: 'Lagos, Nigeria'
    },
    {
      name: 'Amara & David',
      text: 'The vendors on Kunda are top-notch. Every professional we worked with was exceptional and reasonably priced.',
      rating: 5,
      location: 'Abuja, Nigeria'
    },
    {
      name: 'Chioma & James',
      text: 'From engagement to wedding day, Kunda was with us every step. Highly recommend to all couples!',
      rating: 5,
      location: 'Port Harcourt, Nigeria'
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Heart className="w-8 h-8" style={{ color: '#1a56db' }} />
              <span className="ml-2" style={{ fontFamily: 'Urbanist', color: '#1a56db', fontWeight: 800, fontSize: '22px' }}>Kunda</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/vendors" className="text-gray-700 hover:text-gray-900 transition-colors">Vendors</Link>
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition-colors">Login</Link>
              <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: '#1a56db' }}>
                Get Started
              </Link>
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
                <Link href="/login" className="text-gray-700 hover:text-gray-900">Login</Link>
                <Link href="/signup" className="px-4 py-2 rounded-lg text-white font-medium text-center" style={{ backgroundColor: '#1a56db' }}>
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Your Perfect Wedding,<br />
            Beautifully Orchestrated
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: '#3a2a1a', opacity: 0.8 }}>
            Connect with verified wedding vendors, manage your budget, and plan every detail of your special day with Kunda's comprehensive wedding platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 rounded-lg text-white font-medium text-lg transition-all hover:opacity-90" style={{ backgroundColor: '#1a56db' }}>
              Plan My Wedding
            </Link>
            <Link href="/signup" className="px-8 py-4 rounded-lg font-medium text-lg border-2 transition-all hover:bg-white hover:bg-opacity-10" style={{ borderColor: '#b08850', color: '#1a56db' }}>
              Join as Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#1a56db' }}>2,400+</div>
              <div className="text-gray-600">Weddings Planned</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#1a56db' }}>380+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#1a56db' }}>98%</div>
              <div className="text-gray-600">Couples Satisfied</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center mb-16" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontWeight: 800, fontSize: '40px' }}>
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Couples */}
            <div>
              <h3 className="text-2xl font-bold mb-8" style={{ color: '#1a56db' }}>For Couples</h3>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1a56db' }}>
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Create Account</h4>
                    <p className="text-gray-600">Sign up in seconds and tell us about your dream wedding</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1a56db' }}>
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Discover Vendors</h4>
                    <p className="text-gray-600">Browse verified vendors, read reviews, and compare prices</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1a56db' }}>
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Book & Plan</h4>
                    <p className="text-gray-600">Send enquiries, book services, and manage your wedding timeline</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Vendors */}
            <div>
              <h3 className="text-2xl font-bold mb-8" style={{ color: '#1a56db' }}>For Vendors</h3>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#b08850' }}>
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">List Your Business</h4>
                    <p className="text-gray-600">Create a professional profile with photos and service details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#b08850' }}>
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Receive Enquiries</h4>
                    <p className="text-gray-600">Get notified instantly when couples show interest in your services</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#b08850' }}>
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Grow Revenue</h4>
                    <p className="text-gray-600">Connect with more couples and grow your wedding business</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center mb-16" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontWeight: 800, fontSize: '40px' }}>
            Find Every Vendor You Need
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {vendorCategories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.name}
                  href={`/vendors?category=${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${category.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center mb-16" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontWeight: 800, fontSize: '40px' }}>
            Love Stories from Happy Couples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#b08850' }} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Urbanist', color: '#3a2a1a', fontWeight: 800, fontSize: '40px' }}>
            Ready to plan your dream wedding?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of couples who have planned their perfect day with Kunda
          </p>
          <Link href="/signup" className="inline-flex items-center px-8 py-4 rounded-lg text-white font-medium text-lg transition-all hover:opacity-90" style={{ backgroundColor: '#1a56db' }}>
            Sign Up Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8" style={{ color: '#1a56db' }} />
                <span className="ml-2" style={{ fontFamily: 'Urbanist', color: '#1a56db', fontWeight: 800, fontSize: '22px' }}>Kunda</span>
              </div>
              <p className="text-gray-600">Your perfect wedding, beautifully orchestrated.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-4">For Couples</h3>
              <ul className="space-y-2">
                <li><Link href="/vendors" className="text-gray-600 hover:text-gray-900">Find Vendors</Link></li>
                <li><a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-4">For Vendors</h3>
              <ul className="space-y-2">
                <li><Link href="/signup" className="text-gray-600 hover:text-gray-900">Join Kunda</Link></li>
                <li><Link href="/dashboard/vendor" className="text-gray-600 hover:text-gray-900">Vendor Dashboard</Link></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>&copy; 2024 Kunda. All rights reserved. Made with love for couples everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
