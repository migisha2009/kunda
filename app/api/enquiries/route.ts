import { NextRequest, NextResponse } from 'next/server'
import { createEnquiry } from '../../../lib/firestore'

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

    await createEnquiry({
      vendorId,
      coupleId,
      message,
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      message: 'Enquiry created successfully'
    })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create enquiry' 
      },
      { status: 500 }
    )
  }
}
