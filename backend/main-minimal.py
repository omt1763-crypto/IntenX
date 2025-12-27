"""
Minimal Interview AI Backend
Only provides session tokens for OpenAI Realtime API.
Everything else is handled by OpenAI.
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

# Load environment
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not set in .env")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Interview AI Backend",
    description="Minimal backend for OpenAI Realtime API",
    version="4.0.0",
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now().isoformat()}

@app.get("/api/realtime-token")
async def get_realtime_token():
    """
    Get session token from OpenAI for Realtime API.
    This is the ONLY endpoint needed - everything else is handled by OpenAI!
    """
    try:
        logger.info("Creating OpenAI Realtime session...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.openai.com/v1/realtime/sessions',
                headers={
                    'Authorization': f'Bearer {OPENAI_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'gpt-4o-realtime-preview-2024-10-01',
                    'voice': 'alloy',
                },
                timeout=10.0,
            )
        
        if response.status_code != 200:
            logger.error(f"OpenAI error: {response.status_code} - {response.text}")
            return {
                "success": False,
                "error": "Failed to create session"
            }
        
        data = response.json()
        logger.info(f"✅ Session created: {data.get('id')}")
        
        # Return session token to frontend
        return {
            "success": True,
            "session_id": data.get('id'),
            "session_token": data.get('client_secret', {}).get('value'),
            "client_secret": data.get('client_secret'),
            "expires_at": data.get('expires_at'),
        }
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Startup
@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("🚀 INTERVIEW AI BACKEND (Minimal)")
    logger.info("=" * 60)
    logger.info("✅ Only provides session tokens")
    logger.info("✅ Audio processing by OpenAI Realtime API")
    logger.info("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
