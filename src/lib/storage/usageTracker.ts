// Usage Tracker - Track API usage for all providers
import { localStorage } from './chromeStorage'
import type { AIProviderType } from '../ai/baseProvider'

export interface UsageRecord {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  requestCount: number
  lastUpdated: number
}

export interface ProviderUsage {
  claude: UsageRecord
  openai: UsageRecord
  gemini: UsageRecord
  openrouter: UsageRecord
}

export interface UsageStats {
  today: ProviderUsage
  thisMonth: ProviderUsage
  allTime: ProviderUsage
}

const STORAGE_KEY = 'apiUsageStats'

function createEmptyRecord(): UsageRecord {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    lastUpdated: Date.now(),
  }
}

function createEmptyProviderUsage(): ProviderUsage {
  return {
    claude: createEmptyRecord(),
    openai: createEmptyRecord(),
    gemini: createEmptyRecord(),
    openrouter: createEmptyRecord(),
  }
}

function createEmptyStats(): UsageStats {
  return {
    today: createEmptyProviderUsage(),
    thisMonth: createEmptyProviderUsage(),
    allTime: createEmptyProviderUsage(),
  }
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

class UsageTracker {
  private currentDateKey: string = ''
  private currentMonthKey: string = ''

  constructor() {
    this.updateDateKeys()
  }

  private updateDateKeys(): void {
    const now = new Date()
    this.currentDateKey = getDateKey(now)
    this.currentMonthKey = getMonthKey(now)
  }

  async getStats(): Promise<UsageStats> {
    try {
      const stored = await localStorage.get<{
        stats: UsageStats
        dateKey: string
        monthKey: string
      }>(STORAGE_KEY)

      if (!stored) {
        return createEmptyStats()
      }

      this.updateDateKeys()

      // Reset daily stats if date changed
      if (stored.dateKey !== this.currentDateKey) {
        stored.stats.today = createEmptyProviderUsage()
      }

      // Reset monthly stats if month changed
      if (stored.monthKey !== this.currentMonthKey) {
        stored.stats.thisMonth = createEmptyProviderUsage()
      }

      return stored.stats
    } catch (error) {
      console.error('Error getting usage stats:', error)
      return createEmptyStats()
    }
  }

  async recordUsage(
    provider: AIProviderType,
    promptTokens: number,
    completionTokens: number
  ): Promise<void> {
    try {
      this.updateDateKeys()
      const stats = await this.getStats()
      const totalTokens = promptTokens + completionTokens
      const now = Date.now()

      // Update today's stats
      stats.today[provider].promptTokens += promptTokens
      stats.today[provider].completionTokens += completionTokens
      stats.today[provider].totalTokens += totalTokens
      stats.today[provider].requestCount += 1
      stats.today[provider].lastUpdated = now

      // Update this month's stats
      stats.thisMonth[provider].promptTokens += promptTokens
      stats.thisMonth[provider].completionTokens += completionTokens
      stats.thisMonth[provider].totalTokens += totalTokens
      stats.thisMonth[provider].requestCount += 1
      stats.thisMonth[provider].lastUpdated = now

      // Update all-time stats
      stats.allTime[provider].promptTokens += promptTokens
      stats.allTime[provider].completionTokens += completionTokens
      stats.allTime[provider].totalTokens += totalTokens
      stats.allTime[provider].requestCount += 1
      stats.allTime[provider].lastUpdated = now

      await localStorage.set(STORAGE_KEY, {
        stats,
        dateKey: this.currentDateKey,
        monthKey: this.currentMonthKey,
      })
    } catch (error) {
      console.error('Error recording usage:', error)
    }
  }

  async resetStats(period: 'today' | 'thisMonth' | 'allTime' | 'all'): Promise<void> {
    try {
      const stats = await this.getStats()

      if (period === 'all') {
        await localStorage.set(STORAGE_KEY, {
          stats: createEmptyStats(),
          dateKey: this.currentDateKey,
          monthKey: this.currentMonthKey,
        })
        return
      }

      stats[period] = createEmptyProviderUsage()

      await localStorage.set(STORAGE_KEY, {
        stats,
        dateKey: this.currentDateKey,
        monthKey: this.currentMonthKey,
      })
    } catch (error) {
      console.error('Error resetting stats:', error)
    }
  }

  formatTokenCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }
}

export const usageTracker = new UsageTracker()
