import { askAI } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, weddingContext } = 
      await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message required' }, 
        { status: 400 }
      )
    }

    const system = `You are Kunda AI, a friendly 
    wedding planning assistant for couples in 
    Rwanda and Africa. You help with:
    - Wedding planning and timelines
    - Budget advice in RWF and USD
    - Venue and vendor recommendations in Kigali
    - Guest management tips
    - Rwandan wedding traditions (Gusaba, Kwanjula)
    - Wedding day schedules
    
    Current wedding details:
    ${weddingContext ? JSON.stringify(weddingContext) : 'Not set yet'}
    
    Be warm, concise (under 120 words per reply),
    and specific to Rwanda/Africa context.
    Use occasional emojis. Be encouraging!`

    const reply = await askAI(system, message, 400)

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json(
      { error: 'AI unavailable, try again' },
      { status: 500 }
    )
  }
}
