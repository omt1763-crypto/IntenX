"""
Interview AI Backend - Real-time Audio Processing WebSocket Server
Complete rewrite for proper audio buffering and AI processing
"""

import os
import sys
import asyncio
import logging
import base64
import json
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Import custom modules
from ws_manager import WebSocketManager
from ai_service import AIService
from utils.logger import setup_logger

# Load environment
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
REALTIME_MODEL = os.getenv("REALTIME_MODEL", "gpt-4-turbo")
REALTIME_VOICE = os.getenv("REALTIME_VOICE", "alloy")
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8001))

# Setup logging
logger = setup_logger(__name__)

# Global instances
ws_manager = WebSocketManager()
ai_service: Optional[AIService] = None

# ============================================================================
# LIFESPAN MANAGEMENT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("=" * 60)
    logger.info("[START] INTERVIEW AI BACKEND STARTING")
    logger.info("=" * 60)
    logger.info(f"Server: {SERVER_HOST}:{SERVER_PORT}")
    logger.info(f"Model: {REALTIME_MODEL}")
    logger.info(f"Voice: {REALTIME_VOICE}")
    
    global ai_service
    ai_service = AIService(OPENAI_API_KEY, REALTIME_MODEL, REALTIME_VOICE)
    
    # Test TTS on startup
    try:
        tts_working = await ai_service.test_tts()
        if tts_working:
            logger.info("[OK] TTS service is working correctly")
        else:
            logger.error("[FAIL] TTS service test failed")
    except Exception as e:
        logger.error(f"[FAIL] TTS test failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("[STOP] BACKEND SHUTTING DOWN")
    logger.info("=" * 60)
    logger.info(f"Active connections: {len(ws_manager.active_connections)}")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Interview AI Backend",
    description="Real-time Audio Processing WebSocket Server",
    version="3.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REST API ENDPOINTS (for health checks)
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(ws_manager.active_connections)
    }


# ============================================================================
# AUDIO PROCESSING FUNCTION
# ============================================================================

async def process_audio(client_id: str, audio_bytes: bytes) -> Dict[str, Any]:
    """
    Core AI processing pipeline for audio:
    1. Transcribe audio to text
    2. Generate AI response
    3. Convert response to TTS audio
    
    Returns: {
        "success": bool,
        "transcript": str,
        "response_text": str,
        "response_audio": bytes or None,
        "error": str or None
    }
    """
    try:
        if not audio_bytes or len(audio_bytes) < 100:
            logger.warning(f"[WS-{client_id}] Audio too short: {len(audio_bytes)} bytes")
            return {
                "success": False,
                "error": "Audio too short",
                "transcript": None,
                "response_text": None,
                "response_audio": None
            }
        
        logger.info(f"[WS-{client_id}] [PROCESS] START: {len(audio_bytes)} bytes")
        
        # Step 1: Transcribe audio to text
        logger.info(f"[WS-{client_id}] [TRANSCRIBE] Calling Whisper...")
        transcript = await ai_service.transcribe_audio(audio_bytes)
        logger.info(f"[WS-{client_id}] [TRANSCRIBE] Result: '{transcript}'")
        
        if not transcript or transcript.strip() == "":
            logger.warning(f"[WS-{client_id}] Transcription failed or empty")
            return {
                "success": False,
                "error": "Failed to transcribe audio",
                "transcript": None,
                "response_text": None,
                "response_audio": None
            }
        
        logger.info(f"[WS-{client_id}] [TRANSCRIBE] SUCCESS")
        
        # Step 2: Generate AI response
        logger.info(f"[WS-{client_id}] [AI-GEN] Calling GPT-4...")
        ai_response_data = await ai_service.generate_conversational_response(transcript)
        response_text = ai_response_data.get("text", "")
        logger.info(f"[WS-{client_id}] [AI-GEN] Result: '{response_text[:100]}'")
        
        if not response_text:
            logger.error(f"[WS-{client_id}] AI response is empty")
            return {
                "success": False,
                "error": "Failed to generate AI response",
                "transcript": transcript,
                "response_text": None,
                "response_audio": None
            }
        
        logger.info(f"[WS-{client_id}] [AI-GEN] SUCCESS")
        
        # Step 3: Convert AI response to speech
        logger.info(f"[WS-{client_id}] [TTS] Generating speech...")
        response_audio = await ai_service.text_to_speech(response_text)
        logger.info(f"[WS-{client_id}] [TTS] Result: {len(response_audio) if response_audio else 0} bytes")
        
        if not response_audio or len(response_audio) == 0:
            logger.warning(f"[WS-{client_id}] TTS failed - no audio generated")
            response_audio = None
        else:
            logger.info(f"[WS-{client_id}] [TTS] SUCCESS")
        
        logger.info(f"[WS-{client_id}] [PROCESS] COMPLETE")
        
        return {
            "success": True,
            "error": None,
            "transcript": transcript,
            "response_text": response_text,
            "response_audio": response_audio
        }
    
    except Exception as e:
        logger.error(f"[WS-{client_id}] Error in process_audio: {e}", exc_info=True)
        return {
            "success": False,
            "error": f"Processing error: {str(e)}",
            "transcript": None,
            "response_text": None,
            "response_audio": None
        }


