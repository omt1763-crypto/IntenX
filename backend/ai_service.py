"""
Enhanced AI Service for Conversational Interaction
"""
import asyncio
import logging
import base64
import re
import json
import io
import struct
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, api_key: str, model: str = "gpt-4o-realtime-preview", voice: str = "alloy"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        self.voice = voice
        self.conversation_history: List[dict] = []
        self.interview_context: Dict[str, Any] = {
            "current_topic": "introduction",
            "difficulty_level": "beginner",
            "candidate_level": "unknown",
            "questions_asked": 0,
            "technical_areas": ["programming fundamentals", "data structures", "algorithms"],
            "current_area_index": 0
        }
        
        self.available_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        
        if voice not in self.available_voices:
            logger.warning(f"Voice {voice} not in available voices, using 'alloy'")
            self.voice = "alloy"
        
        logger.info(f"[AI] Service initialized with model: {model}, voice: {voice}")

    def clear_conversation_history(self):
        """Clear conversation history for new interview"""
        self.conversation_history.clear()
        self.interview_context.update({
            "current_topic": "introduction",
            "difficulty_level": "beginner",
            "candidate_level": "unknown",
            "questions_asked": 0,
            "current_area_index": 0
        })
        logger.info("[AI] Conversation history and context cleared")

    async def generate_conversational_response(self, user_input: str, audio_duration: float = 0) -> Dict[str, Any]:
        """Generate AI response with conversational context and emotional intelligence"""
        try:
            # Analyze user input for emotional cues and content
            analysis = await self.analyze_user_input(user_input, audio_duration)
            
            # Build dynamic system prompt based on conversation flow
            system_prompt = self._build_dynamic_system_prompt(analysis)
            
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history
            messages.extend(self.conversation_history)
            
            # Add current user input with context
            contextual_input = self._add_context_to_input(user_input, analysis)
            messages.append({"role": "user", "content": contextual_input})
            
            logger.info(f"[AI] Generating conversational response for: {user_input[:50]}...")
            
            # Call OpenAI API with conversation parameters
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=250,
                temperature=0.8,  # Slightly higher for more natural conversation
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            if not ai_response:
                logger.warning("[AI] Empty response from OpenAI")
                ai_response = "I didn't quite catch that. Could you please repeat or elaborate?"
            
            # Update conversation state
            self._update_conversation_state(user_input, ai_response, analysis)
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_input})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Keep conversation history manageable
            if len(self.conversation_history) > 8:
                self.conversation_history = self.conversation_history[-8:]
            
            # Determine if we should ask follow-up or move to next topic
            next_action = self._determine_next_action(analysis)
            
            logger.info(f"[AI] Generated response: {ai_response[:50]}...")
            
            return {
                "text": ai_response,
                "should_ask_followup": next_action["ask_followup"],
                "next_topic": next_action["next_topic"],
                "emotional_tone": analysis.get("emotional_tone", "neutral"),
                "conversation_flow": next_action["flow_direction"]
            }
            
        except Exception as e:
            logger.error(f"[AI] Error generating conversational response: {e}")
            return {
                "text": "I apologize, but I'm having trouble processing that. Could we try again?",
                "should_ask_followup": False,
                "next_topic": "technical",
                "emotional_tone": "neutral",
                "conversation_flow": "continue"
            }

    async def analyze_user_input(self, user_input: str, audio_duration: float = 0) -> Dict[str, Any]:
        """Analyze user input for content, emotion, and intent"""
        try:
            analysis_prompt = f"""
            Analyze this user input from a technical interview context:
            
            User: "{user_input}"
            Audio Duration: {audio_duration} seconds
            
            Provide a JSON analysis with:
            - emotional_tone: "confident", "unsure", "thoughtful", "rushed", "neutral"
            - technical_depth: "basic", "intermediate", "advanced", "none"
            - clarity: "clear", "somewhat_clear", "unclear"
            - intent: "answer", "question", "clarification", "small_talk", "distraction"
            - needs_followup: boolean
            - suggested_response_style: "encouraging", "challenging", "clarifying", "neutral"
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use cheaper model for analysis
                messages=[{"role": "user", "content": analysis_prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Parse JSON from response
            try:
                analysis = json.loads(analysis_text)
            except:
                # Fallback analysis
                analysis = {
                    "emotional_tone": "neutral",
                    "technical_depth": "basic",
                    "clarity": "clear",
                    "intent": "answer",
                    "needs_followup": len(user_input.split()) > 5,
                    "suggested_response_style": "neutral"
                }
            
            # Add audio-based analysis
            if audio_duration > 0:
                if audio_duration < 2:
                    analysis["speaking_pace"] = "brief"
                elif audio_duration > 10:
                    analysis["speaking_pace"] = "detailed"
                else:
                    analysis["speaking_pace"] = "normal"
            
            logger.info(f"[AI] Input analysis: {analysis}")
            return analysis
            
        except Exception as e:
            logger.error(f"[AI] Error analyzing user input: {e}")
            return {
                "emotional_tone": "neutral",
                "technical_depth": "basic",
                "clarity": "clear",
                "intent": "answer",
                "needs_followup": True,
                "suggested_response_style": "neutral"
            }

    def _build_dynamic_system_prompt(self, analysis: Dict[str, Any]) -> str:
        """Build dynamic system prompt based on conversation state"""
        
        base_prompt = """You are a professional technical interviewer having a real conversation. You should:
        - Sound natural and conversational, like a human interviewer
        - Show active listening through your responses
        - Adapt to the candidate's technical level
        - Ask thoughtful follow-up questions
        - Provide encouragement when appropriate
        - Keep responses concise but engaging
        - Use conversational fillers naturally ("I see", "Interesting", "That makes sense")
        - Show genuine interest in the candidate's responses
        """
        
        # Add emotional tone guidance
        emotional_tone = analysis.get("emotional_tone", "neutral")
        if emotional_tone == "unsure":
            base_prompt += "\n- The candidate seems unsure, be encouraging and break down questions"
        elif emotional_tone == "confident":
            base_prompt += "\n- The candidate seems confident, you can challenge them with deeper questions"
        elif emotional_tone == "rushed":
            base_prompt += "\n- The candidate seems rushed, encourage them to take their time"
        
        # Add response style guidance
        response_style = analysis.get("suggested_response_style", "neutral")
        if response_style == "encouraging":
            base_prompt += "\n- Use encouraging language and positive reinforcement"
        elif response_style == "challenging":
            base_prompt += "\n- Ask challenging follow-up questions to test depth"
        elif response_style == "clarifying":
            base_prompt += "\n- Ask clarifying questions to better understand their point"
        
        # Add conversation state context
        base_prompt += f"\n\nCurrent conversation state:"
        base_prompt += f"\n- Questions asked so far: {self.interview_context['questions_asked']}"
        base_prompt += f"\n- Current topic area: {self.interview_context['technical_areas'][self.interview_context['current_area_index']]}"
        base_prompt += f"\n- Estimated candidate level: {self.interview_context['candidate_level']}"
        
        return base_prompt

    def _add_context_to_input(self, user_input: str, analysis: Dict[str, Any]) -> str:
        """Add contextual information to user input"""
        contextual_input = f"Candidate: {user_input}\n\n"
        
        # Add analysis context
        contextual_input += f"Analysis: The candidate seems {analysis.get('emotional_tone', 'neutral')}, "
        contextual_input += f"their response shows {analysis.get('technical_depth', 'basic')} understanding, "
        contextual_input += f"and their intent appears to be {analysis.get('intent', 'answer')}."
        
        return contextual_input

    def _update_conversation_state(self, user_input: str, ai_response: str, analysis: Dict[str, Any]):
        """Update the conversation state based on interaction"""
        self.interview_context["questions_asked"] += 1
        
        # Update candidate level estimation
        tech_depth = analysis.get("technical_depth", "basic")
        if tech_depth == "advanced" and self.interview_context["candidate_level"] != "advanced":
            self.interview_context["candidate_level"] = "advanced"
            logger.info(f"[AI] Updated candidate level to: advanced")
        elif tech_depth == "intermediate" and self.interview_context["candidate_level"] == "unknown":
            self.interview_context["candidate_level"] = "intermediate"
            logger.info(f"[AI] Updated candidate level to: intermediate")
        
        # Move to next technical area if enough questions asked
        if self.interview_context["questions_asked"] % 3 == 0:
            self.interview_context["current_area_index"] = (
                self.interview_context["current_area_index"] + 1
            ) % len(self.interview_context["technical_areas"])
            logger.info(f"[AI] Moving to next topic area: {self.interview_context['technical_areas'][self.interview_context['current_area_index']]}")

    def _determine_next_action(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Determine what to do next in the conversation"""
        needs_followup = analysis.get("needs_followup", False)
        clarity = analysis.get("clarity", "clear")
        emotional_tone = analysis.get("emotional_tone", "neutral")
        
        ask_followup = needs_followup or clarity in ["somewhat_clear", "unclear"]
        
        # If candidate is unsure, ask clarifying follow-up
        if emotional_tone == "unsure":
            ask_followup = True
        
        # Determine conversation flow direction
        if ask_followup:
            flow_direction = "deepen"
            next_topic = "followup"
        else:
            flow_direction = "advance"
            next_topic = self.interview_context["technical_areas"][self.interview_context["current_area_index"]]
        
        return {
            "ask_followup": ask_followup,
            "next_topic": next_topic,
            "flow_direction": flow_direction
        }

    async def generate_opening_greeting(self) -> Dict[str, Any]:
        """Generate a natural opening greeting"""
        try:
            opening_prompt = """Create a warm, natural opening greeting for a technical interview. 
            Introduce yourself briefly and ask the first question about programming experience.
            Keep it conversational and friendly but professional."""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": opening_prompt}],
                max_tokens=150,
                temperature=0.8
            )
            
            opening_text = response.choices[0].message.content.strip()
            
            return {
                "text": opening_text,
                "should_ask_followup": True,
                "next_topic": "programming_experience",
                "emotional_tone": "friendly",
                "conversation_flow": "start"
            }
            
        except Exception as e:
            logger.error(f"[AI] Error generating opening: {e}")
            return {
                "text": "Hello! I'm your technical interview assistant. Thank you for joining me today. Let's start with your programming experience - could you tell me about the languages you're most comfortable with?",
                "should_ask_followup": True,
                "next_topic": "programming_experience",
                "emotional_tone": "friendly",
                "conversation_flow": "start"
            }

    async def text_to_speech(self, text: str) -> Optional[bytes]:
        """Convert text to speech with natural pacing"""
        try:
            if not text or not text.strip():
                logger.warning("[TTS] Empty text provided")
                return None
            
            # Clean text for TTS - preserve natural speech patterns
            clean_text = self._clean_text_for_natural_speech(text)
            
            if len(clean_text) > 400:
                clean_text = clean_text[:400] + "..."
            
            logger.info(f"[TTS] Generating natural speech for: {clean_text[:50]}...")
            
            # Use slightly varied speed for naturalness
            speed = 0.95  # Slightly slower for more natural speech
            
            response = await self.client.audio.speech.create(
                model="tts-1",
                voice=self.voice,
                input=clean_text,
                response_format="mp3",
                speed=speed
            )
            
            audio_bytes = response.read()
            
            if not audio_bytes or len(audio_bytes) == 0:
                logger.error("[TTS] No audio data received")
                return None
            
            logger.info(f"[TTS] Natural speech generated: {len(audio_bytes)} bytes")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"[TTS] Error generating natural speech: {e}")
            return None

    def _clean_text_for_natural_speech(self, text: str) -> str:
        """Clean text while preserving natural speech patterns"""
        try:
            # Remove markdown but keep natural punctuation
            clean_text = re.sub(r'[*_`#]', '', text)
            
            # Remove URLs
            clean_text = re.sub(r'http\S+', '', clean_text)
            
            # Remove code blocks but mention there's code
            clean_text = re.sub(r'```.*?```', '[code example]', clean_text, flags=re.DOTALL)
            
            # Preserve natural pauses and conversational markers
            clean_text = re.sub(r'\s+', ' ', clean_text)
            
            # Ensure natural ending
            if not clean_text.endswith(('.', '!', '?')):
                if any(word in clean_text.lower() for word in ['okay', 'great', 'interesting']):
                    clean_text += '.'
                else:
                    clean_text += '?'
            
            return clean_text.strip()
            
        except Exception as e:
            logger.error(f"[TTS] Error cleaning text for natural speech: {e}")
            return text

    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio to text using OpenAI Whisper"""
        try:
            if not audio_bytes or len(audio_bytes) == 0:
                logger.warning("[Whisper] Empty audio provided")
                return ""
            
            logger.info(f"[Whisper] Transcribing audio: {len(audio_bytes)} bytes")
            
            # Check if it's a WAV file (starts with RIFF header)
            is_wav = audio_bytes[:4] == b'RIFF'
            logger.info(f"[Whisper] Audio format: {'WAV' if is_wav else 'Unknown'}")
            
            # For WAV files, try direct transcription
            if is_wav:
                # Extract audio data length from WAV header to validate
                if len(audio_bytes) >= 44:
                    import struct
                    # Read data size from WAV header (at offset 40, 4 bytes, little-endian)
                    data_size = struct.unpack('<I', audio_bytes[40:44])[0]
                    total_expected = 44 + data_size
                    if abs(len(audio_bytes) - total_expected) <= 4:  # Allow small variance
                        logger.info(f"[Whisper] WAV file validated: {len(audio_bytes)} bytes total, {data_size} bytes audio data")
            
            # Create file-like object for audio
            audio_file = io.BytesIO(audio_bytes)
            if is_wav:
                audio_file.name = "audio.wav"
            else:
                audio_file.name = "audio.mp3"
            
            # Call Whisper API with explicit parameters
            try:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en",  # Explicitly set to English
                    temperature=0.0  # More deterministic transcription
                )
                
                text = transcript.text.strip()
                
                if not text:
                    logger.warning(f"[Whisper] Empty transcription returned for {len(audio_bytes)} byte WAV file")
                    # Return empty string (handled by caller)
                    return ""
                
                logger.info(f"[Whisper] ✅ Transcription successful: '{text}'")
                return text
            
            except Exception as whisper_err:
                logger.error(f"[Whisper] Whisper API error: {whisper_err}")
                raise
            
        except Exception as e:
            logger.error(f"[Whisper] Error transcribing audio: {e}")
            return ""

    async def test_tts(self, text: str = "Hello! I'm your interview assistant. How are you today?") -> bool:
        """Test TTS functionality with natural speech"""
        try:
            logger.info("[TEST] Testing natural TTS functionality...")
            audio_bytes = await self.text_to_speech(text)
            
            if audio_bytes and len(audio_bytes) > 0:
                logger.info(f"[TEST] Natural TTS test successful: {len(audio_bytes)} bytes")
                return True
            else:
                logger.error("[TEST] Natural TTS test failed: No audio generated")
                return False
                
        except Exception as e:
            logger.error(f"[TEST] Natural TTS test failed with error: {e}")
            return False