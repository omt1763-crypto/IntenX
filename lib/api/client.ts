/**
 * API Client Utilities
 *
 * Centralized API communication layer with error handling, retries, and types
 */

export interface APIConfig {
  baseURL: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface APIRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  data?: T
  headers?: Record<string, string>
  timeout?: number
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status: number
}

/**
 * API Client class
 */
export class APIClient {
  private baseURL: string
  private timeout: number
  private retries: number
  private retryDelay: number

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout ?? 30000
    this.retries = config.retries ?? 3
    this.retryDelay = config.retryDelay ?? 1000
  }

  /**
   * Make API request with automatic retries and error handling
   */
  async request<T = any, R = any>(req: APIRequest<T>): Promise<APIResponse<R>> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), req.timeout ?? this.timeout)

        const response = await fetch(`${this.baseURL}${req.endpoint}`, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...req.headers,
          },
          body: req.data ? JSON.stringify(req.data) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const status = response.status
        const contentType = response.headers.get('content-type')
        let data: any

        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        if (status >= 200 && status < 300) {
          return {
            success: true,
            data: data.data ?? data,
            status,
          }
        }

        // 4xx errors don't retry
        if (status >= 400 && status < 500) {
          return {
            success: false,
            error: data.error ?? `HTTP ${status}`,
            status,
          }
        }

        // 5xx errors retry
        if (status >= 500) {
          lastError = new Error(`HTTP ${status}: ${data.error}`)
          if (attempt < this.retries) {
            await this.delay(this.retryDelay * (attempt + 1))
            continue
          }
        }

        return {
          success: false,
          error: data.error ?? `HTTP ${status}`,
          status,
        }
      } catch (error) {
        lastError = error as Error

        if (attempt < this.retries && this.shouldRetry(error)) {
          await this.delay(this.retryDelay * (attempt + 1))
          continue
        }

        return {
          success: false,
          error: lastError.message,
          status: 0,
        }
      }
    }

    return {
      success: false,
      error: lastError?.message ?? 'Max retries exceeded',
      status: 0,
    }
  }

  /**
   * GET request shorthand
   */
  async get<R = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<undefined, R>({
      method: 'GET',
      endpoint,
      headers,
    })
  }

  /**
   * POST request shorthand
   */
  async post<T = any, R = any>(
    endpoint: string,
    data?: T,
    headers?: Record<string, string>
  ) {
    return this.request<T, R>({
      method: 'POST',
      endpoint,
      data,
      headers,
    })
  }

  /**
   * PUT request shorthand
   */
  async put<T = any, R = any>(
    endpoint: string,
    data?: T,
    headers?: Record<string, string>
  ) {
    return this.request<T, R>({
      method: 'PUT',
      endpoint,
      data,
      headers,
    })
  }

  /**
   * PATCH request shorthand
   */
  async patch<T = any, R = any>(
    endpoint: string,
    data?: T,
    headers?: Record<string, string>
  ) {
    return this.request<T, R>({
      method: 'PATCH',
      endpoint,
      data,
      headers,
    })
  }

  /**
   * DELETE request shorthand
   */
  async delete<R = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<undefined, R>({
      method: 'DELETE',
      endpoint,
      headers,
    })
  }

  /**
   * Get auth headers (from localStorage, cookies, etc)
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // TODO: Get JWT token from your auth system
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   headers['Authorization'] = `Bearer ${token}`
    // }

    return headers
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: any): boolean {
    // Don't retry client errors
    if (error.name === 'TypeError') return false

    // Retry network errors and timeouts
    if (error.name === 'AbortError') return true
    if (error.message.includes('network')) return true

    return true
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Interview API endpoints
 *
 * TODO: Implement backend endpoints
 */
export interface InterviewAPI {
  join(roomId: string, identity: string, role: string): Promise<APIResponse>
  leave(roomId: string): Promise<APIResponse>
  transcribe(audioBlob: Blob): Promise<APIResponse>
  analyze(transcription: string, jobReqs: string): Promise<APIResponse>
  getMetrics(interviewId: string): Promise<APIResponse>
  saveReport(interviewId: string, report: any): Promise<APIResponse>
}

export class InterviewAPIClient implements InterviewAPI {
  private client: APIClient

  constructor(baseURL: string) {
    this.client = new APIClient({ baseURL })
  }

  async join(roomId: string, identity: string, role: string) {
    return this.client.post('/api/interviews/join', {
      roomId,
      identity,
      role,
    })
  }

  async leave(roomId: string) {
    return this.client.post('/api/interviews/leave', { roomId })
  }

  async transcribe(audioBlob: Blob) {
    const formData = new FormData()
    formData.append('audio', audioBlob)

    return fetch(`/api/interviews/transcribe`, {
      method: 'POST',
      body: formData,
    }).then((r) => r.json())
  }

  async analyze(transcription: string, jobReqs: string) {
    return this.client.post('/api/interviews/analyze', {
      transcription,
      jobReqs,
    })
  }

  async getMetrics(interviewId: string) {
    return this.client.get(`/api/interviews/${interviewId}/metrics`)
  }

  async saveReport(interviewId: string, report: any) {
    return this.client.post(`/api/interviews/${interviewId}/report`, report)
  }
}

/**
 * Create singleton API client instance
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
export const interviewAPI = new InterviewAPIClient(API_BASE_URL)

export default {
  APIClient,
  InterviewAPIClient,
  interviewAPI,
}
