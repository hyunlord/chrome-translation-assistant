// Source Session Data Models
// Groups all activities (translations, chats) from a single source webpage

/**
 * Text position information for navigation back to source
 */
export interface TextPosition {
  /** XPath to the container element */
  xpath: string
  /** Text offset within the element */
  textOffset: number
  /** Length of the selected text */
  textLength: number
  /** Scroll Y position when text was selected */
  scrollY: number
  /** Bounding rectangle for visual reference */
  boundingRect?: {
    top: number
    left: number
    width: number
    height: number
  }
}

/**
 * Translation entry with position tracking
 */
export interface Translation {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: string
  timestamp: number
  /** Position in the source page for navigation */
  position: TextPosition
  /** Context information */
  context?: {
    surroundingText?: string
  }
}

/**
 * Chat message within a chat session
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

/**
 * Chat session - can have multiple per source
 */
export interface ChatSession {
  id: string
  /** Optional title (auto-generated or user-defined) */
  title?: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  /** IDs of translations this chat relates to */
  relatedTranslationIds: string[]
}

/**
 * Source information about the webpage
 */
export interface SourceInfo {
  url: string
  title: string
  domain: string
  /** Favicon URL if available */
  favicon?: string
}

/**
 * Source Session - groups all activities from one source webpage
 */
export interface SourceSession {
  id: string
  /** Source webpage information */
  source: SourceInfo
  /** When the session was first created */
  createdAt: number
  /** When the session was last updated */
  updatedAt: number
  /** All translations from this source */
  translations: Translation[]
  /** All chat sessions from this source */
  chats: ChatSession[]
}

/**
 * Storage structure for source sessions
 */
export interface SessionStorage {
  /** List of source sessions (limited to recent N) */
  sourceSessions: SourceSession[]
  /** Quick lookup: domain -> session IDs */
  sessionsByDomain: Record<string, string[]>
  /** Quick lookup: URL -> session ID */
  sessionsByUrl: Record<string, string>
}

/**
 * Create an empty text position (for migration or when position is unknown)
 */
export function createEmptyPosition(): TextPosition {
  return {
    xpath: '',
    textOffset: 0,
    textLength: 0,
    scrollY: 0,
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Create a new source session
 */
export function createSourceSession(url: string, title: string): SourceSession {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    source: {
      url,
      title,
      domain: extractDomain(url),
    },
    createdAt: now,
    updatedAt: now,
    translations: [],
    chats: [],
  }
}

/**
 * Create a new chat session
 */
export function createChatSession(relatedTranslationIds: string[] = []): ChatSession {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    messages: [],
    createdAt: now,
    updatedAt: now,
    relatedTranslationIds,
  }
}

/**
 * Create a new translation entry
 */
export function createTranslation(
  sourceText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  provider: string,
  position: TextPosition,
  context?: { surroundingText?: string }
): Translation {
  return {
    id: crypto.randomUUID(),
    sourceText,
    translatedText,
    sourceLang,
    targetLang,
    provider,
    timestamp: Date.now(),
    position,
    context,
  }
}
