import { NextRequest, NextResponse } from 'next/server'
import Flutterwave from 'flutterwave-node-v3'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'

const flw = new Flutterwave(process.env.FLUTTERWAVE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount } = await request.json()

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and amount' },
        { status: 400 }
      )
    }

    // Get booking details from Firestore
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingSnap = await getDoc(bookingRef)

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = bookingSnap.data()

    // Create payment link with Flutterwave
    const paymentData = {
      tx_ref: `booking_${bookingId}_${Date.now()}`,
      amount: amount,
      currency: bookingData.currency || 'USD',
      payment_options: 'card,banktransfer,ussd',
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      customer: {
        email: 'customer@example.com', // This should come from user data
        name: 'Customer Name', // This should come from user data
      },
      customizations: {
        title: 'Wedding Service Payment',
        description: `Payment for booking ${bookingId}`,
        logo: 'https://your-logo-url.com/logo.png'
      },
      meta: {
        bookingId: bookingId
      }
    }

    const response = await flw.Payment.link(paymentData)

    if (response.status === 'success' && response.data?.link) {
      // Update booking with payment reference
      await updateDoc(bookingRef, {
        paymentRef: response.data.link.tx_ref,
        status: 'pending'
      })

      return NextResponse.json({
        success: true,
        paymentLink: response.data.link.link_url,
        tx_ref: response.data.link.tx_ref
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to create payment link', details: response },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
