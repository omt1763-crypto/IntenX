/**
 * Window Switching and Browser Tab Detection Module
 * Detects when candidate switches away from interview window/tab
 * Tracks screen focus, fullscreen mode, and tab visibility
 */

export interface WindowSwitchViolation {
  type: 'tab-switch' | 'window-blur' | 'fullscreen-exit' | 'screen-share-detected' | 'alt-tab-detected'
  severity: 'warning' | 'critical'
  description: string
  timestamp: number
  duration?: number // How long away
  details: Record<string, any>
}

export interface WindowIntegrityStatus {
  isInFocus: boolean
  isFullscreen: boolean
  isDocumentVisible: boolean
  violations: WindowSwitchViolation[]
  totalSwitches: number
  lastSwitchTime: number | null
}

class WindowSwitchDetector {
  private violations: WindowSwitchViolation[] = []
  private isWindowFocused: boolean = true
  private isFullscreenMode: boolean = false
  private isDocumentVisible: boolean = true
  private switchCount: number = 0
  private lastBlurTime: number | null = null
  private lastScreenChangeTime: number | null = null
  private focusWarningGiven: boolean = false
  private focusWarningCount: number = 0
  private readonly FIRST_BLUR_WARNING_THRESHOLD = 3000 // 3 seconds
  private readonly CRITICAL_VIOLATION_THRESHOLD = 5000 // 5 seconds
  private eventListeners: Array<{ element: any; event: string; handler: EventListener }> = []

