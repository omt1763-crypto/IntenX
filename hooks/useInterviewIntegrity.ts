/**
 * Interview Integrity Monitor Hook
 * Combines deepfake detection and window switching detection
 * Handles violations and cancellation logic
 */

'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { deepfakeDetector, DeepfakeDetectionResult } from '@/lib/interview-integrity/deepfake-detector'
import { windowSwitchDetector, WindowIntegrityStatus } from '@/lib/interview-integrity/window-switch-detector'

export interface IntegrityViolation {
  id: string
  type: 'deepfake' | 'window-switch' | 'ai-voice'
  severity: 'warning' | 'critical'
  description: string
  timestamp: number
  details: Record<string, any>
}

export interface IntegrityMonitorState {
  isMonitoring: boolean
  violations: IntegrityViolation[]
  deepfakeDetectionResult: DeepfakeDetectionResult | null
  windowStatus: WindowIntegrityStatus | null
  shouldCancelInterview: boolean
  cancellationReason: string | null
}

export function useInterviewIntegrity() {
  const [state, setState] = useState<IntegrityMonitorState>({
    isMonitoring: false,
    violations: [],
    deepfakeDetectionResult: null,
    windowStatus: null,
    shouldCancelInterview: false,
    cancellationReason: null
  })

  const videoRefForAnalysis = useRef<HTMLVideoElement | null>(null)
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const violationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Initialize integrity monitoring
   */
  const initializeMonitoring = useCallback(
    async (videoElement: HTMLVideoElement, audioStream: MediaStream) => {
      try {
        console.log('[IntegrityMonitor] 🔍 Initializing interview integrity monitoring...')

        // Initialize window switch detector
        windowSwitchDetector.init()

        // Store references
        videoRefForAnalysis.current = videoElement
        mediaStreamRef.current = audioStream

        // Initialize deepfake detector
        deepfakeDetector.init(audioStream, audioStream)

        // Try to enforce fullscreen
        try {
          const containerElement = videoElement.parentElement
          if (containerElement) {
            const fullscreenEnforced = await windowSwitchDetector.enforceFullscreen(containerElement)
            console.log('[IntegrityMonitor] Fullscreen enforced:', fullscreenEnforced)
          }
        } catch (error) {
          console.warn('[IntegrityMonitor] Could not enforce fullscreen:', error)
        }

        // Start periodic analysis
        startAnalysis()

        setState(prev => ({
          ...prev,
          isMonitoring: true
        }))

        console.log('[IntegrityMonitor] ✅ Monitoring initialized')
      } catch (error) {
        console.error('[IntegrityMonitor] ❌ Initialization error:', error)
      }
    },
    []
  )

  /**
   * Start continuous analysis
   */
  const startAnalysis = useCallback(() => {
    // Video frame analysis every 500ms
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current)

    analysisIntervalRef.current = setInterval(() => {
      if (videoRefForAnalysis.current && videoRefForAnalysis.current.readyState === 4) {
        analyzeVideoFrame()
      }

      // Check for window integrity violations every 1 second
      checkWindowViolations()
    }, 500)
  }, [])

  /**
   * Analyze current video frame for deepfakes
   */
  const analyzeVideoFrame = useCallback(() => {
    if (!videoRefForAnalysis.current) return

    try {
      const violations = deepfakeDetector.analyzeVideoFrame(videoRefForAnalysis.current)

      if (violations.length > 0) {
        console.log('[IntegrityMonitor] 🚨 Deepfake artifacts detected:', violations)
        addViolations(
          violations.map(v => ({
            id: `deepfake-${Date.now()}-${Math.random()}`,
            type: 'deepfake' as const,
            severity: v.severity as 'warning' | 'critical',
            description: v.description,
            timestamp: Date.now(),
            details: {
              frameNumber: v.frameNumber,
              confidence: v.confidence,
              artifactType: v.type
            }
          }))
        )
      }
    } catch (error) {
      console.error('[IntegrityMonitor] Video analysis error:', error)
    }
  }, [])

  /**
   * Check for window switching violations
   */
  const checkWindowViolations = useCallback(() => {
    const status = windowSwitchDetector.getStatus()

    setState(prev => ({
      ...prev,
      windowStatus: status
    }))

    // Check if new violations occurred
    if (status.violations.length > 0) {
      const newViolations = status.violations.map((v, index) => ({
        id: `window-${Date.now()}-${index}`,
        type: 'window-switch' as const,
        severity: v.severity as 'warning' | 'critical',
        description: v.description,
        timestamp: v.timestamp,
        details: v.details
      }))

      // Only add if they haven't been added before
      setState(prev => {
        const existingIds = new Set(prev.violations.map(v => v.id))
        const freshViolations = newViolations.filter(
          v => !existingIds.has(v.id) && v.timestamp > (Date.now() - 1000)
        )

        if (freshViolations.length > 0) {
          console.log('[IntegrityMonitor] 🚨 Window violations detected:', freshViolations)
          return {
            ...prev,
            violations: [...prev.violations, ...freshViolations]
          }
        }
        return prev
      })
    }

    // Check if interview should be cancelled
    if (status.violations.length > 0 && windowSwitchDetector.shouldCancelInterview()) {
      setState(prev => ({
        ...prev,
        shouldCancelInterview: true,
        cancellationReason: windowSwitchDetector.getCancellationReason()
      }))
    }
  }, [])

  /**
   * Add violations to state
   */
  const addViolations = useCallback((violations: IntegrityViolation[]) => {
    setState(prev => ({
      ...prev,
      violations: [...prev.violations, ...violations],
      // Cancel if we have critical violations
      shouldCancelInterview: violations.some(v => v.severity === 'critical') || prev.shouldCancelInterview,
      cancellationReason:
        violations.find(v => v.severity === 'critical')?.description || prev.cancellationReason
    }))
  }, [])

  /**
   * Get deepfake detection result
   */
  const getDeepfakeDetectionResult = useCallback(() => {
    if (!videoRefForAnalysis.current || !mediaStreamRef.current) {
      return null
    }

    try {
      const violations = deepfakeDetector.analyzeVideoFrame(videoRefForAnalysis.current)
      // In production, you'd analyze audio too by extracting from the stream
      const result = deepfakeDetector.getDetectionResult(violations, [])

      setState(prev => ({
        ...prev,
        deepfakeDetectionResult: result
      }))

      return result
    } catch (error) {
      console.error('[IntegrityMonitor] Error getting detection result:', error)
      return null
    }
  }, [])

  /**
   * Stop monitoring and cleanup
   */
  const stopMonitoring = useCallback(() => {
    console.log('[IntegrityMonitor] Stopping monitoring...')

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    if (violationCheckIntervalRef.current) {
      clearInterval(violationCheckIntervalRef.current)
    }

    windowSwitchDetector.destroy()

    setState(prev => ({
      ...prev,
      isMonitoring: false
    }))

    console.log('[IntegrityMonitor] Monitoring stopped')
  }, [])

  /**
   * Get formatted violation report
   */
  const getViolationReport = useCallback(() => {
    const report = {
      totalViolations: state.violations.length,
      criticalViolations: state.violations.filter(v => v.severity === 'critical').length,
      warningViolations: state.violations.filter(v => v.severity === 'warning').length,
      deepfakeDetections: state.violations.filter(v => v.type === 'deepfake').length,
      windowSwitchDetections: state.violations.filter(v => v.type === 'window-switch').length,
      aiVoiceDetections: state.violations.filter(v => v.type === 'ai-voice').length,
      violations: state.violations,
      deepfakeResult: state.deepfakeDetectionResult,
      windowStatus: state.windowStatus,
      timestamp: Date.now()
    }

    return report
  }, [state])

  /**
   * Reset monitoring
   */
  const resetMonitoring = useCallback(() => {
    windowSwitchDetector.reset()
    setState({
      isMonitoring: false,
      violations: [],
      deepfakeDetectionResult: null,
      windowStatus: null,
      shouldCancelInterview: false,
      cancellationReason: null
    })

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    if (violationCheckIntervalRef.current) {
      clearInterval(violationCheckIntervalRef.current)
    }

    console.log('[IntegrityMonitor] Reset complete')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    // State
    ...state,

    // Methods
    initializeMonitoring,
    stopMonitoring,
    resetMonitoring,
    getDeepfakeDetectionResult,
    getViolationReport,
    addViolations,

    // Direct access to detectors if needed
    deepfakeDetector,
    windowSwitchDetector
  }
}
