#!/usr/bin/env python3
"""
Test script to send audio chunks to the realtime interview endpoint
and monitor the response in the terminal
"""

import asyncio
import websockets
import json
import base64
import os
import sys
from dotenv import load_dotenv

# Fix encoding for Windows terminal
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def test_interview():
    """Test the interview realtime endpoint"""
    
    print("=" * 60)
    print("[TEST] INTERVIEW AUDIO TEST")
    print("=" * 60)
    
    # Step 1: Get ephemeral token from backend
    print("\n[STEP 1] Getting ephemeral token from backend...")
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get('http://localhost:8001/api/openai-realtime/ephemeral-token')
        if response.status_code != 200:
            print(f"[ERROR] Failed to get token: {response.text}")
            return
        
        token_data = response.json()
        session_token = token_data.get('session_token')
        print(f"[OK] Token received: {session_token[:20]}...")
    
    # Step 2: Connect to WebSocket proxy
    print("\n[STEP 2] Connecting to WebSocket proxy...")
    try:
        async with websockets.connect(
            'ws://localhost:8001/ws/realtime',
        ) as websocket:
            print("[OK] Connected to WebSocket proxy")
            
            # Step 3: Send session.created message (simulating OpenAI response)
            # Actually, wait for OpenAI to send session.created
            print("\n[STEP 3] Waiting for session initialization...")
            
            # Receive initial messages
            for i in range(5):
                try:
                    msg = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(msg)
                    msg_type = data.get('type', 'unknown')
                    print(f"[MESSAGE {i+1}] type={msg_type}")
                    
                    if msg_type == 'session.created':
                        print("[OK] Session created!")
                        break
                except asyncio.TimeoutError:
                    print("[TIMEOUT] Timeout waiting for message")
                    break
            
            # Step 4: Send session.update to enable audio
            print("\n[STEP 4] Sending session.update...")
            session_update = {
                "type": "session.update",
                "session": {
                    "type": "text",  # REQUIRED: This was missing!
                    "modalities": ["audio", "text"],
                    "instructions": "You are a helpful interview assistant. Be concise and friendly.",
                    "voice": "alloy",
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "temperature": 0.7,
                    "max_response_output_tokens": 150,
                }
            }
            await websocket.send(json.dumps(session_update))
            print("[OK] Session update sent")
            
            # Step 5: Send a test audio chunk
            print("\n[STEP 5] Sending test audio chunk...")
            # Create proper audio data - need at least 100ms
            import array
            sample_rate = 24000
            duration = 0.5  # 500ms - MORE than 100ms required
            num_samples = int(sample_rate * duration)
            
            # Generate simple sine wave audio
            audio_data = array.array('h')  # signed short
            frequency = 440  # Hz
            import math
            for i in range(num_samples):
                # Simple sine wave at 440 Hz
                sample = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * i / sample_rate))
                audio_data.append(sample)
            
            # Encode to base64
            audio_bytes = audio_data.tobytes()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            print(f"   [INFO] Audio data size: {len(audio_bytes)} bytes ({duration*1000:.0f}ms)")
            print(f"   [INFO] Base64 size: {len(audio_b64)} bytes")
            
            # Send audio in chunks (like real audio streaming)
            chunk_size = len(audio_b64) // 5
            for chunk_idx in range(5):
                start = chunk_idx * chunk_size
                end = start + chunk_size if chunk_idx < 4 else len(audio_b64)
                chunk_data = audio_b64[start:end]
                
                audio_msg = {
                    "type": "input_audio_buffer.append",
                    "audio": chunk_data
                }
                await websocket.send(json.dumps(audio_msg))
                print(f"   [OK] Sent audio chunk {chunk_idx+1}/5 ({len(chunk_data)} bytes)")
            
            print("[OK] All audio chunks sent")
            
            # Step 6: Send input_audio_buffer.commit to trigger response
            print("\n[STEP 6] Committing audio buffer...")
            commit_msg = {
                "type": "input_audio_buffer.commit"
            }
            await websocket.send(json.dumps(commit_msg))
            print("[OK] Audio committed")
            
            # Step 7: Receive responses
            print("\n[STEP 7] Waiting for AI response (30 seconds)...")
            print("-" * 60)
            
            message_count = 0
            audio_received = False
            text_received = False
            
            try:
                while True:
                    msg = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    data = json.loads(msg)
                    msg_type = data.get('type', 'unknown')
                    message_count += 1
                    
                    # Log important messages
                    if msg_type == 'response.created':
                        print(f"[OK] [{message_count}] Response created")
                    elif msg_type == 'error':
                        error_msg = data.get('error', {})
                        print(f"[ERROR] [{message_count}] {error_msg}")
                    elif msg_type == 'response.output_audio.delta':
                        audio_size = len(data.get('delta', ''))
                        print(f"[AUDIO] [{message_count}] Audio delta: {audio_size} bytes")
                        audio_received = True
                    elif msg_type == 'response.text.delta':
                        text = data.get('delta', '')
                        print(f"[TEXT] [{message_count}] Text: {text}")
                        text_received = True
                    elif msg_type == 'response.output_audio.done':
                        print(f"[OK] [{message_count}] Audio done")
                    elif msg_type == 'response.done':
                        status = data.get('response', {}).get('status', 'unknown')
                        print(f"[OK] [{message_count}] Response done (status={status})")
                        break
                    else:
                        # Log other messages too
                        print(f"[MSG] [{message_count}] {msg_type}")
                        
            except asyncio.TimeoutError:
                print("[TIMEOUT] Timeout waiting for response")
            
            print("-" * 60)
            print(f"\nSUMMARY:")
            print(f"   Total messages: {message_count}")
            print(f"   Audio received: {'YES' if audio_received else 'NO'}")
            print(f"   Text received: {'YES' if text_received else 'NO'}")
            
            if not audio_received and not text_received:
                print("\n[WARNING] No response received from AI!")
                print("Check that:")
                print("  1. OpenAI API key is valid")
                print("  2. You have enough credits")
                print("  3. Backend is properly connected to OpenAI")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_interview())
