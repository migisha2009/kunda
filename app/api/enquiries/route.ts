import { NextRequest, NextResponse } from 'next/server'
import { createEnquiry } from '../../../lib/firestore'
import { sendWhatsApp, messages } from '../../../lib/whatsapp'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorId, coupleId, message } = body

    if (!vendorId || !coupleId || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: vendorId, coupleId, message' 
        },
        { status: 400 }
      )
    }

    console.log('Creating enquiry:', { vendorId, coupleId, message })

    await createEnquiry({
      vendorId,
      coupleId,
      message,
      status: 'pending'
    })

    console.log('Enquiry created successfully')

    // Send WhatsApp notification to vendor (non-blocking)
    try {
      const vendorDoc = await getDoc(doc(db, 'users', vendorId))
      const vendorData = vendorDoc.data()
      const vendorPhone = vendorData?.phone

      if (vendorPhone) {
        // Get couple name for the message
        const coupleDoc = await getDoc(doc(db, 'users', coupleId))
        const coupleData = coupleDoc.data()
        const coupleName = coupleData?.name || 'A Couple'

        await sendWhatsApp(
          vendorPhone,
          messages.newEnquiry(coupleName, message)
        )
        console.log('WhatsApp notification sent successfully')
      } else {
        console.log('No vendor phone number found for WhatsApp notification')
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError)
      // Don't fail the request if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry created successfully'
    })
  } catch (error) {
    console.error('Enquiry API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create enquiry' 
      },
      { status: 500 }
    )
  }
}
