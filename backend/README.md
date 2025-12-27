# Backend Setup Guide

## 📦 Installation

### 1. Prerequisites
- Python 3.10+
- OpenAI API key

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Create `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

## 🚀 Running the Server

### Start the Backend

```bash
python main.py
```

The server will start on `http://localhost:8000`

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T10:00:00",
  "active_connections": 0
}
```

## 🧪 Testing

### Run Test Client

```bash
python test_client.py
```

This simulates a full interview conversation with the backend.

## 🔌 WebSocket API

### Connection

```
ws://localhost:8000/ws/{client_id}
```

Replace `{client_id}` with a unique identifier (e.g., UUID or user ID).

### Message Types

#### 1. Client → Server: Audio Chunk
```json
{
  "type": "audio_chunk",
  "data": [array of int16 PCM samples],
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 2. Client → Server: Send for AI Processing
```json
{
  "type": "send_for_AI_processing",
  "timestamp": "2024-11-25T10:00:00"
}
```

The server will transcribe accumulated audio and generate a response.

#### 3. Client → Server: Start Interview
```json
{
  "type": "start_interview",
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 4. Client → Server: End Interview
```json
{
  "type": "end_interview",
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 5. Server → Client: Thinking
```json
{
  "type": "thinking",
  "message": "Let me consider your response...",
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 6. Server → Client: Thinking Complete
```json
{
  "type": "thinking_complete",
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 7. Server → Client: AI Audio Chunk
```json
{
  "type": "ai_audio_chunk",
  "amplitude": 0.75,
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 8. Server → Client: AI Response Complete
```json
{
  "type": "ai_response_complete",
  "text": "That's a great answer. Tell me about...",
  "timestamp": "2024-11-25T10:00:00"
}
```

#### 9. Server → Client: Binary Audio Data
Raw audio bytes in MP3 format (sent after ai_response_complete)

#### 10. Server → Client: Error
```json
{
  "type": "error",
  "message": "Description of error",
  "timestamp": "2024-11-25T10:00:00"
}
```

## 🏗️ Architecture

### AudioProcessor
- Manages incoming audio chunks
- Calculates RMS amplitude for visualization
- Buffers audio for transcription

### ConversationManager
- Maintains conversation history
- Manages system prompt
- Provides context for AI responses

### RealtimeTranscriber
- Uses OpenAI Whisper API for speech-to-text
- Handles transcription errors

### AIInterviewer
- Generates intelligent responses using GPT-4
- Converts responses to speech using TTS
- Manages thinking/processing states

### WebSocketManager
- Handles multiple concurrent connections
- Routes messages to appropriate handlers
- Manages connection lifecycle

## 🔧 Configuration

### Audio Settings
- **Sample Rate**: 16kHz (16000 Hz)
- **Bit Depth**: 16-bit PCM
- **Chunk Size**: 1024 samples (64ms)

### AI Settings
- **Model**: gpt-4-turbo-preview
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 150 (concise responses)

### TTS Settings
- **Model**: tts-1 (fast)
- **Voice**: alloy (professional)
- **Format**: MP3

## 📊 Conversation Flow

```
1. Client connects via WebSocket
2. Client sends "start_interview"
3. Server generates opening message
4. Server converts to speech and streams back
5. Client plays audio
6. Client records user response
7. Client sends audio chunks
8. Client sends "send_for_AI_processing" after 1s silence
9. Server transcribes audio
10. Server generates AI response
11. Server sends "thinking" event
12. Server generates TTS audio
13. Server streams audio back with amplitude values
14. Server sends "ai_response_complete" with text
15. Repeat from step 5
```

## 🛠️ Frontend Integration

Update your `useMicrophoneCapture` hook to use:
```
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws/
```

The client ID will be appended to the WebSocket URL.

## 📝 Logging

All operations are logged to console with timestamps:
```
2024-11-25 10:00:00 - root - INFO - [WS] Client abc123 connected
2024-11-25 10:00:01 - root - INFO - [User]: Hello
2024-11-25 10:00:02 - root - INFO - [AI] Generating response...
2024-11-25 10:00:03 - root - INFO - [TTS] Converting to speech: Hello there...
```

## 🚨 Troubleshooting

### Connection Issues
- Check OpenAI API key is set
- Verify CORS settings match frontend URL
- Ensure backend is running on port 8000

### Transcription Issues
- Verify audio data is in correct PCM format
- Check that chunks are 16kHz sample rate
- Monitor OpenAI API quotas

### TTS Issues
- Check OpenAI API has sufficient quota
- Verify text is not too long (150 token max)
- Monitor TTS API rate limits

### Slow Responses
- Consider using async processing for multiple users
- Optimize token limits for faster generation
- Use TTS model "tts-1" (not "tts-1-hd") for speed

## 📞 Support

For issues:
1. Check logs for error messages
2. Verify OpenAI API key works with OpenAI CLI
3. Test with Python test client
4. Check CORS headers in responses

## 🔐 Production Considerations

Before deploying to production:
1. Move API keys to secure secret manager
2. Add rate limiting per client_id
3. Implement authentication/authorization
4. Add request validation
5. Monitor API usage and costs
6. Set up proper error handling and alerts
7. Use environment-specific configurations
8. Enable request logging for debugging
