# Conversation Manager Integration Guide

## Overview

To separate conversation management from the `useRealtimeAudio` hook, three new resources have been created:

1. **`useConversationManager`** hook - Manages conversation state independently
2. **`ConversationDisplay`** component - Renders conversation UI
3. **`/api/interviews/save-conversation`** endpoint - Persists conversations to database

## Why Separate Conversation Management?

- **Decoupling**: Conversation display is independent from audio functionality
- **Reusability**: Can use conversation manager in different interview types
- **Stability**: Changes to audio won't affect conversation display
- **Persistence**: Conversations are automatically saved to the database

## Implementation Steps

### Step 1: Update Your Interview Page

Replace the conversation state management in `app/interview/realtime/page.tsx`:

**Before:**
```typescript
const [conversation, setConversation] = useState<ConversationMessage[]>([])
```

**After:**
```typescript
import { useConversationManager } from '@/hooks/useConversationManager'
import { ConversationDisplay } from '@/components/ConversationDisplay'

const { messages, addMessage, saveToDatabase } = useConversationManager()
```

### Step 2: Add Messages from Audio Callback

In your interview page, when you receive messages from the realtime audio hook:

```typescript
const handleStart = async () => {
  // ... existing start logic ...
  
  await connect(
    (msg) => {
      // Add message to conversation manager instead of state
      addMessage(msg.role, msg.content)
    },
    interviewData?.skills,
    interviewData?.systemPrompt
  )
}
```

### Step 3: Replace Conversation Display

In your JSX where you render the conversation panel:

**Before:**
```tsx
<div className="lg:col-span-3 flex flex-col bg-white/80 ...">
  {/* Old conversation display code */}
</div>
```

**After:**
```tsx
<ConversationDisplay 
  messages={messages}
  isListening={isListening}
  loading={false}
/>
```

### Step 4: Save on Interview End

When ending the interview, save the conversation:

```typescript
const handleEnd = async () => {
  // ... existing end logic ...
  
  // Save conversation before ending
  await saveToDatabase(interviewId, applicantId)
  
  // Then cleanup and redirect
}
```

## API Integration

### Save Conversation Endpoint

**POST** `/api/interviews/save-conversation`

**Request Body:**
```json
{
  "interviewId": "interview-123",
  "applicantId": "applicant-456",
  "messages": [
    {
      "role": "ai",
      "content": "Question text",
      "timestamp": "2025-12-23T10:30:00Z",
      "status": "complete"
    }
  ],
  "messageCount": 5,
  "startTime": "2025-12-23T10:30:00Z",
  "endTime": "2025-12-23T10:35:00Z",
  "conversationText": "Full conversation as text"
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv-timestamp",
    "interview_id": "interview-123",
    "message_count": 5
  },
  "message": "Conversation saved successfully"
}
```

## Database Schema

The API creates the following table automatically if it doesn't exist:

```sql
CREATE TABLE interview_conversations (
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
```

## Hook API Reference

### `useConversationManager()`

#### Methods:

##### `addMessage(role, content): string`
Adds a message to the conversation
- **Parameters:**
  - `role`: 'ai' | 'user'
  - `content`: Message text
- **Returns:** Message ID (for later updates)

##### `updateMessage(id, updates)`
Updates an existing message
- **Parameters:**
  - `id`: Message ID from `addMessage`
  - `updates`: Partial message object

##### `clearMessages()`
Clears all messages from conversation

##### `getConversationText(): string`
Returns conversation as formatted text with timestamps

##### `saveToDatabase(interviewId, applicantId?): Promise<boolean>`
Saves conversation to Supabase
- **Parameters:**
  - `interviewId`: Required - ID of the interview
  - `applicantId`: Optional - ID of the applicant
- **Returns:** Promise<boolean> - Success status

## Usage Example

```typescript
'use client'

import { useRealtimeAudio } from '@/hooks/useRealtimeAudio'
import { useConversationManager } from '@/hooks/useConversationManager'
import { ConversationDisplay } from '@/components/ConversationDisplay'

export default function InterviewPage() {
  const { connected, isListening, connect, disconnect } = useRealtimeAudio()
  const { messages, addMessage, saveToDatabase } = useConversationManager()

  const handleStart = async () => {
    await connect(
      (msg) => addMessage(msg.role, msg.content),
      skills,
      systemPrompt
    )
  }

  const handleEnd = async () => {
    // Save conversation
    const saved = await saveToDatabase(interviewId, applicantId)
    if (saved) {
      console.log('Conversation saved!')
    }
    
    // Disconnect audio
    await disconnect()
  }

  return (
    <div className="grid grid-cols-10 gap-4">
      <div className="col-span-7">
        {/* Camera and controls */}
      </div>
      <ConversationDisplay 
        messages={messages}
        isListening={isListening}
      />
    </div>
  )
}
```

## Features

✅ **Separate Concerns** - Conversation is independent from audio
✅ **Auto-Scroll** - Automatically scrolls to latest message
✅ **Message IDs** - Each message has unique ID for tracking
✅ **Timestamps** - All messages include timestamp
✅ **Database Persistence** - Automatic table creation and saving
✅ **Reusable Component** - Can use in multiple interview types
✅ **Status Indicators** - Shows when AI is speaking or it's user's turn

## Troubleshooting

**Conversation not appearing?**
- Ensure `addMessage()` is being called from the audio callback
- Check that messages object from hook is being passed to component

**Save fails?**
- Ensure interviewId is provided
- Check API logs for database errors
- Verify interview_conversations table exists in Supabase

**Messages not saving to database?**
- Check that `/api/interviews/save-conversation` endpoint is accessible
- Verify Supabase connection in `@/lib/supabase`
- Check browser console for API errors

## Next Steps

1. Update your interview page to use the new conversation manager
2. Replace the conversation display JSX with ConversationDisplay component
3. Call `saveToDatabase()` when interview ends
4. Test the conversation flow and database persistence
