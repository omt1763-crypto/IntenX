import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput, conversationHistory = [] } = body

    if (!userInput) {
      return NextResponse.json(
        { error: 'No user input provided' },
        { status: 400 }
      )
    }

    // Mock AI responses for interview questions
    const interviewQuestions = [
      'Tell me about a challenging project you worked on and how you overcame obstacles.',
      'What technologies are you most comfortable with, and why?',
      'Describe your approach to debugging complex issues in your code.',
      'How do you stay updated with new technologies and best practices?',
      'Tell me about a time you had to collaborate with a difficult team member.',
      'What is your greatest strength as a developer?',
      'How do you handle tight deadlines and pressure?',
      'Describe your experience with version control and team workflows.',
      'What motivates you in your career as a software engineer?',
      'Do you have any questions for us about the role or company?',
    ]

    // Select a random question (in production, this would use GPT context)
    const randomIndex = Math.floor(Math.random() * interviewQuestions.length)
    const text = interviewQuestions[randomIndex]

    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI response error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
