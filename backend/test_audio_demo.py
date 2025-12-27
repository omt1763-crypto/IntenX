"""
Test script to demo audio interaction with AI via WebSocket
Sends test audio and monitors AI response
"""

import asyncio
import websockets
import json
import base64
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_audio_demo():
    """Test sending audio to WebSocket and capturing AI response"""
    
    uri = "ws://localhost:8001/ws/realtime"
    logger.info(f"🔗 Connecting to {uri}...")
    
    async with websockets.connect(uri) as websocket:
        logger.info("✅ Connected to backend WebSocket proxy")
        
        # Step 1: Wait for session.created
        logger.info("\n📡 Waiting for session.created message...")
        response = await websocket.recv()
        msg = json.loads(response)
        logger.info(f"📥 Received: {msg.get('type', 'unknown')}")
        
        if msg.get('type') != 'session.created':
            logger.error(f"❌ Expected session.created, got {msg.get('type')}")
            return
        
        logger.info("✅ Session created successfully!")
        
        # Step 2: Update session with audio config
        logger.info("\n🔧 Configuring session for audio...")
        session_update = {
            "type": "session.update",
            "session": {
                "type": "text",
                "modalities": ["audio", "text"],
                "instructions": "You are a friendly AI interviewer. Respond briefly and naturally.",
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "temperature": 0.7,
                "max_response_output_tokens": 150,
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500
                }
            }
        }
        
        await websocket.send(json.dumps(session_update))
        logger.info("✅ Session configured")
        
        # Step 3: Create initial user message to trigger AI greeting
        logger.info("\n💬 Sending initial greeting to trigger AI response...")
        
        # Create a conversation item with text
        user_message = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Hello! I'm ready to do the interview. Can you start?"
                    }
                ]
            }
        }
        
        await websocket.send(json.dumps(user_message))
        logger.info("✅ User message sent")
        
        # Step 4: Request AI response
        logger.info("\n🤖 Requesting AI response...")
        response_create = {
            "type": "response.create"
        }
        
        await websocket.send(json.dumps(response_create))
        logger.info("✅ Response request sent")
        
        # Step 5: Monitor responses
        logger.info("\n📥 Monitoring AI responses...\n")
        
        message_count = 0
        ai_text = ""
        audio_chunks = 0
        
        try:
            while True:
                response = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                message_count += 1
                
                msg = json.loads(response)
                msg_type = msg.get('type')
                
                # Log important messages
                if msg_type == 'response.output_audio.delta':
                    audio_chunks += 1
                    logger.info(f"🔊 Audio chunk #{audio_chunks} received ({len(msg.get('delta', ''))} bytes)")
                
                elif msg_type == 'response.text.delta':
                    text = msg.get('delta', '')
                    ai_text += text
                    logger.info(f"💬 AI text: {text}", end="")
                
                elif msg_type == 'response.done':
                    status = msg.get('response', {}).get('status')
                    logger.info(f"\n\n✅ AI Response completed with status: {status}")
                    logger.info(f"\n📊 Full AI response: {ai_text}")
                    logger.info(f"📊 Audio chunks received: {audio_chunks}")
                    break
                
                elif msg_type not in ['rate_limits.updated', 'session.created']:
                    logger.info(f"📨 {msg_type}")
        
        except asyncio.TimeoutError:
            logger.warning("⏱️ Timeout waiting for response")
            logger.info(f"📊 Received {audio_chunks} audio chunks")
            logger.info(f"📊 AI text so far: {ai_text}")

async def main():
    logger.info("=" * 70)
    logger.info("🎙️  AUDIO DEMO TEST - Testing AI Interview System")
    logger.info("=" * 70)
    logger.info("\nThis test will:")
    logger.info("1. Connect to backend WebSocket proxy")
    logger.info("2. Initialize audio session")
    logger.info("3. Send test message to AI")
    logger.info("4. Capture AI response (text + audio)")
    logger.info("\n" + "=" * 70 + "\n")
    
    try:
        await test_audio_demo()
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
    
    logger.info("\n" + "=" * 70)
    logger.info("✅ Test completed!")
    logger.info("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
