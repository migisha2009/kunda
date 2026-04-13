import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export const askAI = async (
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 500
): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama3-8b-8192',
      max_tokens: maxTokens,
      temperature: 0.7,
    })
    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Groq AI error:', error)
    throw new Error('AI service unavailable')
  }
}

export const askAIJSON = async (
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1000
): Promise<any> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: systemPrompt + 
            '\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation.'
        },
        { role: 'user', content: userMessage }
      ],
      model: 'llama3-8b-8192',
      max_tokens: maxTokens,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    const text = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(text)
  } catch (error) {
    console.error('Groq JSON error:', error)
    return null
  }
}
