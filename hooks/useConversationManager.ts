import { useState, useCallback, useRef, useEffect } from 'react'

export interface ConversationMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: Date
  status?: 'pending' | 'complete'
}

export interface UseConversationManagerReturn {
  messages: ConversationMessage[]
  addMessage: (role: 'ai' | 'user', content: string) => string
  updateMessage: (id: string, updates: Partial<ConversationMessage>) => void
  clearMessages: () => void
  saveToDatabase: (interviewId: string, applicantId?: string) => Promise<boolean>
  getConversationText: () => string
}

export function useConversationManager(): UseConversationManagerReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const messageCounterRef = useRef(0)

  // Add a new message to the conversation
  const addMessage = useCallback((role: 'ai' | 'user', content: string): string => {
    const id = `msg-${Date.now()}-${messageCounterRef.current++}`
    const newMessage: ConversationMessage = {
      id,
      role,
      content,
      timestamp: new Date(),
      status: 'complete'
    }

    setMessages((prev) => [...prev, newMessage])
    console.log(`[ConversationManager] Added ${role} message:`, content.substring(0, 100))

    return id
  }, [])

  // Update an existing message
  const updateMessage = useCallback((id: string, updates: Partial<ConversationMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    )
    console.log(`[ConversationManager] Updated message ${id}`)
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
    messageCounterRef.current = 0
    console.log('[ConversationManager] Cleared all messages')
  }, [])

  // Get conversation as formatted text
  const getConversationText = useCallback((): string => {
    return messages
      .map((msg) => {
        const role = msg.role === 'ai' ? 'AI Assistant' : 'Candidate'
        const timestamp = msg.timestamp.toLocaleTimeString()
        return `[${timestamp}] ${role}: ${msg.content}`
      })
      .join('\n\n')
  }, [messages])

  // Save conversation to database
  const saveToDatabase = useCallback(
    async (interviewId: string, applicantId?: string): Promise<boolean> => {
      try {
        if (messages.length === 0) {
          console.warn('[ConversationManager] No messages to save')
          return false
        }

        const conversationData = {
          interviewId,
          applicantId: applicantId || null,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            status: msg.status || 'complete'
          })),
          messageCount: messages.length,
          startTime: messages[0]?.timestamp.toISOString(),
          endTime: messages[messages.length - 1]?.timestamp.toISOString(),
          conversationText: getConversationText()
        }

        console.log('[ConversationManager] Saving conversation:', {
          interviewId,
          messageCount: messages.length
        })

        // Call API to save conversation
        const response = await fetch('/api/interviews/save-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conversationData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save conversation')
        }

        const result = await response.json()
        console.log('[ConversationManager] Conversation saved successfully:', result)

        return true
      } catch (error) {
        console.error('[ConversationManager] Error saving conversation:', error)
        return false
      }
    },
    [messages, getConversationText]
  )

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    saveToDatabase,
    getConversationText
  }
}
