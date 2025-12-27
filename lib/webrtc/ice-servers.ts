/**
 * ICE Server Configuration
 *
 * Configures STUN/TURN servers for NAT traversal and connection establishment.
 *
 * STUN (Session Traversal Utilities for NAT):
 * - Discovers public IP address
 * - No media relay
 * - Free, public servers available
 *
 * TURN (Traversal Using Relays around NAT):
 * - Relays media when direct connection fails
 * - Higher bandwidth cost
 * - Requires authentication tokens
 *
 * Recommended Production Providers:
 * 1. Xirsys - https://xirsys.com
 * 2. Twilio - https://www.twilio.com/stun-turn
 * 3. Coturn - Self-hosted open-source
 * 4. Google Cloud - https://developers.google.com/identity/protocols/oauth2
 */

import { v4 as uuidv4 } from 'uuid'

export interface ICEServer {
  urls: string[] | string
  username?: string
  credential?: string
  credentialType?: 'password' | 'oauth'
}

export interface RTCConfiguration {
  iceServers: ICEServer[]
  iceTransportPolicy?: 'all' | 'relay'
  bundlePolicy?: 'balanced' | 'max-bundle' | 'max-compat'
  rtcpMuxPolicy?: 'require' | 'negotiate'
}

/**
 * Get ICE servers with STUN and TURN configuration
 */
export function getICEServers(): RTCConfiguration {
  const config: RTCConfiguration = {
    iceServers: [],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  }

  // Public STUN servers (free, no auth needed)
  const publicSTUNServers: ICEServer[] = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:3478'] },
    { urls: ['stun:stun4.l.google.com:19302'] },
  ]

  config.iceServers.push(...publicSTUNServers)

  // TURN servers (production - requires token)
  const turnServers = getTURNServers()
  if (turnServers.length > 0) {
    config.iceServers.push(...turnServers)
  }

  return config
}

/**
 * Get TURN servers with dynamic token authentication
 *
 * TODO: Implement based on your TURN provider:
 *
 * Option 1: Xirsys
 * - Get API credentials from https://xirsys.com
 * - Call their token generation endpoint
 * - Returns TURN server URLs with credentials
 *
 * Option 2: Twilio
 * - Use Twilio Account SID and Auth Token
 * - Call /Tokens endpoint to get credentials
 * - Valid for ~24 hours
 *
 * Option 3: Self-hosted Coturn
 * - Deploy Coturn server on your infrastructure
 * - Use shared secret or long-term credentials
 * - Generate HMAC token from username + timestamp
 */
function getTURNServers(): ICEServer[] {
  const servers: ICEServer[] = []

  // TODO: Implement TURN token fetching
  // const xirsysToken = await fetchXirsysToken()
  // if (xirsysToken) {
  //   servers.push({
  //     urls: xirsysToken.d.v,
  //     username: xirsysToken.d.u,
  //     credential: xirsysToken.d.p,
  //     credentialType: 'password'
  //   })
  // }

  // Example: Self-hosted Coturn with shared secret
  if (process.env.NEXT_PUBLIC_TURN_SERVER && process.env.NEXT_PUBLIC_TURN_SECRET) {
    const timestamp = Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
    const username = `${timestamp}:interviewverse`
    const credential = generateHMAC(username, process.env.NEXT_PUBLIC_TURN_SECRET)

    servers.push(
      {
        urls: [process.env.NEXT_PUBLIC_TURN_SERVER],
        username,
        credential,
        credentialType: 'password',
      },
      {
        urls: [process.env.NEXT_PUBLIC_TURN_SERVER_BACKUP || ''],
        username,
        credential,
        credentialType: 'password',
      }
    )
  }

  return servers
}

/**
 * Generate HMAC for Coturn authentication
 * Uses base64 encoding for SHA1 hash
 */
function generateHMAC(username: string, secret: string): string {
  // TODO: Implement proper HMAC-SHA1 generation
  // This requires crypto library (Node.js built-in or crypto-js)
  /*
  import crypto from 'crypto'

  const hmac = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64')

  return hmac
  */

  // Placeholder
  return Buffer.from(username).toString('base64')
}

/**
 * Example: Xirsys token fetcher
 *
 * TODO: Implement server-side endpoint:
 * POST /api/webrtc/turn-token
 *
 * Backend should:
 * 1. Verify user authentication
 * 2. Call Xirsys API with credentials
 * 3. Return TURN server URLs and credentials
 * 4. Cache tokens to avoid excessive API calls
 */
export async function fetchXirsysToken(): Promise<any> {
  try {
    const response = await fetch('/api/webrtc/turn-token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to fetch TURN token')
    return await response.json()
  } catch (error) {
    console.error('[ICE] Xirsys token fetch error:', error)
    return null
  }
}

/**
 * Example: Twilio token fetcher
 *
 * TODO: Implement server-side endpoint:
 * POST /api/webrtc/twilio-token
 *
 * Backend should:
 * 1. Use Twilio Account SID and Auth Token
 * 2. Call Twilio REST API to get TURN credentials
 * 3. Return token with expiration
 */
export async function fetchTwilioToken(): Promise<any> {
  try {
    const response = await fetch('/api/webrtc/twilio-token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to fetch Twilio token')
    return await response.json()
  } catch (error) {
    console.error('[ICE] Twilio token fetch error:', error)
    return null
  }
}

/**
 * Validate ICE server configuration
 */
export function validateICEServers(config: RTCConfiguration): boolean {
  if (!config.iceServers || config.iceServers.length === 0) {
    console.warn('[ICE] No ICE servers configured')
    return false
  }

  config.iceServers.forEach((server, idx) => {
    if (!server.urls || (Array.isArray(server.urls) && server.urls.length === 0)) {
      console.warn(`[ICE] Invalid server at index ${idx}:`, server)
    }
  })

  return true
}

export default getICEServers
