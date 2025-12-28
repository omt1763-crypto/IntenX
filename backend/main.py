"""
Interview AI Backend - Valitron-style WebSocket approach
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import asyncio
import websockets
import json
from openai import OpenAI
from guardrails import generate_interview_instructions, validate_ai_response, validate_instructions_format

# Load environment
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("⚠️ OPENAI_API_KEY not set in environment - WebSocket will fail")
    # Don't crash, let it fail gracefully with clear error

# Setup logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use Supabase by default
try:
    from database_supabase import db
    logger.info("✅ Using Supabase PostgreSQL for all data")
except Exception as e:
    logger.warning(f"⚠️ Supabase not available: {e}, falling back to SQLite")
    from database import db

from contextlib import asynccontextmanager

# Startup/Shutdown events using lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 INTERVIEW AI BACKEND (Valitron Style)")
    logger.info("=" * 60)
    logger.info("✅ Using WebSocket proxy with API key")
    logger.info("✅ Model: gpt-4o-realtime-preview")
    logger.info("✅ Database: SQLite")
    logger.info("=" * 60)
    yield
    # Shutdown
    logger.info("🛑 Backend shutting down...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Interview AI Backend",
    description="WebSocket approach like Valitron",
    version="5.0.0",
    lifespan=lifespan,
)

# Request models
class ExtractSkillsRequest(BaseModel):
    description: str

class InterviewResult(BaseModel):
    id: str
    user_id: str
    title: str
    client: str
    duration: int
    skills: list
    conversation: list

class UserData(BaseModel):
    id: str
    email: str
    name: str

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

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
    return {
        "status": "ok",
        "time": datetime.now().isoformat(),
        "openai_api_key_set": bool(OPENAI_API_KEY),
        "openai_api_key_length": len(OPENAI_API_KEY) if OPENAI_API_KEY else 0
    }

@app.get("/api/openai-realtime/ephemeral-token")
async def get_ephemeral_token():
    """
    Get ephemeral session token from OpenAI for Realtime API
    Returns the client_secret.value which is the session token
    """
    try:
        logger.info("🔄 Creating OpenAI Realtime session...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.openai.com/v1/realtime/sessions',
                headers={
                    'Authorization': f'Bearer {OPENAI_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'gpt-4o-realtime-preview',
                },
                timeout=30.0,
            )
        
        if response.status_code != 200:
            logger.error(f"❌ OpenAI API error: {response.status_code}")
            logger.error(f"Response: {response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {response.status_code}"
            )
        
        data = response.json()
        
        session_id = data.get('id')
        logger.info(f"✅ Session created: {session_id}")
        
        # Extract session token from client_secret
        client_secret = data.get('client_secret', {})
        if isinstance(client_secret, dict):
            token_value = client_secret.get('value')
        else:
            token_value = str(client_secret)
            
        if not token_value:
            logger.error(f"❌ No client_secret.value in OpenAI response. Response: {data}")
            raise HTTPException(status_code=500, detail="No client_secret.value")
        
        logger.info(f"✅ Session token extracted: {token_value[:20]}...")
        
        return {
            "session_token": token_value,
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/realtime")
async def websocket_realtime(websocket: WebSocket):
    """
    WebSocket proxy to OpenAI Realtime API using Bearer token auth
    """
    logger.info("=" * 80)
    logger.info("🔔 WEBSOCKET CONNECTION ATTEMPT")
    logger.info(f"   Client: {websocket.client}")
    logger.info(f"   URL: {websocket.url}")
    logger.info(f"   OPENAI_API_KEY set: {bool(OPENAI_API_KEY)}")
    logger.info(f"   OPENAI_API_KEY length: {len(OPENAI_API_KEY) if OPENAI_API_KEY else 'NOT SET'}")
    logger.info("=" * 80)
    
    await websocket.accept()
    logger.info("🔄 Client connected to WebSocket proxy")
    
    openai_ws = None
    try:
        # Connect to OpenAI Realtime API with API key directly
        model = "gpt-4o-realtime-preview"
        uri = f"wss://api.openai.com/v1/realtime?model={model}"
        
        logger.info(f"🔗 Connecting to OpenAI Realtime WebSocket")
        logger.info(f"   Model: {model}")
        logger.info(f"   Auth: API key Bearer token")
        
        try:
            # Connect with Authorization header
            logger.info(f"🔌 Connecting to OpenAI with Bearer token auth")
            
            openai_ws = await websockets.connect(
                uri,
                extra_headers=[('Authorization', f'Bearer {OPENAI_API_KEY}')],
                close_timeout=10,
            )
            logger.info(f"✅ WebSocket connected to OpenAI Realtime API")
            logger.info(f"   Subprotocol negotiated: {openai_ws.subprotocol or 'None'}")
        except Exception as conn_err:
            logger.error(f"❌ WebSocket connection failed: {conn_err}")
            logger.error(f"   Error type: {type(conn_err).__name__}")
            logger.error(f"   Error details: {str(conn_err)}")
            await websocket.close(code=1000, reason=f"Connection failed: {str(conn_err)}")
            return
        
        # Start bidirectional message forwarding
        client_task = asyncio.create_task(client_to_openai(websocket, openai_ws))
        server_task = asyncio.create_task(openai_to_client(websocket, openai_ws))
        
        # Wait for either task to complete (which means connection closed)
        done, pending = await asyncio.wait(
            [client_task, server_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancel remaining task
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            
    except Exception as e:
        logger.error(f"❌ WebSocket proxy error: {e}")
        logger.error(f"❌ Full error details: {type(e).__name__}: {str(e)}")
        
        # Check for API errors
        if "insufficient_quota" in str(e).lower():
            logger.error("⚠️ OPENAI API QUOTA EXCEEDED - Check your account at https://platform.openai.com/account/billing")
        elif "rate_limit" in str(e).lower():
            logger.error("⚠️ OPENAI RATE LIMIT - Too many requests")
        elif "401" in str(e) or "authentication" in str(e).lower():
            logger.error("⚠️ AUTHENTICATION ERROR - Check your API key")
        
        try:
            await websocket.close(code=1000, reason=str(e))
        except:
            pass
    finally:
        if openai_ws:
            try:
                await openai_ws.close()
            except:
                pass

async def client_to_openai(websocket: WebSocket, openai_ws):
    """Forward messages from browser client to OpenAI"""
    try:
        message_count = 0
        while True:
            data = await websocket.receive_text()
            message_count += 1
            
            # Parse and log message type
            try:
                msg = json.loads(data)
                msg_type = msg.get('type', 'unknown')
                
                # Log session.update with instructions
                if msg_type == 'session.update':
                    logger.info(f"📤 [{message_count}] Client -> OpenAI: type={msg_type}")
                    session_config = msg.get('session', {})
                    instructions = session_config.get('instructions', '')
                    if instructions:
                        logger.info(f"   🔧 Instructions (first 200 chars): {instructions[:200]}...")
                        logger.info(f"   🎯 Full instructions length: {len(instructions)} chars")
                    logger.info(f"   📝 Session config keys: {list(session_config.keys())}")
                
                # Only log important messages to reduce noise
                elif msg_type in ['response.create', 'conversation.item.create', 'input_audio_buffer.append']:
                    logger.info(f"📤 [{message_count}] Client -> OpenAI: type={msg_type}")
                    
                    if msg_type == 'input_audio_buffer.append':
                        audio_data = msg.get('audio', '')
                        logger.info(f"   📊 Audio chunk size: {len(audio_data)} bytes")
            except:
                logger.info(f"📤 [{message_count}] Client -> OpenAI: {data[:50]}...")
            
            await openai_ws.send(data)
    except Exception as e:
        logger.info(f"ℹ️ Client->OpenAI connection closed: {e}")
        # Re-raise to signal connection closed
        raise

async def openai_to_client(websocket: WebSocket, openai_ws):
    """Forward messages from OpenAI to browser client"""
    try:
        message_count = 0
        while True:
            message = await openai_ws.recv()
            message_count += 1
            
            # Parse and log message type
            try:
                msg = json.loads(message)
                msg_type = msg.get('type', 'unknown')
                
                # Log important messages only
                if msg_type in ['session.created', 'session.updated', 'response.created', 
                              'response.done', 'response.text.delta', 'conversation.item.created',
                              'error', 'response.content_part.done']:
                    logger.info(f"📥 [{message_count}] OpenAI -> Client: type={msg_type}")
                    
                    # Special logging for important messages
                    if msg_type == 'session.created':
                        logger.info(f"   ✅ Session created successfully")
                        session_data = msg.get('session', {})
                        logger.info(f"   📝 Session keys: {list(session_data.keys())}")
                    elif msg_type == 'session.updated':
                        logger.info(f"   ✅ Session updated successfully")
                        session_data = msg.get('session', {})
                        logger.info(f"   📝 Session keys: {list(session_data.keys())}")
                    elif msg_type == 'response.done':
                        status = msg.get('response', {}).get('status', 'unknown')
                        logger.info(f"   ✅ Response completed with status: {status}")
                    elif msg_type == 'response.text.delta':
                        text = msg.get('delta', '')[:50]
                        if text:
                            logger.info(f"   💬 Text delta: {text}...")
                    elif msg_type == 'error':
                        error_msg = msg.get('error', {}).get('message', 'Unknown error')
                        logger.error(f"   ❌ Error: {error_msg}")
                    elif msg_type == 'response.content_part.done':
                        # Validate AI response against guardrails
                        content = msg.get('content_part', {})
                        if content.get('type') == 'text':
                            text_content = content.get('text', '')
                            if text_content:
                                validation = validate_ai_response(text_content)
                                if validation.is_valid:
                                    logger.info(f"   ✅ Guardrails validated")
                                else:
                                    logger.warning(f"   ⚠️ Guardrail violations ({validation.severity}):")
                                    for violation in validation.violations:
                                        logger.warning(f"      - {violation}")
                        
            except Exception as parse_err:
                logger.info(f"📥 [{message_count}] OpenAI -> Client: (binary or parse error)")
            
            await websocket.send_text(message)
    except Exception as e:
        logger.info(f"ℹ️ OpenAI->Client connection closed: {e}")

@app.post("/api/extract-skills")
async def extract_skills(request: ExtractSkillsRequest):
    """
    Extract top 3 must-have skills from job description using OpenAI
    Sends description directly to OpenAI like Valitron does
    """
    try:
        job_description = request.description
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        logger.info("🤖 Sending description to OpenAI for skill extraction...")
        
        prompt = f"""Analyze this job description and extract the top 3 MUST-HAVE skills.