  /**
   * Initialize window switch detector
   */
  init(): void {
    try {
      // Listen for window focus/blur events
      window.addEventListener('focus', this.handleWindowFocus.bind(this))
      window.addEventListener('blur', this.handleWindowBlur.bind(this))
      this.eventListeners.push({ element: window, event: 'focus', handler: this.handleWindowFocus.bind(this) })
      this.eventListeners.push({ element: window, event: 'blur', handler: this.handleWindowBlur.bind(this) })

      // Listen for visibility change (tab switching)
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
      this.eventListeners.push({ element: document, event: 'visibilitychange', handler: this.handleVisibilityChange.bind(this) })

      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this))
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this))
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this))
      document.addEventListener('msfullscreenchange', this.handleFullscreenChange.bind(this))
      this.eventListeners.push({ element: document, event: 'fullscreenchange', handler: this.handleFullscreenChange.bind(this) })

      // Listen for keyboard events to detect Alt+Tab attempts
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
      this.eventListeners.push({ element: window, event: 'keydown', handler: this.handleKeyDown.bind(this) })

      // Monitor screen orientation changes
      window.addEventListener('orientationchange', this.handleScreenOrientationChange.bind(this))
      this.eventListeners.push({ element: window, event: 'orientationchange', handler: this.handleScreenOrientationChange.bind(this) })

      console.log('[WindowSwitchDetector] ✅ Initialized - monitoring window integrity')
    } catch (error) {
      console.error('[WindowSwitchDetector] ❌ Initialization error:', error)
    }
  }

  /**
   * Window focus event handler
   */
  private handleWindowFocus(): void {
    if (!this.isWindowFocused) {
      const timeAwayMs = this.lastBlurTime ? Date.now() - this.lastBlurTime : 0
      
      console.log('[WindowSwitchDetector] 🔄 Window regained focus after', timeAwayMs, 'ms')

      // This is a return to the interview window
      this.isWindowFocused = true
      this.focusWarningGiven = false

      // Only log as violation if they were gone for a meaningful time
      if (timeAwayMs > 2000) {
        this.violations.push({
          type: 'window-blur',
          severity: timeAwayMs > this.CRITICAL_VIOLATION_THRESHOLD ? 'critical' : 'warning',
          description: `Candidate left interview window for ${(timeAwayMs / 1000).toFixed(1)} seconds`,
          timestamp: Date.now(),
          duration: timeAwayMs,
          details: {
            focusLostAt: this.lastBlurTime,
            focusRegainedAt: Date.now(),
            durationSeconds: timeAwayMs / 1000
          }
        })

        this.switchCount++
      }
    }
  }

  /**
   * Window blur event handler
   */
  private handleWindowBlur(): void {
    if (this.isWindowFocused) {
      console.log('[WindowSwitchDetector] ⚠️  Window lost focus - candidate may have switched applications')
      
      this.isWindowFocused = false
      this.lastBlurTime = Date.now()

      // Log immediate warning violation
      this.violations.push({
        type: 'window-blur',
        severity: 'warning',
        description: 'Candidate switched away from interview window',
        timestamp: Date.now(),
        details: {
          focusLostAt: this.lastBlurTime,
          wasFullscreen: this.isFullscreenMode
        }
      })

      this.switchCount++
    }
  }

  /**
   * Handle visibility change (tab switch detection)
   */
  private handleVisibilityChange(): void {
    const isVisible = document.visibilityState === 'visible'

    if (!isVisible) {
      console.log('[WindowSwitchDetector] ⚠️  Tab/window hidden - candidate switched tabs or applications')
      
      this.isDocumentVisible = false
      this.lastBlurTime = Date.now()

      // Critical violation - they switched away from our tab entirely
      this.violations.push({
        type: 'tab-switch',
        severity: 'critical',
        description: 'Candidate switched away from interview tab',
        timestamp: Date.now(),
        details: {
          visibilityState: 'hidden',
          switchedAt: this.lastBlurTime,
          wasFullscreen: this.isFullscreenMode
        }
      })

      this.switchCount++
    } else {
      if (!this.isDocumentVisible) {
        const timeAwayMs = this.lastBlurTime ? Date.now() - this.lastBlurTime : 0
        console.log('[WindowSwitchDetector] 🔄 Tab became visible again after', timeAwayMs, 'ms')
      }
      this.isDocumentVisible = true
    }
  }

  /**
   * Handle fullscreen mode changes
   */
  private handleFullscreenChange(): void {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    )

    if (isCurrentlyFullscreen && !this.isFullscreenMode) {
      console.log('[WindowSwitchDetector] ✅ Entered fullscreen mode')
      this.isFullscreenMode = true
      this.lastScreenChangeTime = Date.now()
    } else if (!isCurrentlyFullscreen && this.isFullscreenMode) {
      console.log('[WindowSwitchDetector] ⚠️  Exited fullscreen mode - security risk')
      
      this.isFullscreenMode = false
      this.lastScreenChangeTime = Date.now()

      // Exiting fullscreen is a violation
      this.violations.push({
        type: 'fullscreen-exit',
        severity: 'critical',
        description: 'Candidate exited fullscreen mode during interview',
        timestamp: Date.now(),
        details: {
          exitedAt: this.lastScreenChangeTime,
          allowsMultitasking: true
        }
      })

      this.switchCount++
    }
  }

  /**
   * Detect Alt+Tab or Alt+Escape attempts
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Detect Alt key combinations
    if (event.altKey) {
      if (event.key === 'Tab') {
        console.log('[WindowSwitchDetector] 🚨 Alt+Tab detected - application switching attempt')
        
        this.violations.push({
          type: 'alt-tab-detected',
          severity: 'critical',
          description: 'Candidate attempted Alt+Tab window switching',
          timestamp: Date.now(),
          details: {
            attemptedAt: Date.now(),
            altKey: event.altKey,
            tabKey: event.key === 'Tab'
          }
        })

        // Prevent the default Alt+Tab behavior
        event.preventDefault()
        event.stopPropagation()
        this.switchCount++
        return
      }

      if (event.key === 'Escape') {
        console.log('[WindowSwitchDetector] ⚠️  Alt+Escape detected')
        
        this.violations.push({
          type: 'window-blur',
          severity: 'warning',
          description: 'Candidate attempted Alt+Escape (minimize all windows)',
          timestamp: Date.now(),
          details: {
            attemptedAt: Date.now()
          }
        })

        event.preventDefault()
        event.stopPropagation()
        this.switchCount++
        return
      }
    }

    // Detect Cmd+Tab on Mac
    if ((event.metaKey || event.ctrlKey) && event.key === 'Tab') {
      console.log('[WindowSwitchDetector] 🚨 Cmd/Ctrl+Tab detected - application switching attempt')
      
      this.violations.push({
        type: 'alt-tab-detected',
        severity: 'critical',
        description: 'Candidate attempted Cmd/Ctrl+Tab window switching',
        timestamp: Date.now(),
        details: {
          attemptedAt: Date.now(),
          isMac: event.metaKey
        }
      })

      event.preventDefault()
      event.stopPropagation()
      this.switchCount++
    }

    // Detect right-click attempts (might be trying to inspect/copy content)
    if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
      console.log('[WindowSwitchDetector] ⚠️  Developer tools access attempt detected')
      
      this.violations.push({
        type: 'window-blur',
        severity: 'warning',
        description: 'Candidate attempted to open developer tools',
        timestamp: Date.now(),
        details: {
          attemptedAt: Date.now(),
          detectedVia: event.key === 'F12' ? 'F12' : 'Ctrl+Shift+I'
        }
      })

      event.preventDefault()
      event.stopPropagation()
    }
  }

  /**
   * Handle screen orientation change (mobile)
   */
  private handleScreenOrientationChange(): void {
    console.log('[WindowSwitchDetector] Screen orientation changed')

    this.violations.push({
      type: 'window-blur',
      severity: 'warning',
      description: 'Screen orientation changed during interview',
      timestamp: Date.now(),
      details: {
        orientation: (window.screen as any).orientation?.type || 'unknown',
        changedAt: Date.now()
      }
    })
  }

  /**
   * Enforce fullscreen mode for interview
   */
  async enforceFullscreen(element: HTMLElement): Promise<boolean> {
    try {
      const requestFullscreen =
        element.requestFullscreen ||
        (element as any).webkitRequestFullscreen ||
        (element as any).mozRequestFullScreen ||
        (element as any).msRequestFullscreen

      if (requestFullscreen) {
        await requestFullscreen.call(element)
        console.log('[WindowSwitchDetector] ✅ Fullscreen enforced')
        return true
      }
    } catch (error) {
      console.error('[WindowSwitchDetector] Failed to enforce fullscreen:', error)
    }
    return false
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('[WindowSwitchDetector] Error exiting fullscreen:', error)
    }
  }

  /**
   * Get current integrity status
   */
  getStatus(): WindowIntegrityStatus {
    return {
      isInFocus: this.isWindowFocused,
      isFullscreen: this.isFullscreenMode,
      isDocumentVisible: this.isDocumentVisible,
      violations: this.violations,
      totalSwitches: this.switchCount,
      lastSwitchTime: this.lastBlurTime
    }
  }

  /**
   * Clear violations history
   */
  clearViolations(): void {
    this.violations = []
    this.switchCount = 0
  }

  /**
   * Get critical violations only
   */
  getCriticalViolations(): WindowSwitchViolation[] {
    return this.violations.filter(v => v.severity === 'critical')
  }

  /**
   * Get all violations
   */
  getViolations(): WindowSwitchViolation[] {
    return [...this.violations]
  }

  /**
   * Check if interview should be cancelled
   */
  shouldCancelInterview(): boolean {
    const criticalViolations = this.getCriticalViolations()
    return criticalViolations.length > 0
  }

  /**
   * Get cancellation reason
   */
  getCancellationReason(): string {
    const criticalViolations = this.getCriticalViolations()
    
    if (criticalViolations.length === 0) {
      return 'No critical violations'
    }

    const reasons = criticalViolations.map(v => {
      switch (v.type) {
        case 'tab-switch':
          return 'Candidate switched away from interview tab'
        case 'fullscreen-exit':
          return 'Candidate exited fullscreen mode'
        case 'alt-tab-detected':
          return 'Candidate attempted to switch applications using Alt+Tab'
        case 'window-blur':
          return v.details.focusLostAt ? `Candidate left interview window for ${Math.round((v.duration || 0) / 1000)} seconds` : 'Candidate opened developer tools'
        default:
          return 'Integrity violation detected'
      }
    })

    return reasons[0] // Return the first critical reason
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.violations = []
    this.isWindowFocused = true
    this.isFullscreenMode = false
    this.isDocumentVisible = true
    this.switchCount = 0
    this.lastBlurTime = null
    this.focusWarningGiven = false
    this.focusWarningCount = 0
    console.log('[WindowSwitchDetector] Reset - ready for new interview')
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
    console.log('[WindowSwitchDetector] Destroyed - all listeners removed')
  }
}

export const windowSwitchDetector = new WindowSwitchDetector()
