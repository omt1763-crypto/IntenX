import React, { useEffect, useRef } from 'react'
import { ConversationMessage } from '@/hooks/useConversationManager'

interface ConversationDisplayProps {
  messages: ConversationMessage[]
  isListening?: boolean
  messageCount?: number
  loading?: boolean
}

export function ConversationDisplay({
  messages,
  isListening = false,
  messageCount = 0,
  loading = false
}: ConversationDisplayProps) {
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="lg:col-span-3 flex flex-col bg-white/80 backdrop-blur-xl border border-[#11cd68]/30 rounded-lg shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#11cd68]/20 bg-white/50">
        <h3 className="text-[#007a78] font-bold text-sm">
          💬 Conversation {messages.length > 0 && `(${messages.length})`}
        </h3>
      </div>

      {/* Conversation Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">
            Waiting for conversation to start...
          </p>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1 animate-in fade-in">
                <div
                  className={`text-xs font-bold ${
                    msg.role === 'ai' ? 'text-[#007a78]' : 'text-blue-600'
                  }`}
                >
                  {msg.role === 'ai' ? '🤖 AI Assistant' : '👤 You'}
                </div>
                <div
                  className={`text-xs leading-relaxed ml-2 p-3 rounded-lg whitespace-pre-wrap break-words ${
                    msg.role === 'ai'
                      ? 'bg-[#f0fdf4] border border-[#11cd68]/50 text-slate-800'
                      : 'bg-blue-50 border border-blue-300 text-slate-800'
                  }`}
                >
                  {msg.content || '(empty message)'}
                </div>
                <div className="text-xs text-slate-400 ml-2">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString()
                    : ''}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </>
        )}
      </div>

      {/* Status indicators */}
      <div className="border-t border-[#11cd68]/20 p-3 bg-white/50 space-y-2 text-xs">
        {isListening && (
          <div className="p-2 bg-[#fff3cd] border border-[#ffc107]/50 rounded-lg">
            <p className="text-[#856404] font-semibold">🤖 AI Speaking</p>
          </div>
        )}

        {!isListening && messages.length > 0 && (
          <div className="p-2 bg-[#d1ecf1] border border-[#0c5460]/30 rounded-lg">
            <p className="text-[#0c5460] font-semibold">🎤 Your Turn</p>
          </div>
        )}

        {loading && (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-gray-600 font-semibold">⏳ Saving conversation...</p>
          </div>
        )}
      </div>
    </div>
  )
}
