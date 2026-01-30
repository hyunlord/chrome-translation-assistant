// Session Manager - CRUD operations for source sessions
import { localStorage } from './chromeStorage'
import {
  SourceSession,
  Translation,
  ChatSession,
  ChatMessage,
  TextPosition,
  SessionStorage,
  createSourceSession,
  createChatSession,
  createTranslation,
} from '../models/sourceSession'

const MAX_SESSIONS = 100 // Maximum sessions to keep
const STORAGE_KEY = 'sessionStorage'

/**
 * Session Manager for handling source-based history
 */
export class SessionManager {
  private cache: SessionStorage | null = null

  /**
   * Load session storage from chrome.storage.local
   */
  private async loadStorage(): Promise<SessionStorage> {
    if (this.cache) {
      return this.cache
    }

    const stored = await localStorage.get<SessionStorage>(STORAGE_KEY)
    this.cache = stored || {
      sourceSessions: [],
      sessionsByDomain: {},
      sessionsByUrl: {},
    }
    return this.cache
  }

  /**
   * Save session storage to chrome.storage.local
   */
  private async saveStorage(storage: SessionStorage): Promise<void> {
    this.cache = storage
    await localStorage.set(STORAGE_KEY, storage)
  }

  /**
   * Rebuild indexes from sessions list
   */
  private rebuildIndexes(sessions: SourceSession[]): {
    sessionsByDomain: Record<string, string[]>
    sessionsByUrl: Record<string, string>
  } {
    const sessionsByDomain: Record<string, string[]> = {}
    const sessionsByUrl: Record<string, string> = {}

    for (const session of sessions) {
      const domain = session.source.domain
      if (!sessionsByDomain[domain]) {
        sessionsByDomain[domain] = []
      }
      sessionsByDomain[domain].push(session.id)
      sessionsByUrl[session.source.url] = session.id
    }

    return { sessionsByDomain, sessionsByUrl }
  }

  /**
   * Get or create a session for a given URL
   */
  async getOrCreateSession(url: string, title: string): Promise<SourceSession> {
    const storage = await this.loadStorage()

    // Check if session exists for this URL
    const existingId = storage.sessionsByUrl[url]
    if (existingId) {
      const existing = storage.sourceSessions.find((s) => s.id === existingId)
      if (existing) {
        return existing
      }
    }

    // Create new session
    const newSession = createSourceSession(url, title)

    // Add to sessions
    storage.sourceSessions.unshift(newSession)

    // Trim to max sessions
    if (storage.sourceSessions.length > MAX_SESSIONS) {
      storage.sourceSessions = storage.sourceSessions.slice(0, MAX_SESSIONS)
    }

    // Rebuild indexes
    const indexes = this.rebuildIndexes(storage.sourceSessions)
    storage.sessionsByDomain = indexes.sessionsByDomain
    storage.sessionsByUrl = indexes.sessionsByUrl

    await this.saveStorage(storage)
    return newSession
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<SourceSession | null> {
    const storage = await this.loadStorage()
    return storage.sourceSessions.find((s) => s.id === sessionId) || null
  }

  /**
   * Get session by URL
   */
  async getSessionByUrl(url: string): Promise<SourceSession | null> {
    const storage = await this.loadStorage()
    const sessionId = storage.sessionsByUrl[url]
    if (!sessionId) return null
    return storage.sourceSessions.find((s) => s.id === sessionId) || null
  }

  /**
   * Add a translation to a session
   */
  async addTranslation(
    sessionId: string,
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    provider: string,
    position: TextPosition,
    context?: { surroundingText?: string }
  ): Promise<Translation | null> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return null

    const translation = createTranslation(
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      provider,
      position,
      context
    )

    session.translations.push(translation)
    session.updatedAt = Date.now()

    // Move session to front (most recently updated)
    const index = storage.sourceSessions.indexOf(session)
    if (index > 0) {
      storage.sourceSessions.splice(index, 1)
      storage.sourceSessions.unshift(session)
    }

    await this.saveStorage(storage)
    return translation
  }

  /**
   * Add a new chat session
   */
  async addChatSession(
    sessionId: string,
    relatedTranslationIds: string[] = []
  ): Promise<ChatSession | null> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return null

    const chatSession = createChatSession(relatedTranslationIds)
    session.chats.push(chatSession)
    session.updatedAt = Date.now()

