'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface RemoteParticipant {
  id: string
  identity: string
  role: 'candidate' | 'recruiter'
  videoTrack: MediaStreamTrack | null
  audioTrack: MediaStreamTrack | null
  peerConnection: RTCPeerConnection | null
}

interface VideoGridProps {
  participants: RemoteParticipant[]
}

/**
 * VideoGrid Component
 *
 * Displays remote participants' video feeds in a responsive grid.
 * Each participant gets a video element with audio track attached.
 *
 * RESPONSIVE LAYOUT:
 * - 1 participant: Full width
 * - 2-4 participants: 2 columns
 * - 5+ participants: 3 columns (can be adjusted)
 */
function RemoteVideoElement({
  participant,
  index,
}: {
  participant: RemoteParticipant
  index: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Attach video track
    if (participant.videoTrack && videoRef.current) {
      const stream = new MediaStream([participant.videoTrack])
      videoRef.current.srcObject = stream
    }
  }, [participant.videoTrack])

  useEffect(() => {
    // Attach audio track
    if (participant.audioTrack && audioRef.current) {
      const stream = new MediaStream([participant.audioTrack])
      audioRef.current.srcObject = stream
    }
  }, [participant.audioTrack])

  const videoEnabled = !!participant.videoTrack?.enabled
  const audioEnabled = !!participant.audioTrack?.enabled

  return (
    <motion.div
      key={participant.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-lg overflow-hidden bg-neutral-800 aspect-video"
    >
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Audio (hidden but plays) */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* No Video Placeholder */}
      {!videoEnabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900 flex flex-col items-center justify-center">
          <div className="text-3xl mb-2">
            {participant.role === 'candidate' ? '👤' : '💼'}
          </div>
          <p className="text-xs text-neutral-400">Camera off</p>
        </div>
      )}

      {/* Participant Info */}
      <div className="absolute top-3 left-3 flex items-center gap-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
        <span>{participant.role === 'candidate' ? '👤' : '💼'}</span>
        <span className="truncate max-w-24">{participant.identity}</span>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        {!videoEnabled && (
          <div className="p-1.5 bg-neutral-500/50 rounded-full">
            <VideoOff className="w-3 h-3 text-white" />
          </div>
        )}
        {!audioEnabled && (
          <div className="p-1.5 bg-neutral-500/50 rounded-full">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function VideoGrid({ participants }: VideoGridProps) {
  // Calculate responsive grid columns
  const gridCols = useMemo(() => {
    if (participants.length === 0) return 1
    if (participants.length <= 2) return 2
    return 'auto-fit'
  }, [participants.length])

  if (participants.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 rounded-lg bg-neutral-800 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-neutral-400">Waiting for participants to join...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      className={`grid gap-4 flex-1 overflow-y-auto ${
        participants.length === 1
          ? 'grid-cols-1'
          : participants.length <= 4
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {participants.map((participant, idx) => (
        <RemoteVideoElement
          key={participant.id}
          participant={participant}
          index={idx}
        />
      ))}
    </motion.div>
  )
}
