import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    openai_api_key_set: !!process.env.OPENAI_API_KEY,
    openai_api_key_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    openai_api_key_starts_with: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) : 'NOT SET',
    all_env_vars_with_key: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('OPENAI')).join(', '),
    timestamp: new Date().toISOString()
  })
}