    await this.saveStorage(storage)
    return chatSession
  }

  /**
   * Add a message to a chat session
   */
  async addChatMessage(
    sessionId: string,
    chatId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<ChatMessage | null> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return null

    const chat = session.chats.find((c) => c.id === chatId)
    if (!chat) return null

    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
    }

    chat.messages.push(message)
    chat.updatedAt = Date.now()
    session.updatedAt = Date.now()

    await this.saveStorage(storage)
    return message
  }

  /**
   * Update chat messages (replace all messages in a chat)
   */
  async updateChatMessages(
    sessionId: string,
    chatId: string,
    messages: ChatMessage[]
  ): Promise<boolean> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return false

    const chat = session.chats.find((c) => c.id === chatId)
    if (!chat) return false

    chat.messages = messages
    chat.updatedAt = Date.now()
    session.updatedAt = Date.now()

    await this.saveStorage(storage)
    return true
  }

  /**
   * Get all sessions sorted by updated time
   */
  async getSessions(options?: {
    limit?: number
    domain?: string
  }): Promise<SourceSession[]> {
    const storage = await this.loadStorage()
    let sessions = [...storage.sourceSessions]

    // Filter by domain if specified
    if (options?.domain) {
      const domainSessionIds = storage.sessionsByDomain[options.domain] || []
      sessions = sessions.filter((s) => domainSessionIds.includes(s.id))
    }

    // Sort by updated time (most recent first)
    sessions.sort((a, b) => b.updatedAt - a.updatedAt)

    // Apply limit
    if (options?.limit && options.limit > 0) {
      sessions = sessions.slice(0, options.limit)
    }

    return sessions
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const storage = await this.loadStorage()
    const index = storage.sourceSessions.findIndex((s) => s.id === sessionId)

    if (index === -1) return false

    storage.sourceSessions.splice(index, 1)

    // Rebuild indexes
    const indexes = this.rebuildIndexes(storage.sourceSessions)
    storage.sessionsByDomain = indexes.sessionsByDomain
    storage.sessionsByUrl = indexes.sessionsByUrl

    await this.saveStorage(storage)
    return true
  }

  /**
   * Delete a chat session from a source session
   */
  async deleteChatSession(sessionId: string, chatId: string): Promise<boolean> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return false

    const chatIndex = session.chats.findIndex((c) => c.id === chatId)
    if (chatIndex === -1) return false

    session.chats.splice(chatIndex, 1)
    session.updatedAt = Date.now()

    await this.saveStorage(storage)
    return true
  }

  /**
   * Delete a translation from a source session
   */
  async deleteTranslation(sessionId: string, translationId: string): Promise<boolean> {
    const storage = await this.loadStorage()
    const session = storage.sourceSessions.find((s) => s.id === sessionId)

    if (!session) return false

    const translationIndex = session.translations.findIndex((t) => t.id === translationId)
    if (translationIndex === -1) return false

    session.translations.splice(translationIndex, 1)
    session.updatedAt = Date.now()

    await this.saveStorage(storage)
    return true
  }

  /**
   * Clear the cache (useful for testing or forcing reload)
   */
  clearCache(): void {
    this.cache = null
  }

  /**
   * Migrate old translation history to new format
   */
  async migrateOldHistory(): Promise<number> {
    const oldHistory = await localStorage.get<any[]>('translationHistory')
    if (!oldHistory || oldHistory.length === 0) {
      return 0
    }

    const storage = await this.loadStorage()
    let migratedCount = 0

    // Group old translations by URL
    const byUrl = new Map<string, any[]>()
    for (const t of oldHistory) {
      const url = t.context?.url || 'unknown://unknown'
      if (!byUrl.has(url)) {
        byUrl.set(url, [])
      }
      byUrl.get(url)!.push(t)
    }

    // Create sessions for each URL
    for (const [url, translations] of byUrl) {
      const title = translations[0]?.context?.title || 'Unknown Page'
      const session = createSourceSession(url, title)

      for (const t of translations) {
        session.translations.push({
          id: t.id || crypto.randomUUID(),
          sourceText: t.sourceText,
          translatedText: t.translatedText,
          sourceLang: t.sourceLang,
          targetLang: t.targetLang,
          provider: t.provider,
          timestamp: t.timestamp,
          position: {
            xpath: '',
            textOffset: 0,
            textLength: t.sourceText?.length || 0,
            scrollY: 0,
          },
          context: {
            surroundingText: t.context?.surroundingText,
          },
        })
        migratedCount++
      }

      // Update timestamps
      if (session.translations.length > 0) {
        session.createdAt = Math.min(...session.translations.map((t) => t.timestamp))
        session.updatedAt = Math.max(...session.translations.map((t) => t.timestamp))
      }

      storage.sourceSessions.push(session)
    }

    // Sort by updated time
    storage.sourceSessions.sort((a, b) => b.updatedAt - a.updatedAt)

    // Trim and rebuild indexes
    if (storage.sourceSessions.length > MAX_SESSIONS) {
      storage.sourceSessions = storage.sourceSessions.slice(0, MAX_SESSIONS)
    }

    const indexes = this.rebuildIndexes(storage.sourceSessions)
    storage.sessionsByDomain = indexes.sessionsByDomain
    storage.sessionsByUrl = indexes.sessionsByUrl

    await this.saveStorage(storage)

    // Optionally clear old history (commented out for safety)
    // await localStorage.remove('translationHistory')

    console.log(`Migrated ${migratedCount} translations to ${storage.sourceSessions.length} sessions`)
    return migratedCount
  }
}

// Singleton instance
export const sessionManager = new SessionManager()
