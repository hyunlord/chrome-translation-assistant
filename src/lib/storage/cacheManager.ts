// Translation Cache Manager
interface CacheEntry {
  key: string
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: string
  timestamp: number
  accessCount: number
  lastAccessed: number
}

interface CacheOptions {
  maxSize?: number // Maximum number of entries
  ttl?: number // Time to live in milliseconds
}

/**
 * LRU Cache for translations
 */
export class TranslationCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly maxSize: number
  private readonly ttl: number

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    this.ttl = options.ttl || 30 * 24 * 60 * 60 * 1000 // 30 days
  }

  /**
   * Generate cache key from translation parameters
   */
  private generateKey(
    text: string,
    targetLang: string,
    provider: string
  ): string {
    // Normalize text: trim and lowercase
    const normalizedText = text.trim().toLowerCase()

    // Create hash-like key
    const key = `${provider}:${targetLang}:${normalizedText.substring(0, 100)}`

    // Unicode-safe Base64 encoding (btoa only supports Latin1)
    const bytes = new TextEncoder().encode(key)
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
    return btoa(binString)
  }

  /**
   * Get cached translation
   */
  get(
    text: string,
    targetLang: string,
    provider: string
  ): string | null {
    const key = this.generateKey(text, targetLang, provider)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access metadata
    entry.accessCount++
    entry.lastAccessed = Date.now()

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.translatedText
  }

  /**
   * Set cached translation
   */
  set(
    text: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    provider: string
  ): void {
    const key = this.generateKey(text, targetLang, provider)

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first in Map)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    const entry: CacheEntry = {
      key,
      translatedText,
      sourceLang,
      targetLang,
      provider,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    }

    this.cache.set(key, entry)
  }

  /**
   * Check if translation is cached
   */
  has(text: string, targetLang: string, provider: string): boolean {
    const key = this.generateKey(text, targetLang, provider)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.values()).map((entry) => ({
        sourceLang: entry.sourceLang,
        targetLang: entry.targetLang,
        provider: entry.provider,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
      })),
    }
  }

  /**
   * Batch get for multiple paragraphs
   * Returns Map<text, translatedText | null>
   */
  getBatch(
    paragraphs: Array<{ text: string }>,
    targetLang: string,
    provider: string
  ): Map<string, string | null> {
    const results = new Map<string, string | null>()

    for (const paragraph of paragraphs) {
      const translation = this.get(paragraph.text, targetLang, provider)
      results.set(paragraph.text, translation)
    }

    return results
  }

  /**
   * Batch set for multiple paragraphs
   */
  setBatch(
    translations: Array<{
      sourceText: string
      translatedText: string
      sourceLang: string
    }>,
    targetLang: string,
    provider: string
  ): void {
    for (const item of translations) {
      this.set(
        item.sourceText,
        item.translatedText,
        item.sourceLang,
        targetLang,
        provider
      )
    }
  }

  /**
   * Remove expired entries
   */
  pruneExpired(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Export cache for persistence
   */
  export(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  /**
   * Import cache from persistence
   */
  import(entries: CacheEntry[]): void {
    this.cache.clear()

    for (const entry of entries) {
      // Skip expired entries
      if (Date.now() - entry.timestamp > this.ttl) {
        continue
      }

      this.cache.set(entry.key, entry)
    }

    // Enforce size limit
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      } else {
        break
      }
    }
  }
}

// Singleton instance
let cacheInstance: TranslationCache | null = null

/**
 * Get or create cache instance
 */
export function getTranslationCache(): TranslationCache {
  if (!cacheInstance) {
    cacheInstance = new TranslationCache()
  }
  return cacheInstance
}

/**
 * Initialize cache with custom options
 */
export function initializeCache(options: CacheOptions): TranslationCache {
  cacheInstance = new TranslationCache(options)
  return cacheInstance
}
