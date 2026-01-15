import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  console.log('[Resume Health Check] Starting...')
  
  // Check environment variables
  const apiKeySet = !!process.env.OPENAI_API_KEY
  console.log('[Resume Health Check] OPENAI_API_KEY set:', apiKeySet)
  
  if (!apiKeySet) {
    return NextResponse.json({
      status: 'error',
      message: 'OPENAI_API_KEY is not set',
      openai_api_key_set: false
    }, { status: 500 })
  }
  
  // Try to create OpenAI client
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    console.log('[Resume Health Check] OpenAI client created successfully')
    
    // Try a simple API call
    console.log('[Resume Health Check] Testing OpenAI API call...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a test assistant. Respond with "test successful" only.'
        },
        {
          role: 'user',
          content: 'Test'
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    })
    
    const content = response.choices[0].message.content
    console.log('[Resume Health Check] ✅ API call successful:', content)
    
    return NextResponse.json({
      status: 'success',
      message: 'OpenAI API is working',
      openai_api_key_set: true,
      api_response: content,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Resume Health Check] ❌ Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({
      status: 'error',
      message: 'OpenAI API test failed',
      error: errorMessage,
      openai_api_key_set: true,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
