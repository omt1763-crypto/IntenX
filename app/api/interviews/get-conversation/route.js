import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Get conversation history from the interview
 * This retrieves messages that have been saved during the interview
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const interviewId = searchParams.get('interviewId')
    const applicantId = searchParams.get('applicantId')

    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      )
    }

    console.log('[GetConversation API] Fetching conversation:', { interviewId, applicantId })

    // Try to get from interview_conversations table
    const { data, error } = await supabaseAdmin
      .from('interview_conversations')
      .select('*')
      .eq('interview_id', interviewId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (table exists but empty)
      if (error.code !== 'PGRST301') {
        // PGRST301 = relation does not exist
        console.error('[GetConversation API] Database error:', error)
        return NextResponse.json(
          {
            success: false,
            messages: [],
            message: 'Conversation not found yet'
          },
          { status: 200 }
        )
      }
    }

    if (data) {
      console.log('[GetConversation API] Found conversation with', data.message_count, 'messages')
      return NextResponse.json({
        success: true,
        conversation: data,
        messages: data.messages || [],
        messageCount: data.message_count
      }, { status: 200 })
    }

    return NextResponse.json({
      success: false,
      messages: [],
      message: 'Conversation not found'
    }, { status: 200 })
  } catch (error) {
    console.error('[GetConversation API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Stream conversation updates in real-time
 */
export async function POST(req) {
  try {
    const { interviewId, applicantId, messageType = 'both' } = await req.json()

    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      )
    }

    console.log('[GetConversation API] POST - Getting latest messages:', { interviewId, messageType })

    // Get latest conversation
    const { data, error } = await supabaseAdmin
      .from('interview_conversations')
      .select('messages, message_count, updated_at')
      .eq('interview_id', interviewId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.warn('[GetConversation API] No conversation data yet')
      return NextResponse.json({
        success: false,
        messages: [],
        messageCount: 0
      }, { status: 200 })
    }

    let messages = data.messages || []

    // Filter by type if needed
    if (messageType === 'ai') {
      messages = messages.filter(m => m.role === 'ai')
    } else if (messageType === 'user') {
      messages = messages.filter(m => m.role === 'user')
    }

    return NextResponse.json({
      success: true,
      messages,
      messageCount: data.message_count,
      updatedAt: data.updated_at
    }, { status: 200 })
  } catch (error) {
    console.error('[GetConversation API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