# ============================================================================
# WEBSOCKET ENDPOINT - THE CORE MESSAGE HANDLER
# ============================================================================

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    Real-time audio processing WebSocket endpoint.
    
    Handles:
    1. audio_chunk with isSpeaking flag:
       {"type": "audio_chunk", "data": "<base64>", "isSpeaking": true/false}
    2. send_for_AI_processing (legacy):
       {"type": "send_for_AI_processing", "audio": "<base64>", "duration": 1.5}
    
    Flow:
    - isSpeaking=true: append to buffer
    - isSpeaking=false: process buffer (transcribe→generate→TTS)
    - Send back: user_transcript, ai_response (with audio), or error
    """
    
    # Accept connection
    await ws_manager.connect(websocket, client_id)
    logger.info(f"[WS-{client_id}] [CONNECT] Client connected")
    
    try:
        # Send greeting
        await ws_manager.send_json(client_id, {
            "type": "greeting",
            "status": "ready",
            "message": "Connected to AI Interview Backend",
            "timestamp": datetime.now().isoformat()
        })
        logger.info(f"[WS-{client_id}] [GREETING] Sent")
        
        # Track previous isSpeaking state to detect silence
        prev_is_speaking = False
        
        # Main message loop
        while True:
            try:
                # READ JSON MESSAGE FROM CLIENT
                logger.info(f"[WS-{client_id}] [LISTEN] Waiting for message...")
                message = await websocket.receive_json()
                msg_type = message.get("type")
                logger.info(f"[WS-{client_id}] [RECV] type={msg_type}")
                
                # ===== AUDIO CHUNK HANDLER =====
                if msg_type == "audio_chunk":
                    chunk_b64 = message.get("data", "")
                    is_speaking = message.get("isSpeaking", False)
                    
                    try:
                        # Decode base64 chunk (allow empty for silence signals)
                        if chunk_b64:
                            chunk_bytes = base64.b64decode(chunk_b64)
                            logger.info(f"[WS-{client_id}] [CHUNK] {len(chunk_bytes)} bytes, isSpeaking={is_speaking}")
                        else:
                            chunk_bytes = b""
                            logger.info(f"[WS-{client_id}] [CHUNK] Empty (silence), isSpeaking={is_speaking}")
                        
                        # Get connection
                        connection = ws_manager.get_connection(client_id)
                        if not connection:
                            logger.error(f"[WS-{client_id}] [ERROR] Connection lost!")
                            break
                        
                        # APPEND TO BUFFER (even if empty, to detect state change)
                        if chunk_bytes:
                            connection["audio_buffer"].extend(chunk_bytes)
                            logger.info(f"[WS-{client_id}] [BUFFER] {len(connection['audio_buffer'])} bytes total")
                        
                        # DETECT SILENCE: isSpeaking changed from True→False
                        if prev_is_speaking and not is_speaking:
                            logger.info(f"[WS-{client_id}] [SILENCE] Detected! Processing {len(connection['audio_buffer'])} bytes...")
                            
                            # Avoid concurrent processing
                            if connection.get("is_processing", False):
                                logger.warning(f"[WS-{client_id}] [WARN] Already processing")
                                prev_is_speaking = is_speaking
                                continue
                            
                            connection["is_processing"] = True
                            
                            # Get buffer and clear it
                            audio_to_process = bytes(connection["audio_buffer"])
                            connection["audio_buffer"] = bytearray()
                            logger.info(f"[WS-{client_id}] [PROCESS] Starting with {len(audio_to_process)} bytes...")
                            
                            # PROCESS AUDIO
                            result = await process_audio(client_id, audio_to_process)
                            
                            # SEND TRANSCRIPT
                            if result["transcript"]:
                                await ws_manager.send_json(client_id, {
                                    "type": "user_transcript",
                                    "text": result["transcript"]
                                })
                                logger.info(f"[WS-{client_id}] [SEND] user_transcript")
                            
                            # SEND AI RESPONSE
                            if result["success"]:
                                response = {
                                    "type": "ai_response",
                                    "text": result["response_text"]
                                }
                                
                                # Include TTS audio if available
                                if result["response_audio"]:
                                    response["audio"] = base64.b64encode(result["response_audio"]).decode('utf-8')
                                    logger.info(f"[WS-{client_id}] [AUDIO] TTS {len(response['audio'])} chars")
                                
                                await ws_manager.send_json(client_id, response)
                                logger.info(f"[WS-{client_id}] [SEND] ai_response")
                            else:
                                await ws_manager.send_json(client_id, {
                                    "type": "error",
                                    "error": result["error"]
                                })
                                logger.error(f"[WS-{client_id}] [ERROR] {result['error']}")
                            
                            connection["is_processing"] = False
                            logger.info(f"[WS-{client_id}] [DONE] Cycle complete")
                        
                        prev_is_speaking = is_speaking
                    
                    except base64.binascii.Error as e:
                        logger.error(f"[WS-{client_id}] [ERROR] Base64 error: {e}")
                        await ws_manager.send_json(client_id, {
                            "type": "error",
                            "error": "Invalid base64"
                        })
                
                # ===== LEGACY FORMAT HANDLER (full WAV in one message) =====
                elif msg_type == "send_for_AI_processing":
                    logger.info(f"[WS-{client_id}] [HANDLER] send_for_AI_processing received")
                    audio_b64 = message.get("audio", "")
                    duration = message.get("duration", 0)
                    logger.info(f"[WS-{client_id}] [AUDIO] base64 {len(audio_b64)} chars, duration {duration}s")
                    
                    if not audio_b64:
                        logger.warning(f"[WS-{client_id}] [WARN] No audio data")
                        continue
                    
                    try:
                        audio_bytes = base64.b64decode(audio_b64)
                        logger.info(f"[WS-{client_id}] [DECODE] {len(audio_bytes)} bytes")
                        
                        connection = ws_manager.get_connection(client_id)
                        if not connection:
                            logger.error(f"[WS-{client_id}] [ERROR] Connection lost!")
                            break
                        
                        if connection.get("is_processing"):
                            logger.warning(f"[WS-{client_id}] [WARN] Already processing")
                            continue
                        
                        logger.info(f"[WS-{client_id}] [PROCESS] Starting AI pipeline...")
                        connection["is_processing"] = True
                        
                        # Process immediately
                        result = await process_audio(client_id, audio_bytes)
                        logger.info(f"[WS-{client_id}] [RESULT] success={result['success']}")
                        
                        # Send transcript
                        if result["transcript"]:
                            logger.info(f"[WS-{client_id}] [SEND] user_transcript")
                            await ws_manager.send_json(client_id, {
                                "type": "user_transcript",
                                "text": result["transcript"]
                            })
                        
                        # Send response
                        if result["success"]:
                            response = {
                                "type": "ai_response",
                                "text": result["response_text"]
                            }
                            
                            if result["response_audio"]:
                                response["audio"] = base64.b64encode(result["response_audio"]).decode('utf-8')
                                logger.info(f"[WS-{client_id}] [AUDIO] TTS {len(response['audio'])} chars")
                            
                            logger.info(f"[WS-{client_id}] [SEND] ai_response: {result['response_text'][:50]}")
                            await ws_manager.send_json(client_id, response)
                        else:
                            logger.error(f"[WS-{client_id}] [ERROR] {result['error']}")
                            await ws_manager.send_json(client_id, {
                                "type": "error",
                                "error": result["error"]
                            })
                        
                        connection["is_processing"] = False
                        logger.info(f"[WS-{client_id}] [DONE] Cycle complete")
                    
                    except base64.binascii.Error as e:
                        logger.error(f"[WS-{client_id}] [ERROR] Base64 error: {e}")
                        await ws_manager.send_json(client_id, {
                            "type": "error",
                            "error": "Invalid base64"
                        })
                
                # ===== OTHER MESSAGES =====
                elif msg_type in ["start_interview", "ping", "disconnect"]:
                    if msg_type == "ping":
                        await ws_manager.send_json(client_id, {"type": "pong"})
                    elif msg_type == "disconnect":
                        logger.info(f"[WS-{client_id}] [DISCONNECT] Client requested disconnect")
                        break
                    elif msg_type == "start_interview":
                        logger.info(f"[WS-{client_id}] [INTERVIEW] Started")
                
                else:
                    logger.warning(f"[WS-{client_id}] [UNKNOWN] type: {msg_type}")
                    await ws_manager.send_json(client_id, {
                        "type": "error",
                        "error": f"Unknown type: {msg_type}"
                    })
            
            except json.JSONDecodeError as e:
                logger.error(f"[WS-{client_id}] [JSON_ERROR] {e}")
                try:
                    await ws_manager.send_json(client_id, {
                        "type": "error",
                        "error": "Invalid JSON"
                    })
                except:
                    pass
            
            except WebSocketDisconnect:
                logger.info(f"[WS-{client_id}] [DISCONNECT] WebSocket closed")
                break
            
            except Exception as e:
                logger.error(f"[WS-{client_id}] [EXCEPTION] {e}", exc_info=True)
                try:
                    await ws_manager.send_json(client_id, {
                        "type": "error",
                        "error": str(e)
                    })
                except:
                    pass
    
    except Exception as e:
        logger.error(f"[WS-{client_id}] [ENDPOINT_ERROR] {e}", exc_info=True)
    
    finally:
        await ws_manager.disconnect(client_id)
        logger.info(f"[WS-{client_id}] [CLEANUP] Done")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        log_level="info"
    )
