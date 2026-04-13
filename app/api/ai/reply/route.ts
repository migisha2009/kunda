import { askAI } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      enquiryMessage, businessName,
      category, minPrice, currency 
    } = await request.json()

    const system = `You are helping a wedding 
    vendor in Rwanda reply to couple enquiries.
    Write professional, warm replies that convert
    enquiries to bookings. Max 80 words.`

    const prompt = `Write reply for:
    Vendor: ${businessName} (${category})
    Starting price: ${minPrice} ${currency}
    Couple's enquiry: "${enquiryMessage}"
    
    Be professional, warm, mention availability
    and next steps clearly.`

    const reply = await askAI(system, prompt, 200)

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json(
      { error: 'Reply AI unavailable' },
      { status: 500 }
    )
  }
}
