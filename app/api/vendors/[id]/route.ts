import { NextRequest, NextResponse } from 'next/server'
import { getVendor } from '../../../../lib/firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await getVendor(params.id)
    
    if (!vendor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor not found' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor
    })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor' 
      },
      { status: 500 }
    )
  }
}
