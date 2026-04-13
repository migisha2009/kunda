import { askAI } from '../../../../../lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessName, category, location,
      yearsExperience, specialties, existingBio 
    } = await request.json()

    const system = `You are a professional 
    copywriter for wedding vendors in Rwanda/Africa.
    Write compelling, warm vendor bios that attract
    couples. Max 120 words. Be specific and genuine.`

    const prompt = `Write professional bio for:
    Business: ${businessName}
    Category: ${category}
    Location: ${location}
    Experience: ${yearsExperience || '2+'} years
    Specialties: ${specialties || category}
    Current bio: ${existingBio || 'none yet'}
    
    Make it warm, professional, and specific 
    to Rwanda wedding market.`

    const bio = await askAI(system, prompt, 200)

    return NextResponse.json({ bio })
  } catch (error) {
    return NextResponse.json(
      { error: 'Bio AI unavailable' },
      { status: 500 }
    )
  }
}
