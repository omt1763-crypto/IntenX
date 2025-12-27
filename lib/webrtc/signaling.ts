/**
 * WebRTC Signaling Service
 *
 * Manages Socket.io connection and SDP/ICE exchange for peer-to-peer communication.
 * This is the client-side signaling layer that coordinates with the backend.
 *
 * Backend Requirements:
 * - Socket.io server on NEXT_PUBLIC_SOCKET_URL
 * - JWT authentication via auth token
 * - Room management (join, leave, broadcast)
 * - SDP offer/answer relaying
 * - ICE candidate aggregation
 */

import io, { Socket } from 'socket.io-client'

export interface SignalingConfig {
  url: string
  roomId: string
  identity: string
  role: 'candidate' | 'recruiter'
  token: string
}

export interface ICEServer {
  urls: string[]
  username?: string
  credential?: string
}

export interface SignalingEvents {
  'user-joined': (data: { id: string; identity: string; role: string }) => void
  'offer': (data: { from: string; offer: RTCSessionDescriptionInit }) => void
  'answer': (data: { from: string; answer: RTCSessionDescriptionInit }) => void
  'ice-candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void
  'user-left': (data: { id: string }) => void
  'error': (error: string) => void
  'connected': () => void
  'disconnected': () => void
}

/**
 * SignalingClient - Manages WebRTC signaling via Socket.io
 */
export class SignalingClient {
  private socket: Socket | null = null
  private config: SignalingConfig
  private listeners: Map<string, Function[]> = new Map()

  constructor(config: SignalingConfig) {
    this.config = config
  }

  /**
   * Connect to signaling server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          auth: {
            token: this.config.token,
            roomId: this.config.roomId,
            identity: this.config.identity,
            role: this.config.role,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        })

        // Handle connection
        this.socket.on('connect', () => {
          console.log('[Signaling] Connected:', this.socket?.id)
          this.emit('connected')
          resolve()
        })

        // Handle connection error
        this.socket.on('connect_error', (error) => {
          console.error('[Signaling] Connection error:', error)
          this.emit('error', error.message)
          reject(error)
        })

        // Handle disconnect
        this.socket.on('disconnect', (reason) => {
          console.log('[Signaling] Disconnected:', reason)
          this.emit('disconnected')
        })

        // Register event handlers
        this.setupEventHandlers()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    // User joined room
    this.socket.on('user-joined', (data) => {
      console.log('[Signaling] User joined:', data.identity)
      this.emit('user-joined', data)
    })

    // Receive SDP offer
    this.socket.on('offer', (data) => {
      console.log('[Signaling] Offer received from:', data.from)
      this.emit('offer', data)
    })

    // Receive SDP answer
    this.socket.on('answer', (data) => {
      console.log('[Signaling] Answer received from:', data.from)
      this.emit('answer', data)
    })

    // Receive ICE candidate
    this.socket.on('ice-candidate', (data) => {
      console.log('[Signaling] ICE candidate received from:', data.from)
      this.emit('ice-candidate', data)
    })

    // User left room
    this.socket.on('user-left', (data) => {
      console.log('[Signaling] User left:', data.id)
      this.emit('user-left', data)
    })

    // Server error
    this.socket.on('error', (error) => {
      console.error('[Signaling] Server error:', error)
      this.emit('error', error)
    })
  }

  /**
   * Send SDP offer to peer
   */
  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket) throw new Error('Socket not connected')
    this.socket.emit('offer', { to, offer })
  }

  /**
   * Send SDP answer to peer
   */
  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket) throw new Error('Socket not connected')
    this.socket.emit('answer', { to, answer })
  }

  /**
   * Send ICE candidate to peer
   */
  sendICECandidate(to: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket) throw new Error('Socket not connected')
    this.socket.emit('ice-candidate', { to, candidate })
  }

  /**
   * Register event listener
   */
  on<K extends keyof SignalingEvents>(
    event: K,
    callback: SignalingEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback as Function)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback as Function)
        if (index > -1) callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof SignalingEvents>(
    event: K,
    data?: any
  ): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => cb(data))
    }
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.listeners.clear()
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

/**
 * Export singleton instance
 */
export default SignalingClient
