import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Mock TTS - generates a simple beep sound for demo
async function generateMockAudio(text: string): Promise<ArrayBuffer> {
  // Create a simple sine wave audio buffer
  const audioContext = new (global.AudioContext || (global as any).webkitAudioContext)()
  const sampleRate = audioContext.sampleRate
  const duration = Math.min(text.length * 0.05, 10) // ~50ms per character, max 10s
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
  const channelData = buffer.getChannelData(0)

  // Generate a simple beep pattern
  const frequency = 440 // A4 note
  for (let i = 0; i < buffer.length; i++) {
    channelData[i] = Math.sin((i / sampleRate) * frequency * 2 * Math.PI) * 0.3
  }

  // Fade in/out
  for (let i = 0; i < 1000; i++) {
    channelData[i] *= i / 1000
  }
  for (let i = buffer.length - 1000; i < buffer.length; i++) {
    channelData[i] *= (buffer.length - i) / 1000
  }

  return buffer.getChannelData(0).buffer
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // PRODUCTION: Use OpenAI TTS, ElevenLabs, or Google Cloud TTS
    // For now, return a mock audio response
    const audioBuffer = await generateMockAudio(text)

    // Create a WAV file from the audio buffer
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })

    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: 'Text-to-speech synthesis failed' },
      { status: 500 }
    )
  }
}
