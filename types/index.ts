export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'couple' | 'vendor' | 'admin'
  active?: boolean
  createdAt?: any
}

export interface Pricing {
  min: number
  max: number
  currency: string
}

export interface Vendor {
  id: string
  userId?: string
  businessName?: string
  name: string
  category: string
  bio?: string
  location: string
  portfolioImages?: string[]
  images?: string[]
  pricing?: Pricing
  priceRange: string
  rating: number
  reviews?: number
  reviewCount?: number
  verified?: boolean
  availability?: string[]
  createdAt?: any
  featured?: boolean
  description: string
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  services?: string[]
  badges?: string[]
}

export interface Budget {
  total: number
  spent: number
  currency: string
}

export interface ChecklistItem {
  id: string
  task: string
  done: boolean
  category: 'venue' | 'catering' | 'decor' | 'fashion' | 'beauty' | 'music' | 'transport' | 'other'
  dueDate?: Date
  notes?: string
  urgent: boolean
  order: number
}

export interface Guest {
  id: string
  weddingId: string | null
  coupleId: string
  name: string
  email?: string
  phone?: string
  address?: string
  dietaryPreferences: string
  tableNumber?: number
  inviteToken: string
  plusOne: boolean
  plusOneName?: string
  notes?: string
  rsvpStatus: 'pending' | 'declined' | 'attending' | 'maybe'
  createdAt?: any
}

export interface ScheduleItem {
  time: string
  event: string
}

export interface Wedding {
  id: string
  coupleId: string
  date: Date
  venue: string
  venueAddress: string
  ceremonyLocation?: string
  guestCount: number
  budget: Budget
  checklist: ChecklistItem[]
  coupleName1: string
  coupleName2: string
  ceremonyTime: string
  receptionTime: string
  dresscode: 'black_tie' | 'formal' | 'semi_formal' | 'casual' | 'custom'
  customDresscode?: string
  messageToGuests: string
  scheduleItems: ScheduleItem[]
  hashtag: string
  rsvpDeadline: Date
  colorTheme: [string, string]
  heroImage?: string
  planningStartDate: Date
  profileCompletion: number
  budgetExpenses: Expense[]
  expenses: Expense[]
  guests?: Guest[]
  currency: 'RWF' | 'USD' | 'EUR'
  weatherData?: WeatherData
  quoteOfTheDay?: string
  savedVendors?: string[]
  recentlyViewedVendors?: string[]
}

export interface Booking {
  id: string
  weddingId: string
  vendorId: string
  coupleId: string
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  amount: number
  currency: string
  paymentRef: string
  createdAt?: any
}

export interface Enquiry {
  id: string
  vendorId: string
  vendorName?: string
  coupleId: string
  message: string
  date?: Date
  guests?: number
  budget?: number
  status: 'pending' | 'replied' | 'closed'
  createdAt?: any
}

export interface Review {
  id: string
  vendorId: string
  coupleId: string
  bookingId: string
  rating: number
  comment: string
  createdAt?: any
}

export interface Expense {
  id: string
  name: string
  amount: number
  category: 'venue' | 'catering' | 'photography' | 'decor' | 'fashion' | 'beauty' | 'music' | 'transport' | 'cake' | 'other'
  paid: boolean
  date: Date
  vendorId?: string
  notes?: string
}

export interface WeatherData {
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
}

export interface SavedVendor {
  vendorId: string
  savedAt: Date
}

export interface VendorView {
  vendorId: string
  viewedAt: Date
}

export interface WeddingStats {
  totalGuests: number
  confirmedGuests: number
  pendingGuests: number
  declinedGuests: number
  maybeGuests: number
  vendorsBooked: number
  tasksCompleted: number
  tasksTotal: number
  daysUntilWedding: number
  budgetUsed: number
  budgetRemaining: number
  profileCompletion: number
}
