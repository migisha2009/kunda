import { askAI } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      type, speakerName, coupleName1,
      coupleName2, tone, memories, minutes 
    } = await request.json()

    const words = (minutes || 3) * 130

    const system = `You are a wedding speech 
    writer for African weddings. Write heartfelt,
    culturally appropriate speeches. Blend modern
    and Rwandan traditional elements when fitting.
    Include a proverb or blessing if appropriate.`

    const prompt = `Write ${type} speech:
    Speaker: ${speakerName}
    Couple: ${coupleName1} & ${coupleName2}
    Tone: ${tone || 'heartfelt'}
    Key memories/notes: ${memories || 'wonderful couple'}
    Length: approximately ${words} words
    
    Structure: Opening, body with stories/wishes,
    toast/blessing at end.`

    const speech = await askAI(system, prompt, 600)

    return NextResponse.json({ speech })
  } catch (error) {
    return NextResponse.json(
      { error: 'Speech AI unavailable' },
      { status: 500 }
    )
  }
}
