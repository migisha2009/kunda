import { askAIJSON } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      totalBudget, currency, guestCount, 
      location, preferences 
    } = await request.json()

    const system = `You are a wedding budget 
    expert for Rwanda/Africa. Generate realistic
    budget breakdowns based on local market prices.
    Return only valid JSON.`

    const prompt = `Generate wedding budget for:
    Total: ${totalBudget} ${currency}
    Guests: ${guestCount}
    Location: ${location || 'Kigali, Rwanda'}
    Preferences: ${preferences?.join(', ') || 'standard'}
    
    Return JSON with:
    {
      "categories": [
        {
          "name": "string",
          "percentage": number,
          "amount": number,
          "tip": "string"
        }
      ],
      "savingsTips": ["string"],
      "totalAllocated": number,
      "message": "string"
    }`

    const result = await askAIJSON(system, prompt, 800)

    if (!result) {
      return NextResponse.json(
        { error: 'Could not generate budget' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Budget AI unavailable' },
      { status: 500 }
    )
  }
}
