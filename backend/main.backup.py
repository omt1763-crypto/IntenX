"""
Interview AI Backend - Real-time Audio Processing WebSocket Server
Fixed OpenAI Realtime authentication
"""

import os
import asyncio
import logging
import base64
import json
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8001))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.audio_buffers: Dict[str, bytearray] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.audio_buffers[client_id] = bytearray()
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.audio_buffers:
            del self.audio_buffers[client_id]
        logger.info(f"Client {client_id} disconnected")

    async def send_json(self, client_id: str, message: Dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                # Client may have disconnected - this is normal with Realtime API
                pass

    def get_connection(self, client_id: str) -> Optional[WebSocket]:
        return self.active_connections.get(client_id)

ws_manager = ConnectionManager()

# Create FastAPI app
app = FastAPI(
    title="Interview AI Backend",
    description="Real-time Audio Processing WebSocket Server",
    version="3.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
async def root():
    return {"status": "running", "timestamp": datetime.now().isoformat()}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(ws_manager.active_connections)
    }

# OpenAI Realtime session endpoint
@app.get("/api/realtime-token")
async def get_realtime_token():
    """
    Create a session token for OpenAI Realtime API
    """
    try:
        import httpx
        
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        logger.info("Creating OpenAI Realtime session...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.openai.com/v1/realtime/sessions',
                headers={
                    'Authorization': f'Bearer {OPENAI_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'gpt-4o-realtime-preview',
                    'voice': 'alloy',
                    'instructions': 'You are a professional AI interviewer. Conduct a technical interview, ask relevant questions about programming, algorithms, system design, and software engineering concepts. Be conversational but professional.',
                    'modalities': ['text', 'audio'],
                    'temperature': 0.7,
                    'input_audio_format': 'pcm16',
                    'output_audio_format': 'pcm16',
                    'max_response_output_tokens': 1000,
                },
                timeout=30.0,
            )
        
        if response.status_code != 200:
            logger.error(f"OpenAI session creation failed: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500, 
                detail=f"OpenAI API error: {response.status_code}"
            )
        
        data = response.json()
        logger.info(f"Session created: {data.get('id')}")
        
        # Return the session details
        return {
            "success": True,
            "session_id": data.get('id'),
            "session_token": data.get('client_secret', {}).get('value'),
            "expires_at": data.get('expires_at'),
        }
    
    except Exception as e:
        logger.error(f"Error getting realtime token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Simple AI service for fallback processing
class SimpleAIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Simple transcription using OpenAI Whisper"""
        try:
            import httpx
            
            # Whisper API requires multipart/form-data with file upload
            files = {
                'file': ('audio.wav', audio_bytes, 'audio/wav'),
            }
            data = {
                'model': 'whisper-1',
                'language': 'en',
                'response_format': 'text'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    headers={
                        'Authorization': f'Bearer {self.api_key}',
                    },
                    files=files,
                    data=data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.text.strip()
                else:
                    logger.error(f"Transcription failed: {response.status_code} - {response.text}")
                    return "Could not transcribe audio"
                    
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return "Transcription error"

    async def generate_response(self, transcript: str) -> str:
        """Generate AI response using GPT"""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {self.api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': 'gpt-4',
                        'messages': [
                            {
                                'role': 'system',
                                'content': 'You are a professional technical interviewer. Ask relevant questions about programming, algorithms, system design, and software engineering. Keep responses concise and conversational.'
                            },
                            {
                                'role': 'user', 
                                'content': transcript
                            }
                        ],
                        'max_tokens': 500,
                        'temperature': 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data['choices'][0]['message']['content']
                else:
                    logger.error(f"GPT response failed: {response.status_code} - {response.text}")
                    return "I understand. Please continue with your answer."
                    
        except Exception as e:
            logger.error(f"GPT error: {e}")
            return "Let's continue with the interview."

# WebSocket endpoint for direct audio processing
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for audio processing
    """
    await ws_manager.connect(websocket, client_id)
    logger.info(f"Client {client_id} connected to WebSocket")
    
    try:
        # Send welcome message
        await ws_manager.send_json(client_id, {
            "type": "greeting",
            "message": "Connected to interview backend",
            "client_id": client_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Main message loop
        while True:
            try:
                # Receive message
                data = await websocket.receive_json()
                msg_type = data.get("type")
                
                if msg_type == "ping":
                    await ws_manager.send_json(client_id, {"type": "pong"})
                
                elif msg_type == "start_interview":
                    logger.info(f"Starting interview for {client_id}")
                    await ws_manager.send_json(client_id, {
                        "type": "interview_started",
                        "message": "Interview session started"
                    })
                
                elif msg_type == "audio_chunk":
                    # Handle audio chunks for realtime processing
                    audio_b64 = data.get("data", "")
                    is_speaking = data.get("isSpeaking", False)
                    
                    if audio_b64:
                        try:
                            audio_bytes = base64.b64decode(audio_b64)
                            # Store in buffer or process immediately
                            if client_id in ws_manager.audio_buffers:
                                ws_manager.audio_buffers[client_id].extend(audio_bytes)
                            
                            # Send acknowledgment
                            await ws_manager.send_json(client_id, {
                                "type": "audio_received",
                                "bytes_received": len(audio_bytes),
                                "is_speaking": is_speaking
                            })
                            
                        except Exception as e:
                            logger.error(f"Audio processing error: {e}")
                
                elif msg_type == "send_for_AI_processing":
                    # Process complete audio with AI
                    audio_b64 = data.get("audio", "")
                    duration = data.get("duration", 0)
                    
                    if not audio_b64:
                        await ws_manager.send_json(client_id, {
                            "type": "error",
                            "error": "No audio data provided"
                        })
                        continue
                    
                    try:
                        audio_bytes = base64.b64decode(audio_b64)
                        logger.info(f"Processing audio: {len(audio_bytes)} bytes, {duration}s")
                        
                        # Use simple AI service for processing
                        ai_service = SimpleAIService(OPENAI_API_KEY)
                        
                        # Transcribe
                        transcript = await ai_service.transcribe_audio(audio_bytes)
                        await ws_manager.send_json(client_id, {
                            "type": "user_transcript",
                            "text": transcript
                        })
                        
                        # Generate response
                        response = await ai_service.generate_response(transcript)
                        await ws_manager.send_json(client_id, {
                            "type": "ai_response", 
                            "text": response
                        })
                        
                    except Exception as e:
                        logger.error(f"AI processing error: {e}")
                        await ws_manager.send_json(client_id, {
                            "type": "error",
                            "error": f"Processing failed: {str(e)}"
                        })
                
                else:
                    logger.warning(f"Unknown message type: {msg_type}")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Message processing error: {e}")
                try:
                    await ws_manager.send_json(client_id, {
                        "type": "error", 
                        "error": str(e)
                    })
                except:
                    pass
                    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        ws_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        log_level="info"
    )