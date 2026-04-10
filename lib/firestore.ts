import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { User, Vendor, Wedding, Booking, Enquiry, Guest } from '../types'

// Helper function to convert Firestore document to typed object
const convertDoc = <T>(doc: QueryDocumentSnapshot<DocumentData>): T & { id: string } => {
  const data = doc.data()
  const converted = { ...data } as Record<string, unknown>
  
  // Convert Timestamp fields to Date
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = (converted[key] as Timestamp).toDate()
    }
  })
  
  return { ...converted as T, id: doc.id }
}

// Users
export const createUser = async (userId: string, data: Omit<User, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    const userData = {
      ...data,
      createdAt: new Date()
    }
    
    await setDoc(userRef, userData)
  } catch (error) {
    console.error('❌ Error creating Firestore user:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId,
      data
    })
    throw error
  }
}

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const data = convertDoc<User>(userSnap as QueryDocumentSnapshot<DocumentData>)
      return data
    }
    return null
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, data)
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Vendors
export const createVendor = async (data: Omit<Vendor, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const vendorRef = doc(collection(db, 'vendors'))
    await setDoc(vendorRef, {
      ...data,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error creating vendor:', error)
    throw error
  }
}

export const getVendor = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId)
    const vendorSnap = await getDoc(vendorRef)
    
    if (vendorSnap.exists()) {
      return convertDoc<Vendor>(vendorSnap as QueryDocumentSnapshot<DocumentData>)
    }
    return null
  } catch (error) {
    console.error('Error getting vendor:', error)
    throw error
  }
}

export const getAllVendors = async (): Promise<Vendor[]> => {
  try {
    const vendorsQuery = query(
      collection(db, 'vendors'),
      orderBy('rating', 'desc')
    )
    const querySnapshot = await getDocs(vendorsQuery)
    return querySnapshot.docs.map(doc => convertDoc<Vendor>(doc))
  } catch (error) {
    console.error('Error getting all vendors:', error)
    // Return empty array instead of throwing to prevent page crashes
    return []
  }
}

export const updateVendor = async (vendorId: string, data: Partial<Vendor>): Promise<void> => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId)
    await updateDoc(vendorRef, data)
  } catch (error) {
    console.error('Error updating vendor:', error)
    throw error
  }
}

export const getVendorByUserId = async (userId: string): Promise<Vendor | null> => {
  try {
    const vendorsQuery = query(
      collection(db, 'vendors'),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(vendorsQuery)
    
    if (querySnapshot.empty) {
      return null
    }
    
    return convertDoc<Vendor>(querySnapshot.docs[0])
  } catch (error) {
    console.error('Error getting vendor by user ID:', error)
    throw error
  }
}

export const createOrUpdateVendorProfile = async (userId: string, data: Omit<Vendor, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
  try {
    // Check if vendor profile already exists
    const existingVendor = await getVendorByUserId(userId)
    
    if (existingVendor) {
      // Update existing profile
      await updateVendor(existingVendor.id, data)
      return existingVendor.id
    } else {
      // Create new profile
      const vendorRef = doc(collection(db, 'vendors'))
      await setDoc(vendorRef, {
        ...data,
        userId,
        createdAt: new Date()
      })
      return vendorRef.id
    }
  } catch (error) {
    console.error('Error creating/updating vendor profile:', error)
    throw error
  }
}

// Weddings
export const createWedding = async (data: Omit<Wedding, 'id'>): Promise<void> => {
  try {
    const weddingRef = doc(collection(db, 'weddings'))
    await setDoc(weddingRef, data)
  } catch (error) {
    console.error('Error creating wedding:', error)
    throw error
  }
}

export const getWedding = async (weddingId: string): Promise<Wedding | null> => {
  try {
    const weddingRef = doc(db, 'weddings', weddingId)
    const weddingSnap = await getDoc(weddingRef)
    
    if (weddingSnap.exists()) {
      return convertDoc<Wedding>(weddingSnap as QueryDocumentSnapshot<DocumentData>)
    }
    return null
  } catch (error) {
    console.error('Error getting wedding:', error)
    throw error
  }
}

export const updateWedding = async (weddingId: string, data: Partial<Wedding>): Promise<void> => {
  try {
    const weddingRef = doc(db, 'weddings', weddingId)
    await updateDoc(weddingRef, data)
  } catch (error) {
    console.error('Error updating wedding:', error)
    throw error
  }
}

// Bookings
export const createBooking = async (data: Omit<Booking, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const bookingRef = doc(collection(db, 'bookings'))
    await setDoc(bookingRef, {
      ...data,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

export const getBookingsByCouple = async (coupleId: string): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('coupleId', '==', coupleId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(bookingsQuery)
    return querySnapshot.docs.map(doc => convertDoc<Booking>(doc))
  } catch (error) {
    console.error('Error getting bookings by couple:', error)
    throw error
  }
}

export const getBookingsByVendor = async (vendorId: string): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(bookingsQuery)
    return querySnapshot.docs.map(doc => convertDoc<Booking>(doc))
  } catch (error) {
    console.error('Error getting bookings by vendor:', error)
    throw error
  }
}

export const updateBookingStatus = async (bookingId: string, status: Booking['status']): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    await updateDoc(bookingRef, { status })
  } catch (error) {
    console.error('Error updating booking status:', error)
    throw error
  }
}

