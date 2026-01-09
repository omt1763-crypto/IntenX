/**
 * Interview Conversation Flow Manager
 * Manages the turn-taking between AI and user to ensure clean audio capture
 */

export interface ConversationTurn {
  speaker: 'ai' | 'user'
  startTime: number
  endTime?: number
  content?: string
}

export interface ConversationFlowState {
  currentTurn: 'ai' | 'user' | 'silence'
  isAISpeaking: boolean
  isUserSpeaking: boolean
  lastTurnChangeTime: number
  turnHistory: ConversationTurn[]
  aiSpeakingDuration: number
  userSpeakingDuration: number
}

export class ConversationFlowManager {
  private currentTurn: 'ai' | 'user' | 'silence' = 'silence'
  private isAISpeaking: boolean = false
  private isUserSpeaking: boolean = false
  private lastTurnChangeTime: number = Date.now()
  private turnHistory: ConversationTurn[] = []
  private aiSpeakingStartTime: number = 0
  private userSpeakingStartTime: number = 0
  private minUserSpeechDuration: number = 300 // ms - minimum user response
  private maxAISpeechDuration: number = 120000 // ms - 2 minutes max
  private turnChangeBuffer: number = 500 // ms - buffer between turns

  /**
   * Signal that AI is starting to speak
   */
  signalAISpeakingStart(): void {
    if (this.isAISpeaking) return

    // End user turn if active
    if (this.isUserSpeaking) {
      this.signalUserSpeakingEnd()
    }

    this.isAISpeaking = true
    this.currentTurn = 'ai'
    this.aiSpeakingStartTime = Date.now()
    this.lastTurnChangeTime = this.aiSpeakingStartTime

    this.turnHistory.push({
      speaker: 'ai',
      startTime: this.aiSpeakingStartTime
    })

    console.log('[ConversationFlow] 🤖 AI SPEAKING START')
  }

  /**
   * Signal that AI finished speaking
   */
  signalAISpeakingEnd(): void {
    if (!this.isAISpeaking) return

    const endTime = Date.now()
    this.isAISpeaking = false

    // Update last turn in history
    if (this.turnHistory.length > 0) {
      const lastTurn = this.turnHistory[this.turnHistory.length - 1]
      if (lastTurn.speaker === 'ai' && !lastTurn.endTime) {
        lastTurn.endTime = endTime
      }
    }

    const duration = endTime - this.aiSpeakingStartTime
    console.log(`[ConversationFlow] 🤖 AI SPEAKING END - Duration: ${duration}ms`)

    // Transition to listening state with buffer
    this.currentTurn = 'silence'
    this.lastTurnChangeTime = endTime
  }

  /**
   * Signal that user is speaking
   */
  signalUserSpeakingStart(): void {
    if (this.isUserSpeaking) return

    // Only allow user to speak if AI is not speaking
    if (this.isAISpeaking) {
      console.log('[ConversationFlow] ⚠️ User speaking but AI is still speaking - ignoring')
      return
    }

    const startTime = Date.now()
    this.isUserSpeaking = true
    this.currentTurn = 'user'
    this.userSpeakingStartTime = startTime
    this.lastTurnChangeTime = startTime

    this.turnHistory.push({
      speaker: 'user',
      startTime
    })

    console.log('[ConversationFlow] 👤 USER SPEAKING START')
  }

  /**
   * Signal that user finished speaking
   */
  signalUserSpeakingEnd(): void {
    if (!this.isUserSpeaking) return

    const endTime = Date.now()
    this.isUserSpeaking = false

    // Update last turn in history
    if (this.turnHistory.length > 0) {
      const lastTurn = this.turnHistory[this.turnHistory.length - 1]
      if (lastTurn.speaker === 'user' && !lastTurn.endTime) {
        lastTurn.endTime = endTime
      }
    }

    const duration = endTime - this.userSpeakingStartTime
    console.log(`[ConversationFlow] 👤 USER SPEAKING END - Duration: ${duration}ms`)

    this.currentTurn = 'silence'
    this.lastTurnChangeTime = endTime
  }

  /**
   * Check if it's valid for user to be speaking now
   */
  canUserSpeak(): boolean {
    // User cannot speak while AI is speaking
    if (this.isAISpeaking) {
      return false
    }

    // Require a buffer after AI finishes
    const timeSinceAIEnded = Date.now() - this.lastTurnChangeTime
    if (this.currentTurn === 'silence' && timeSinceAIEnded < 200) {
      return false
    }

    return true
  }

  /**
   * Check if it's valid for AI to be speaking now
   */
  canAISpeak(): boolean {
    // AI cannot speak while user is speaking
    if (this.isUserSpeaking) {
      return false
    }

    // Require user to have spoken for minimum duration
    if (this.currentTurn === 'user' && this.turnHistory.length > 0) {
      const lastTurn = this.turnHistory[this.turnHistory.length - 1]
      const userDuration = (lastTurn.endTime || Date.now()) - lastTurn.startTime
      if (userDuration < this.minUserSpeechDuration) {
        return false
      }
    }

    return true
  }

  /**
   * Get current flow state
   */
  getState(): ConversationFlowState {
    return {
      currentTurn: this.currentTurn,
      isAISpeaking: this.isAISpeaking,
      isUserSpeaking: this.isUserSpeaking,
      lastTurnChangeTime: this.lastTurnChangeTime,
      turnHistory: this.turnHistory,
      aiSpeakingDuration: this.isAISpeaking
        ? Date.now() - this.aiSpeakingStartTime
        : 0,
      userSpeakingDuration: this.isUserSpeaking
        ? Date.now() - this.userSpeakingStartTime
        : 0
    }
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(): {
    totalTurns: number
    aiTurns: number
    userTurns: number
    totalDuration: number
  } {
    const aiTurns = this.turnHistory.filter(t => t.speaker === 'ai').length
    const userTurns = this.turnHistory.filter(t => t.speaker === 'user').length

    let totalDuration = 0
    for (const turn of this.turnHistory) {
      const duration = (turn.endTime || Date.now()) - turn.startTime
      totalDuration += duration
    }

    return {
      totalTurns: this.turnHistory.length,
      aiTurns,
      userTurns,
      totalDuration
    }
  }

  /**
   * Reset conversation flow
   */
  reset(): void {
    this.currentTurn = 'silence'
    this.isAISpeaking = false
    this.isUserSpeaking = false
    this.lastTurnChangeTime = Date.now()
    this.turnHistory = []
    this.aiSpeakingStartTime = 0
    this.userSpeakingStartTime = 0
    console.log('[ConversationFlow] Reset')
  }

  /**
   * Get turn history as text for logging
   */
  getTurnHistoryLog(): string {
    return this.turnHistory
      .map((turn, idx) => {
        const duration = (turn.endTime || Date.now()) - turn.startTime
        const speaker = turn.speaker === 'ai' ? '🤖 AI' : '👤 User'
        return `${idx + 1}. ${speaker} - ${duration}ms`
      })
      .join('\n')
  }
}
