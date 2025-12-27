import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For now, return mock transcription
    // In production, integrate with OpenAI Whisper API or another service
    const mockTranscriptions = [
      'I have experience with React and Node.js',
      'I can implement RESTful APIs and databases',
      'My problem-solving approach is to break down complex tasks',
      'I prefer working in collaborative environments',
      'I have shipped several production applications',
    ]

    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length)
    const text = mockTranscriptions[randomIndex]

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
