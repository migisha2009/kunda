import { askAIJSON } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      ceremonyTime, receptionTime,
      guestCount, hasPhotographer,
      hasBand, traditions 
    } = await request.json()

    const system = `You are a wedding coordinator
    for Rwanda/Africa. Create detailed realistic
    wedding day timelines. Include buffer time.
    Consider Rwandan wedding flow and customs.
    Return only valid JSON.`

    const prompt = `Create wedding day timeline:
    Ceremony: ${ceremonyTime || '14:00'}
    Reception: ${receptionTime || '17:00'}
    Guests: ${guestCount || 100}
    Photographer: ${hasPhotographer ? 'yes' : 'no'}
    Live band: ${hasBand ? 'yes' : 'no'}
    Traditions: ${traditions || 'standard'}
    
    Return JSON:
    {
      "events": [
        {
          "time": "HH:MM",
          "event": "string",
          "duration": number (minutes),
          "category": "preparation|ceremony|photos|reception|other",
          "notes": "string"
        }
      ],
      "tips": ["string"]
    }`

    const result = await askAIJSON(system, prompt, 800)

    return NextResponse.json(result || { events: [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Timeline AI unavailable' },
      { status: 500 }
    )
  }
}
