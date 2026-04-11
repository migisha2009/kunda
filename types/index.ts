export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'couple' | 'vendor' | 'admin'
  createdAt?: any
}

export interface Pricing {
  min: number
  max: number
  currency: string
}

export interface Vendor {
  id: string
  userId: string
  businessName: string
  category: string
  bio: string
  location: string
  portfolioImages: string[]
  pricing: Pricing
  rating: number
  reviewCount: number
  verified: boolean
  createdAt?: any
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
}

export interface Guest {
  id: string
  weddingId: string | null
  coupleId: string
  name: string
  email: string
  phone: string
  rsvpStatus: 'pending' | 'attending' | 'declined' | 'maybe'
  dietaryPreferences: string
  tableNumber?: number
  inviteToken: string
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
  guestCount: number
  budget: Budget
  checklist: ChecklistItem[]
  coupleName1?: string
  coupleName2?: string
  ceremonyTime?: string
  receptionTime?: string
  dresscode?: string
  messageToGuests?: string
  scheduleItems?: ScheduleItem[]
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
  coupleId: string
  message: string
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
