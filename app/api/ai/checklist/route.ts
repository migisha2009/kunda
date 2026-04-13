import { askAIJSON } from '../../../../../lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      weddingDate, guestCount, 
      alreadyBooked, preferences 
    } = await request.json()

    const daysUntil = weddingDate 
      ? Math.ceil((new Date(weddingDate).getTime() - 
          Date.now()) / (1000 * 60 * 60 * 24))
      : 180

    const system = `You are a wedding planner 
    expert for Rwanda. Generate practical checklists
    with realistic timelines. Return only JSON.`

    const prompt = `Generate wedding checklist:
    Days until wedding: ${daysUntil}
    Guest count: ${guestCount || 100}
    Already booked: ${alreadyBooked?.join(', ') || 'nothing yet'}
    Preferences: ${preferences?.join(', ') || 'standard'}
    
    Return JSON:
    {
      "tasks": [
        {
          "id": "string",
          "task": "string",
          "category": "string",
          "priority": "high|medium|low",
          "dueMonthsBefore": number,
          "description": "string"
        }
      ],
      "urgentTasks": ["string"],
      "message": "string",
      "onTrack": boolean
    }`

    const result = await askAIJSON(system, prompt, 1000)

    return NextResponse.json(result || { tasks: [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Checklist AI unavailable' },
      { status: 500 }
    )
  }
}
