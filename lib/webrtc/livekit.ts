/**
 * LiveKit SDK Integration
 *
 * LiveKit is a production-ready WebRTC infrastructure platform.
 * It handles:
 * - Room management
 * - Selective Forwarding Unit (SFU) for efficient media routing
 * - Recording & compositing
 * - Connection reliability
 * - Scaling to thousands of participants
 *
 * Installation:
 * npm install livekit-client livekit-react
 *
 * Documentation:
 * https://docs.livekit.io/client-sdk-js/
 * https://github.com/livekit/livekit-react
 *
 * Deployment:
 * 1. Self-hosted: https://docs.livekit.io/deploy/
 * 2. LiveKit Cloud: https://cloud.livekit.io
 */

/**
 * LiveKit Configuration
 *
 * Replace with actual URLs and tokens from LiveKit
 */
export interface LiveKitConfig {
  url: string // ws://localhost:7880 or wss://your-livekit-server.com
  token: string // JWT token from backend
  roomName: string
  participantName: string
}

/**
 * Get LiveKit token from backend
 *
 * TODO: Implement backend endpoint:
 * POST /api/livekit/token
 *
 * Backend should:
 * 1. Verify user authentication
 * 2. Generate JWT token with:
 *    - exp: current_time + 3600 (1 hour)
 *    - sub: participant_id
 *    - iat: current_time
 *    - nbf: current_time
 *    - name: participant_name
 *    - grants: {
 *        canPublish: true,
 *        canPublishData: true,
 *        canSubscribe: true,
 *        room: room_name,
 *        roomJoin: true
 *      }
 * 3. Return { token, url }
 *
 * Example using livekit-server-sdk-js:
 * ```typescript
 * import { AccessToken } from 'livekit-server-sdk'
 *
 * const at = new AccessToken(
 *   process.env.LIVEKIT_API_KEY!,
 *   process.env.LIVEKIT_API_SECRET!
 * )
 * at.addGrant({
 *   canPublish: true,
 *   canPublishData: true,
 *   canSubscribe: true,
 *   room: roomName,
 *   roomJoin: true,
 * })
 *
 * const token = at.toJwt()
 * return { token, url: process.env.LIVEKIT_URL }
 * ```
 */
export async function getLiveKitToken(
  roomName: string,
  participantName: string
): Promise<{ token: string; url: string }> {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, participantName }),
    })

    if (!response.ok) {
      throw new Error('Failed to get LiveKit token')
    }

    return await response.json()
  } catch (error) {
    console.error('[LiveKit] Token fetch error:', error)
    throw error
  }
}

/**
 * Example: Connect to LiveKit room using React hook
 *
 * TODO: Replace old WebRTC connection with LiveKit
 *
 * Old approach (custom WebRTC):
 * ```typescript
 * const [localStream, setLocalStream] = useState(null)
 * const [participants, setParticipants] = useState([])
 * useEffect(() => {
 *   initializeLocalMedia()
 *   initializeSignaling()
 * }, [])
 * ```
 *
 * New approach (LiveKit):
 * ```typescript
 * import {
 *   LiveKitRoom,
 *   VideoConference,
 *   GridLayout,
 *   ParticipantTile,
 *   RoomAudioRenderer,
 *   useLocalParticipant,
 *   useRemoteParticipants,
 * } from 'livekit-react'
 *
 * export default function InterviewRoom() {
 *   const [token, setToken] = useState('')
 *   const [url, setUrl] = useState('')
 *
 *   useEffect(() => {
 *     getLiveKitToken(roomId, participantName).then(({ token, url }) => {
 *       setToken(token)
 *       setUrl(url)
 *     })
 *   }, [])
 *
 *   if (!token || !url) return <LoadingState />
 *
 *   return (
 *     <LiveKitRoom
 *       video={true}
 *       audio={true}
 *       token={token}
 *       serverUrl={url}
 *       data-lk-theme="dark"
 *       onError={(error) => console.error(error)}
 *     >
 *       <VideoConference />
 *       <RoomAudioRenderer />
 *     </LiveKitRoom>
 *   )
 * }
 * ```
 */

/**
 * Custom LiveKit hook for recording
 *
 * TODO: Implement recording management
 */
export async function startRecording(roomName: string): Promise<string> {
  try {
    const response = await fetch('/api/livekit/recording/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName }),
    })

    if (!response.ok) throw new Error('Failed to start recording')
    const data = await response.json()
    return data.recordingId
  } catch (error) {
    console.error('[LiveKit] Recording start error:', error)
    throw error
  }
}

/**
 * Stop recording
 *
 * TODO: Implement recording stop
 */
export async function stopRecording(recordingId: string): Promise<void> {
  try {
    const response = await fetch(`/api/livekit/recording/${recordingId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to stop recording')
  } catch (error) {
    console.error('[LiveKit] Recording stop error:', error)
    throw error
  }
}

/**
 * Get room info
 *
 * TODO: Query LiveKit admin API
 */
export async function getRoomInfo(roomName: string): Promise<any> {
  try {
    const response = await fetch(`/api/livekit/rooms/${roomName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to get room info')
    return await response.json()
  } catch (error) {
    console.error('[LiveKit] Room info error:', error)
    throw error
  }
}

export default {
  getLiveKitToken,
  startRecording,
  stopRecording,
  getRoomInfo,
}