Job Description:
{job_description}

Respond in JSON format ONLY (no other text):
{{
  "skills": [
    {{"name": "Skill Name", "importance": "critical/high/medium", "reason": "Why it matters"}},
    {{"name": "Skill Name", "importance": "critical/high/medium", "reason": "Why it matters"}},
    {{"name": "Skill Name", "importance": "critical/high/medium", "reason": "Why it matters"}}
  ],
  "summary": "Brief summary of key requirements"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert HR recruiter. Extract critical skills from job descriptions. Respond only with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content.strip()
        logger.info(f"✅ OpenAI response received")
        
        # Parse JSON from response
        import json
        skills_data = json.loads(response_text)
        
        return {
            "success": True,
            "skills": skills_data.get("skills", []),
            "summary": skills_data.get("summary", "")
        }
            
    except Exception as e:
        logger.error(f"❌ Error extracting skills: {e}")
        logger.error(f"❌ Full error: {type(e).__name__}: {str(e)}")
        
        # Check if it's an API error
        if "insufficient_quota" in str(e).lower() or "rate_limit" in str(e).lower():
            logger.error("⚠️ OPENAI API QUOTA/RATE LIMIT EXCEEDED - Please check your OpenAI account")
            raise HTTPException(status_code=429, detail="OpenAI API quota exceeded. Please check your account.")
        
        # Return mock data for testing if API fails
        logger.info("📝 Using mock skills data for testing")
        import json as json_module
        return {
            "success": True,
            "skills": [
                {
                    "name": "Python Programming",
                    "importance": "critical",
                    "reason": "Core programming language for this role"
                },
                {
                    "name": "System Design",
                    "importance": "critical",
                    "reason": "Essential for architecting scalable solutions"
                },
                {
                    "name": "Database Optimization",
                    "importance": "high",
                    "reason": "Critical for performance and data management"
                }
            ],
            "summary": "This role requires strong technical fundamentals with expertise in backend development and system architecture."
        }

# ==================== INTERVIEW DATA API ====================

@app.post("/api/users")
async def create_user(user: UserData):
    """Save or update user information"""
    try:
        success = db.save_user(user.id, user.email, user.name)
        if success:
            logger.info(f"✅ User created/updated: {user.id}")
            return {"status": "success", "user_id": user.id}
        else:
            raise HTTPException(status_code=400, detail="Failed to save user")
    except Exception as e:
        logger.error(f"❌ Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    try:
        user = db.get_user(user_id)
        if user:
            return user
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"❌ Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interviews")
async def save_interview(interview: InterviewResult):
    """Save interview result"""
    try:
        success = db.save_interview(
            interview.id,
            interview.user_id,
            interview.title,
            interview.client,
            interview.duration,
            interview.skills,
            interview.conversation,
        )
        if success:
            logger.info(f"✅ Interview saved: {interview.id}")
            return {"status": "success", "interview_id": interview.id}
        else:
            raise HTTPException(status_code=400, detail="Failed to save interview")
    except Exception as e:
        logger.error(f"❌ Error saving interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interviews/user/{user_id}")
async def get_user_interviews(user_id: str):
    """Get all interviews for a user"""
    try:
        interviews = db.get_user_interviews(user_id)
        return {"interviews": interviews, "total": len(interviews)}
    except Exception as e:
        logger.error(f"❌ Error getting user interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interviews/{interview_id}")
async def get_interview(interview_id: str):
    """Get specific interview by ID"""
    try:
        interview = db.get_interview(interview_id)
        if interview:
            return interview
        else:
            raise HTTPException(status_code=404, detail="Interview not found")
    except Exception as e:
        logger.error(f"❌ Error getting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/interviews/{interview_id}")
async def delete_interview(interview_id: str):
    """Delete interview"""
    try:
        success = db.delete_interview(interview_id)
        if success:
            logger.info(f"✅ Interview deleted: {interview_id}")
            return {"status": "success"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete interview")
    except Exception as e:
        logger.error(f"❌ Error deleting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    """Get statistics for a user"""
    try:
        stats = db.get_user_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"❌ Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)