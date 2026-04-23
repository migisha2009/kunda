import { NextRequest, NextResponse } from 'next/server'
import { getAllVendors } from '../../../lib/firestore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')

    const vendors = await getAllVendors()
    
    // Filter vendors based on search params
    const filteredVendors = vendors.filter(vendor => {
      if (category && vendor.category !== category) {
        return false
      }
      if (location && !vendor.location.toLowerCase().includes(location.toLowerCase())) {
        return false
      }
      return true
    })

    return NextResponse.json({
      success: true,
      data: filteredVendors,
      count: filteredVendors.length
    })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendors' 
      },
      { status: 500 }
    )
  }
}
