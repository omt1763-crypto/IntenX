import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    const {
      interviewId,
      applicantId,
      messages,
      messageCount,
      startTime,
      endTime,
      conversationText
    } = await req.json()

    console.log('[SaveConversation API] Request received:', {
      interviewId,
      applicantId,
      messageCount
    })

    // Validate required fields
    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages to save' },
        { status: 400 }
      )
    }

    // Prepare conversation data
    const conversationRecord = {
      id: `conv-${Date.now()}`,
      interview_id: interviewId,
      applicant_id: applicantId,
      messages: messages,
      message_count: messageCount,
      start_time: startTime,
      end_time: endTime,
      conversation_text: conversationText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('[SaveConversation API] Saving conversation record')

    // Insert or update conversation in database
    const { data, error } = await supabaseAdmin
      .from('interview_conversations')
      .insert([conversationRecord])
      .select()
      .single()

    if (error) {
      // If table doesn't exist, create it
      if (error.code === 'PGRST116') {
        console.log('[SaveConversation API] Table does not exist, creating...')
        
        // Create the table
        const createTableResult = await supabaseAdmin.rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.interview_conversations (
              id TEXT PRIMARY KEY,
              interview_id TEXT NOT NULL,
              applicant_id TEXT,
              messages JSONB NOT NULL,
              message_count INTEGER,
              start_time TIMESTAMP,
              end_time TIMESTAMP,
              conversation_text TEXT,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            );
          `
        }).catch(e => {
          console.error('[SaveConversation API] Error creating table:', e)
          return null
        })

        // Try inserting again
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('interview_conversations')
          .insert([conversationRecord])
          .select()
          .single()

        if (retryError) {
          console.error('[SaveConversation API] Database error after table creation:', retryError)
          return NextResponse.json(
            {
              error: retryError.message || 'Failed to save conversation',
              details: retryError.details,
              code: retryError.code
            },
            { status: 500 }
          )
        }

        console.log('[SaveConversation API] Conversation saved successfully after table creation:', retryData.id)
        return NextResponse.json({
          success: true,
          conversation: retryData,
          message: 'Conversation saved successfully'
        }, { status: 201 })
      }

      console.error('[SaveConversation API] Database error:', error)
      return NextResponse.json(
        {
          error: error.message || 'Failed to save conversation',
          details: error.details,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('[SaveConversation API] Conversation saved successfully:', data.id)

    // Also update the interview record with conversation reference
    if (interviewId) {
      const { error: updateError } = await supabaseAdmin
        .from('interviews')
        .update({
          conversation_id: data.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId)

      if (updateError) {
        console.warn('[SaveConversation API] Warning: Could not update interview record:', updateError)
        // Don't fail, just warn
      }
    }

    return NextResponse.json({
      success: true,
      conversation: data,
      message: 'Conversation saved successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('[SaveConversation API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
