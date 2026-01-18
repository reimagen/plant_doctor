/**
 * Rate Limiting Utilities
 * Provides throttling and request limiting for livestream and API endpoints
 */

/**
 * Throttle media frames (video/audio) to prevent overwhelming the API
 * Returns true if the frame should be sent, false if it should be skipped
 */
export class MediaThrottler {
  private lastFrameTime = 0
  private minIntervalMs: number

  constructor(minIntervalMs: number = 1000) {
    this.minIntervalMs = minIntervalMs
  }

  shouldSendFrame(): boolean {
    const now = Date.now()
    if (now - this.lastFrameTime >= this.minIntervalMs) {
      this.lastFrameTime = now
      return true
    }
    return false
  }

  reset(): void {
    this.lastFrameTime = 0
  }
}

/**
 * Rate limiter for tool function calls
 * Tracks calls per type and enforces limits
 */
export class ToolCallRateLimiter {
  private callCounts = new Map<string, { count: number; resetTime: number }>()
  private readonly windowMs: number
  private readonly maxCallsPerWindow: number

  constructor(maxCallsPerWindow: number = 10, windowMs: number = 60000) {
    this.maxCallsPerWindow = maxCallsPerWindow
    this.windowMs = windowMs
  }

  canCall(toolName: string): boolean {
    const now = Date.now()
    const existing = this.callCounts.get(toolName)

    if (!existing || now > existing.resetTime) {
      // Reset window
      this.callCounts.set(toolName, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (existing.count < this.maxCallsPerWindow) {
      existing.count++
      return true
    }

    return false
  }

  getRemainingCalls(toolName: string): number {
    const existing = this.callCounts.get(toolName)
    if (!existing || Date.now() > existing.resetTime) {
      return this.maxCallsPerWindow
    }
    return Math.max(0, this.maxCallsPerWindow - existing.count)
  }

  getResetTime(toolName: string): number {
    const existing = this.callCounts.get(toolName)
    return existing?.resetTime || Date.now()
  }

  reset(): void {
    this.callCounts.clear()
  }
}

/**
 * Simple token bucket rate limiter for API requests
 * Allows burst traffic but enforces long-term rate limits
 */
export class TokenBucketLimiter {
  private tokens: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per second
  private lastRefillTime: number

  constructor(maxTokens: number = 10, refillRatePerSecond: number = 2) {
    this.maxTokens = maxTokens
    this.tokens = maxTokens
    this.refillRate = refillRatePerSecond
    this.lastRefillTime = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefillTime) / 1000 // Convert to seconds
    const tokensToAdd = timePassed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefillTime = now
  }

  canConsume(tokens: number = 1): boolean {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  getRemainingTokens(): number {
    this.refill()
    return this.tokens
  }

  reset(): void {
    this.tokens = this.maxTokens
    this.lastRefillTime = Date.now()
  }
}

/**
 * Request filter to validate plant-related content
 */
export class PlantContextValidator {
  private readonly plantKeywords = [
    'plant',
    'water',
    'soil',
    'leaf',
    'leaves',
    'stem',
    'root',
    'flower',
    'pot',
    'light',
    'humidity',
    'temperature',
    'photosynthesis',
    'fertilizer',
    'nutrition',
    'disease',
    'pest',
    'fungal',
    'bacterial',
    'wilting',
    'yellowing',
    'browning',
    'chlorophyll',
    'transpiration',
    'propagation',
    'pruning',
    'repotting',
    'drainage',
    'compost'
  ]

  isPlantRelated(text: string): boolean {
    const lowerText = text.toLowerCase()

    // Check if any plant keyword is present
    return this.plantKeywords.some(keyword => lowerText.includes(keyword))
  }

  validateRequest(userText: string): { isValid: boolean; reason?: string } {
    // Allow short responses or confirmations
    if (userText.length < 3) {
      return { isValid: true }
    }

    // Check if request is plant-related
    if (!this.isPlantRelated(userText)) {
      return {
        isValid: false,
        reason: 'Request does not appear to be plant-related'
      }
    }

    return { isValid: true }
  }
}
