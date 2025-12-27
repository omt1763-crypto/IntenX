/**
 * OpenAI Realtime API Configuration
 * Settings for VAD, audio processing, and session management
 */

export const realtimeConfig = {
  // OpenAI Realtime API settings
  api: {
    model: 'gpt-4o-realtime-preview',
    baseUrl: 'https://api.openai.com/v1/realtime',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // Audio settings
  audio: {
    sampleRate: 24000, // 24kHz required by OpenAI
    channels: 1, // Mono
    bitDepth: 16, // 16-bit PCM
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },

  // Voice Activity Detection (VAD) - Server-side on OpenAI
  vad: {
    type: 'server_vad',
    threshold: 0.5, // Range: 0.0 to 1.0, lower = more sensitive
    prefix_padding_ms: 100, // Padding before detected speech
    silence_duration_ms: 500, // Silence duration to end speech
  },

  // Voice settings
  voice: {
    alloy: 'alloy', // Neutral male
    echo: 'echo', // Slightly robotic male
    fable: 'fable', // Clear female
    onyx: 'onyx', // Deep male
    nova: 'nova', // Warm female
    shimmer: 'shimmer', // Bright female
    default: 'alloy',
  },

  // Temperature and tokens
  temperature: 0.7, // 0.6-1.0 for interviews (0.6 = more consistent, 1.0 = more creative)
  max_response_output_tokens: 1000,

  // Interview instructions template
  instructions: {
    interview: `You are an AI technical interviewer conducting a professional interview. 
Your role is to:
- Ask thoughtful, follow-up questions about the candidate's experience
- Assess their technical knowledge and problem-solving approach
- Maintain a professional, conversational tone
- Listen actively and adapt questions based on responses
- Provide constructive feedback at the end

Be engaging but not overly casual. Ask one question at a time and wait for complete answers.`,

    default: 'You are a helpful AI assistant in a conversational interview.',
  },
}

// Helper to get voice label
export function getVoiceLabel(voiceId: keyof typeof realtimeConfig.voice): string {
  const labels = {
    alloy: 'Alloy (Neutral)',
    echo: 'Echo (Robotic)',
    fable: 'Fable (Clear)',
    onyx: 'Onyx (Deep)',
    nova: 'Nova (Warm)',
    shimmer: 'Shimmer (Bright)',
  }
  return labels[voiceId] || voiceId
}

// Helper to get VAD description
export function getVadThresholdDescription(threshold: number): string {
  if (threshold < 0.3) return 'Very sensitive (picks up background noise)'
  if (threshold < 0.5) return 'Sensitive (good for quiet environments)'
  if (threshold < 0.7) return 'Balanced (recommended)'
  return 'Less sensitive (good for noisy environments)'
}
