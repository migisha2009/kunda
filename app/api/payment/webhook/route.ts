import { NextRequest, NextResponse } from 'next/server'
import Flutterwave from 'flutterwave-node-v3'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import crypto from 'crypto'

// Initialize Flutterwave lazily to avoid build-time errors
function getFlutterwaveInstance() {
  return new Flutterwave(process.env.FLUTTERWAVE_SECRET_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('verif-hash')
    
    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET!
    const hash = crypto.createHmac('sha256', secretHash).update(body).digest('hex')
    
    if (signature !== hash) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    // Handle payment completion
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const transactionId = event.data.id
      const txRef = event.data.tx_ref
      const amount = event.data.amount
      const currency = event.data.currency
      const meta = event.data.meta || {}

      // Verify the transaction
      const verification = await getFlutterwaveInstance().Payment.verify(txRef)
      
      if (verification.status === 'success' && verification.data) {
        const bookingId = meta.bookingId || verification.data.meta?.bookingId
        
        if (bookingId) {
          // Get booking from Firestore
          const bookingRef = doc(db, 'bookings', bookingId)
          const bookingSnap = await getDoc(bookingRef)
          
          if (bookingSnap.exists()) {
            const bookingData = bookingSnap.data()
            
            // Update booking status to paid
            await updateDoc(bookingRef, {
              status: 'paid',
              paymentRef: txRef,
              paidAt: new Date(),
              paymentAmount: amount,
              paymentCurrency: currency,
              transactionId: transactionId
            })
            
            console.log(`Booking ${bookingId} marked as paid`)
          } else {
            console.error(`Booking ${bookingId} not found`)
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint' })
}
