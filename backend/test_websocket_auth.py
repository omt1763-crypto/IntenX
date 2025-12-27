#!/usr/bin/env python3
"""
Test script to debug OpenAI WebSocket authentication
"""
import asyncio
import websockets
import os
import json
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print(f"🔑 Using API key: {OPENAI_API_KEY[:20]}...")
print()

async def test_with_additional_headers():
    """Test using additional_headers parameter"""
    print("=" * 60)
    print("TEST 1: Using additional_headers parameter")
    print("=" * 60)
    
    uri = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-19'
    headers = [
        ('Authorization', f'Bearer {OPENAI_API_KEY}'),
    ]
    
    try:
        print(f"Connecting to: {uri}")
        print(f"Headers: {headers}")
        
        ws = await websockets.connect(
            uri,
            additional_headers=headers,
        )
        print("✅ CONNECTION SUCCESS with additional_headers!")
        await ws.close()
        return True
    except TypeError as e:
        print(f"❌ TypeError (parameter not supported): {e}")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {e}")
        return False

async def test_with_extra_headers():
    """Test using extra_headers parameter"""
    print("\n" + "=" * 60)
    print("TEST 2: Using extra_headers parameter (CORRECT ONE)")
    print("=" * 60)
    
    uri = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-19'
    
    try:
        print(f"Connecting to: {uri}")
        print(f"Headers: Authorization header")
        
        # Try using just a list of tuples
        extra_headers = [
            ('Authorization', f'Bearer {OPENAI_API_KEY}'),
        ]
        
        ws = await websockets.connect(
            uri,
            extra_headers=extra_headers,
        )
        print("✅ CONNECTION SUCCESS with extra_headers (list of tuples)!")
        
        # Wait briefly to see if we get auth error or session.created
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=3)
            msg_data = json.loads(msg)
            print(f"First message: {msg_data.get('type', 'unknown')}")
            if msg_data.get('type') == 'session.created':
                print("✅ AUTHENTICATED! Got session.created")
            else:
                print(f"Message: {msg}")
        except asyncio.TimeoutError:
            print("⏱️ No response within 3 seconds")
        except Exception as e:
            print(f"Message error: {e}")
        
        await ws.close()
        return True
    except TypeError as e:
        print(f"❌ TypeError (parameter not supported): {e}")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {e}")
        return False

async def test_no_headers():
    """Test without any headers"""
    print("\n" + "=" * 60)
    print("TEST 3: Without custom headers (should fail with auth error)")
    print("=" * 60)
    
    uri = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-19'
    
    try:
        print(f"Connecting to: {uri}")
        print("No headers")
        
        ws = await websockets.connect(uri)
        print("✅ CONNECTION SUCCESS (unexpected!)")
        
        # Try to receive to see if we get auth error
        msg = await asyncio.wait_for(ws.recv(), timeout=2)
        print(f"Received: {msg}")
        await ws.close()
        return True
    except asyncio.TimeoutError:
        print(f"❌ Timeout (no message within 2 seconds)")
        return False
    except Exception as e:
        print(f"❌ Connection/error: {type(e).__name__}: {e}")
        return False

async def main():
    """Run all tests"""
    print("\n🧪 Testing OpenAI WebSocket Authentication\n")
    
    # Check websockets library version
    print(f"websockets library: {websockets.__version__}")
    print()
    
    # Run tests
    results = []
    results.append(("additional_headers", await test_with_additional_headers()))
    results.append(("extra_headers", await test_with_extra_headers()))
    results.append(("no_headers", await test_no_headers()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, success in results:
        status = "✅ WORKS" if success else "❌ FAILED"
        print(f"{name:20} : {status}")

if __name__ == "__main__":
    asyncio.run(main())
