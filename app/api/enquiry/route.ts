import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vendorId, coupleId, message } = body

    if (!vendorId || !coupleId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const enquiry = {
      vendorId,
      coupleId,
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'enquiries'), enquiry)

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error) {
    console.error('Enquiry API error:', error)
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500 })
  }
}