// Enquiries
export const createEnquiry = async (data: Omit<Enquiry, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const enquiryRef = doc(collection(db, 'enquiries'))
    await setDoc(enquiryRef, {
      ...data,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    throw error
  }
}

export const getEnquiriesByVendor = async (vendorId: string): Promise<Enquiry[]> => {
  try {
    const enquiriesQuery = query(
      collection(db, 'enquiries'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(enquiriesQuery)
    return querySnapshot.docs.map(doc => convertDoc<Enquiry>(doc))
  } catch (error) {
    console.error('Error getting enquiries by vendor:', error)
    throw error
  }
}

// Guests
export const createGuest = async (data: Omit<Guest, 'id' | 'createdAt' | 'inviteToken'>): Promise<string> => {
  try {
    const guestRef = doc(collection(db, 'guests'))
    const inviteToken = crypto.randomUUID()
    
    const guestData = {
      ...data,
      weddingId: data.weddingId || null, // Can be null if couple has no wedding yet
      rsvpStatus: "pending",
      dietaryPreferences: data.dietaryPreferences || "",
      tableNumber: data.tableNumber || null,
      inviteToken,
      coupleId: data.coupleId,
      createdAt: new Date()
    }
    
    await setDoc(guestRef, guestData)
    
    return guestRef.id
  } catch (error) {
    console.error('❌ Error creating guest:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      data
    })
    throw error
  }
}

export const getGuest = async (guestId: string): Promise<Guest | null> => {
  try {
    const guestRef = doc(db, 'guests', guestId)
    const guestSnap = await getDoc(guestRef)
    
    if (guestSnap.exists()) {
      return convertDoc<Guest>(guestSnap as QueryDocumentSnapshot<DocumentData>)
    }
    return null
  } catch (error) {
    console.error('Error getting guest:', error)
    throw error
  }
}

export const getGuestByToken = async (token: string): Promise<Guest | null> => {
  try {
    const guestsQuery = query(
      collection(db, 'guests'),
      where('inviteToken', '==', token)
    )
    const querySnapshot = await getDocs(guestsQuery)
    
    if (querySnapshot.empty) {
      return null
    }
    
    return convertDoc<Guest>(querySnapshot.docs[0])
  } catch (error) {
    console.error('Error getting guest by token:', error)
    throw error
  }
}

export const getGuestsByWedding = async (weddingId: string): Promise<Guest[]> => {
  try {
    const guestsQuery = query(
      collection(db, 'guests'),
      where('weddingId', '==', weddingId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(guestsQuery)
    return querySnapshot.docs.map(doc => convertDoc<Guest>(doc))
  } catch (error) {
    console.error('Error getting guests by wedding:', error)
    throw error
  }
}

export const updateGuestRSVP = async (
  guestId: string, 
  rsvpStatus: string, 
  dietaryPreferences?: string,
  tableNumber?: number
): Promise<void> => {
  try {
    const updateData: any = { rsvpStatus }
    if (dietaryPreferences !== undefined) {
      updateData.dietaryPreferences = dietaryPreferences
    }
    if (tableNumber !== undefined) {
      updateData.tableNumber = tableNumber
    }
    await updateDoc(doc(db, 'guests', guestId), updateData)
  } catch (error) {
    console.error('Error updating guest RSVP:', error)
    throw error
  }
}

export const deleteGuest = async (guestId: string): Promise<void> => {
  try {
    const guestRef = doc(db, 'guests', guestId)
    await deleteDoc(guestRef)
  } catch (error) {
    console.error('Error deleting guest:', error)
    throw error
  }
}
