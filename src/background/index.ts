// Background Service Worker
import { AIProviderManager, type TranslationRequest } from '../lib/ai'
import { getTranslationCache } from '../lib/storage'
import { localStorage } from '../lib/storage/chromeStorage'
import { usageTracker } from '../lib/storage/usageTracker'

console.log('Translation Assistant: Background service worker loaded')

// AI Provider Manager instance
const providerManager = new AIProviderManager()

// ============================================
// 탭별 상태 관리 (엄격한 격리)
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface TabState {
  windowId: number
  tabId: number
  currentTranslation: any | null
  currentChat: ChatMessage[]
  sourceUrl: string | null
  sourceTitle: string | null
}

// 탭별 상태 (인메모리 - 저장소 아님!)
const tabStates: Map<string, TabState> = new Map()

// Tab-specific port registry for side panel isolation
const tabPorts: Map<string, chrome.runtime.Port> = new Map()

// 탭 상태 키 생성 (windowId-tabId)
function getStateKey(windowId: number, tabId: number): string {
  return `${windowId}-${tabId}`
}

// 탭 상태 초기화 또는 가져오기
function getOrCreateTabState(windowId: number, tabId: number): TabState {
  const key = getStateKey(windowId, tabId)
  let state = tabStates.get(key)
  if (!state) {
    state = {
      windowId,
      tabId,
      currentTranslation: null,
      currentChat: [],
      sourceUrl: null,
      sourceTitle: null,
    }
    tabStates.set(key, state)
    console.log(`Created new tab state for window ${windowId}, tab ${tabId}`)
  }
  return state
}

// 탭 상태 정리 (탭 닫힐 때)
function cleanupTabState(windowId: number, tabId: number): void {
  const key = getStateKey(windowId, tabId)
  tabStates.delete(key)
  tabPorts.delete(key)
  console.log(`Cleaned up tab state for window ${windowId}, tab ${tabId}`)
}

// 윈도우의 모든 탭 상태 정리 (윈도우 닫힐 때)
function cleanupWindowTabs(windowId: number): void {
  const keysToDelete: string[] = []
  for (const key of tabStates.keys()) {
    if (key.startsWith(`${windowId}-`)) {
      keysToDelete.push(key)
    }
  }
  for (const key of keysToDelete) {
    tabStates.delete(key)
    tabPorts.delete(key)
  }
  console.log(`Cleaned up ${keysToDelete.length} tab states for window ${windowId}`)
}

// Send message to a specific tab's side panel
function sendToTab(windowId: number, tabId: number, message: any) {
  const key = getStateKey(windowId, tabId)
  const port = tabPorts.get(key)
  if (port) {
    try {
      port.postMessage(message)
    } catch (error) {
      console.error(`Failed to send message to tab ${tabId}:`, error)
      tabPorts.delete(key)
    }
  }
}
const translationCache = getTranslationCache()

// Install event
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason)

  // Set default settings
  await chrome.storage.local.set({
    settings: {
      defaultProvider: 'claude',
      defaultTargetLang: 'ko', // Korean
      autoTranslate: false,
      showTooltip: true,
    },
  })

  // Setup context menu
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate "%s"',
    contexts: ['selection'],
  })
})

// Initialize AI providers from settings
async function initializeProviders() {
  try {
    const apiKeys = await localStorage.get<Record<string, string>>('apiKeys')

    if (apiKeys) {
      // Initialize providers that have API keys
      if (apiKeys.claude) {
        providerManager.registerProvider('claude', { apiKey: apiKeys.claude })
      }
      if (apiKeys.openai) {
        providerManager.registerProvider('openai', { apiKey: apiKeys.openai })
      }
      if (apiKeys.gemini) {
        providerManager.registerProvider('gemini', { apiKey: apiKeys.gemini })
      }
      if (apiKeys.openrouter) {
        const settings = await localStorage.get<{ openrouterModel?: string }>('settings')
        providerManager.registerProvider('openrouter', {
          apiKey: apiKeys.openrouter,
          model: settings?.openrouterModel || 'google/gemini-2.5-flash',
        })
      }
    }

    // Set default provider
    const settings = await localStorage.get<{ defaultProvider: string }>('settings')
    if (settings?.defaultProvider) {
      try {
        providerManager.setDefaultProvider(settings.defaultProvider as any)
      } catch (error) {
        console.warn('Default provider not available:', settings.defaultProvider)
      }
    }
  } catch (error) {
    console.error('Error initializing providers:', error)
  }
}

// Initialize on startup
initializeProviders()

// 윈도우 닫힐 때 해당 윈도우의 모든 탭 상태 정리
chrome.windows.onRemoved.addListener((windowId) => {
  console.log(`Window ${windowId} closed, cleaning up all tab states`)
  cleanupWindowTabs(windowId)
})

// 탭 닫힐 때 상태 정리
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`Tab ${tabId} closed in window ${removeInfo.windowId}`)
  cleanupTabState(removeInfo.windowId, tabId)
})

// Handle messages from side panel through dedicated port
async function handleSidePanelMessage(
  message: any,
  windowId: number,
  tabId: number,
  port: chrome.runtime.Port
) {
  console.log(`Side panel message from window ${windowId}, tab ${tabId}:`, message.type)
  const state = getOrCreateTabState(windowId, tabId)

  switch (message.type) {
    case 'TRANSLATE_TEXT_STREAM':
      try {
        await handleTranslationStream({ ...message.payload, windowId }, port)
      } catch (error) {
        port.postMessage({
          type: 'TRANSLATION_STREAM_ERROR',
          error: error instanceof Error ? error.message : 'Translation failed',
        })
      }
      break

    case 'GET_TRANSLATION_HISTORY':
      // 글로벌 히스토리 (모든 윈도우 공유)
      try {
        const history = (await localStorage.get<any[]>('translationHistory')) || []
        port.postMessage({ type: 'TRANSLATION_HISTORY_RESPONSE', success: true, history })
      } catch (error) {
        port.postMessage({ type: 'TRANSLATION_HISTORY_RESPONSE', success: false, error: 'Failed to get history' })
      }
      break

    case 'GET_WINDOW_STATE':
      // 윈도우별 현재 상태 반환
      port.postMessage({
        type: 'WINDOW_STATE_RESPONSE',
        payload: {
          windowId,
          currentTranslation: state.currentTranslation,
          currentChat: state.currentChat,
          sourceUrl: state.sourceUrl,
          sourceTitle: state.sourceTitle,
        }
      })
      break

    case 'GET_CHAT_HISTORY':
      // 윈도우별 채팅 (인메모리)
      port.postMessage({
        type: 'CHAT_HISTORY_RESPONSE',
        success: true,
        history: state.currentChat,
        windowId,
      })
      break

    case 'SAVE_CHAT_MESSAGE':
      // 윈도우별 채팅 메시지 저장 (인메모리만)
      if (message.payload?.message) {
        state.currentChat.push(message.payload.message)
        // 최대 100개 유지
        if (state.currentChat.length > 100) {
          state.currentChat = state.currentChat.slice(-100)
        }
        console.log(`Chat message saved for window ${windowId}, total: ${state.currentChat.length}`)
      }
      break

    case 'CLEAR_CHAT':
      // 윈도우별 채팅 초기화
      state.currentChat = []
      port.postMessage({ type: 'CHAT_CLEARED', windowId })
      console.log(`Chat cleared for window ${windowId}`)
      break

    case 'SAVE_CHAT_HISTORY':
      // 레거시 지원 - 이제 인메모리로 저장
      if (message.payload?.messages) {
        state.currentChat = message.payload.messages.slice(-100)
      }
      port.postMessage({ type: 'SAVE_CHAT_HISTORY_RESPONSE', success: true })
      break

    case 'UPDATE_SOURCE_CONTEXT':
      // 현재 소스 페이지 정보 업데이트
      if (message.payload) {
        state.sourceUrl = message.payload.url || null
        state.sourceTitle = message.payload.title || null
      }
      break

    default:
      console.warn(`Unknown side panel message type: ${message.type}`)
  }
}

// Handle streaming chat connections and side panel registration
chrome.runtime.onConnect.addListener((port) => {
  // Side panel registration for tab isolation
  // Port name format: sidepanel-{windowId}-{tabId}
  const sidePanelMatch = port.name.match(/^sidepanel-(\d+)-(\d+)$/)
  if (sidePanelMatch) {
    const windowId = parseInt(sidePanelMatch[1], 10)
    const tabId = parseInt(sidePanelMatch[2], 10)
    if (isNaN(windowId) || isNaN(tabId)) {
      console.error('Invalid windowId or tabId in port name:', port.name)
      return
    }

    const key = getStateKey(windowId, tabId)
    console.log(`Side panel registered for window ${windowId}, tab ${tabId}`)
    tabPorts.set(key, port)
    const state = getOrCreateTabState(windowId, tabId)

    // 연결 시 초기 상태 전송
    port.postMessage({
      type: 'INIT_STATE',
      payload: {
        windowId,
        tabId,
        currentTranslation: state.currentTranslation,
        currentChat: state.currentChat,
        sourceUrl: state.sourceUrl,
        sourceTitle: state.sourceTitle,
      }
    })

    port.onDisconnect.addListener(() => {
      console.log(`Side panel disconnected for window ${windowId}, tab ${tabId}`)
      tabPorts.delete(key)
      // 상태는 유지 (사이드 패널 다시 열면 복원)
      // 탭 닫힐 때만 정리됨
    })

    port.onMessage.addListener(async (message) => {
      await handleSidePanelMessage(message, windowId, tabId, port)
    })
  }

  if (port.name === 'chat-stream') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'SEND_CHAT_MESSAGE_STREAM') {
        try {
          await handleChatMessageStream(message.payload, port)
        } catch (error) {
          port.postMessage({
            type: 'CHAT_STREAM_ERROR',
            error: error instanceof Error ? error.message : 'Chat failed',
          })
          port.disconnect()
        }
      }
    })
  }

  if (port.name === 'translation-stream') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'TRANSLATE_TEXT_STREAM') {
        try {
          await handleTranslationStream(message.payload, port)
        } catch (error) {
          port.postMessage({
            type: 'TRANSLATION_STREAM_ERROR',
            error: error instanceof Error ? error.message : 'Translation failed',
          })
          port.disconnect()
        }
      }
    })
  }
})

// Listen for messages from content scripts and UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender)

  // Handle different message types
  switch (message.type) {
    case 'TRANSLATE_TEXT':
      handleTranslation(message.payload, sendResponse, sender.tab?.windowId, sender.tab?.id)
      return true // Keep channel open for async response

    case 'OPEN_SIDE_PANEL':
      if (sender.tab?.windowId && sender.tab?.id) {
        handleOpenSidePanel(sender.tab.windowId, sender.tab.id)
      }
      break

    case 'UPDATE_API_KEY':
      handleUpdateApiKey(message.payload, sendResponse)
      return true

    case 'GET_TRANSLATION_HISTORY':
      handleGetHistory(sendResponse)
      return true

    case 'SEND_CHAT_MESSAGE':
      handleChatMessage(message.payload, sendResponse)
      return true

    case 'GET_CHAT_HISTORY':
      handleGetChatHistory(sendResponse)
      return true

    case 'SAVE_CHAT_HISTORY':
      handleSaveChatHistory(message.payload, sendResponse)
      return true

    case 'TRANSLATE_PARAGRAPHS_BATCH':
      handleBatchTranslation(message.payload, sendResponse)
      return true

    case 'TOGGLE_AUTO_TRANSLATE':
      handleToggleAutoTranslate(message.payload, sendResponse)
      return true

    default:
      console.warn('Unknown message type:', message.type)
  }

  return false
})

// Translation handler
async function handleTranslation(
  payload: any,
  sendResponse: (response: any) => void,
  windowId?: number,
  tabId?: number
) {
  console.log('Translation requested:', payload)

  try {
    const { text, context } = payload

    // Get settings
    const settings = await localStorage.get<any>('settings')
    const targetLang = settings?.defaultTargetLang || 'ko'
    const providerType = settings?.defaultProvider || 'claude'

    // Check cache first
    const cachedTranslation = translationCache.get(text, targetLang, providerType)
    if (cachedTranslation) {
      console.log('Translation found in cache')
      sendResponse({
        success: true,
        translatedText: cachedTranslation,
        cached: true,
        provider: providerType,
      })
      return
    }

    // Get provider
    const provider = providerManager.getProvider(providerType as any)

    // Prepare translation request
    const request: TranslationRequest = {
      text,
      targetLang,
      context,
    }

    // Translate
    const result = await provider.translate(request)

    // Cache result
    translationCache.set(
      text,
      result.translatedText,
      result.sourceLang,
      result.targetLang,
      result.provider
    )

    // Save to history
    await saveTranslationToHistory({
      sourceText: text,
      translatedText: result.translatedText,
      sourceLang: result.sourceLang,
      targetLang: result.targetLang,
      provider: result.provider,
      context,
      timestamp: Date.now(),
    })

    // Record usage statistics
    const tokensUsed = result.metadata?.tokensUsed || 0
    if (tokensUsed > 0) {
      const promptTokens = Math.floor(tokensUsed * 0.4)
      const completionTokens = tokensUsed - promptTokens
      await usageTracker.recordUsage(providerType as any, promptTokens, completionTokens)
    }

    // Send response
    sendResponse({
      success: true,
      ...result,
      cached: false,
    })

    // Notify side panel via dedicated port (tab-specific)
    if (windowId && tabId) {
      // 탭 상태에 현재 번역 저장
      const state = getOrCreateTabState(windowId, tabId)
      state.currentTranslation = {
        ...result,
        sourceText: text,
        timestamp: Date.now(),
      }

      sendToTab(windowId, tabId, {
        type: 'TRANSLATION_COMPLETE',
        payload: {
          ...result,
          sourceText: text,
          windowId,
          tabId,
        },
      })
    }
  } catch (error) {
    console.error('Translation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Translation failed'

    sendResponse({
      success: false,
      error: errorMessage,
    })

    // Notify side panel of error via dedicated port
    if (windowId && tabId) {
      sendToTab(windowId, tabId, {
        type: 'TRANSLATION_ERROR',
        payload: {
          error: errorMessage,
          errorCode: categorizeError(error),
          sourceText: payload.text,
          windowId,
          tabId,
        },
      })
    }
  }
}

// Categorize errors for user-friendly feedback
function categorizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : ''
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key') || msg.includes('authentication')) {
    return 'API_KEY_INVALID'
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'RATE_LIMIT'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('econnrefused')) {
    return 'NETWORK_ERROR'
  }
  if (msg.includes('503') || msg.includes('502') || msg.includes('service unavailable')) {
    return 'SERVICE_UNAVAILABLE'
  }
  return 'UNKNOWN'
}

// Save translation to history
async function saveTranslationToHistory(translation: any) {
  try {
    const history = (await localStorage.get<any[]>('translationHistory')) || []

    // Add new translation with ID
    const translationWithId = {
      id: crypto.randomUUID(),
      ...translation,
    }

    history.unshift(translationWithId) // Add to beginning

    // Keep only last 100 translations in local storage
    const trimmedHistory = history.slice(0, 100)

    await localStorage.set('translationHistory', trimmedHistory)

    console.log('Translation saved to history')
  } catch (error) {
    console.error('Error saving to history:', error)
  }
}

// Get translation history
async function handleGetHistory(sendResponse: (response: any) => void) {
  try {
    const history = (await localStorage.get<any[]>('translationHistory')) || []
    sendResponse({ success: true, history })
  } catch (error) {
    console.error('Error getting history:', error)
    sendResponse({ success: false, error: 'Failed to get history' })
  }
}

// Get chat history
async function handleGetChatHistory(sendResponse: (response: any) => void) {
  try {
    const history = (await localStorage.get<any[]>('chatHistory')) || []
    sendResponse({ success: true, history })
  } catch (error) {
    console.error('Error getting chat history:', error)
    sendResponse({ success: false, error: 'Failed to get chat history' })
  }
}

// Save chat history
async function handleSaveChatHistory(
  payload: { messages: any[] },
  sendResponse: (response: any) => void
) {
  try {
    // Keep only last 100 messages to avoid storage bloat
    const messages = payload.messages.slice(-100)
    await localStorage.set('chatHistory', messages)
    sendResponse({ success: true })
  } catch (error) {
    console.error('Error saving chat history:', error)
    sendResponse({ success: false, error: 'Failed to save chat history' })
  }
}

// Update API key
async function handleUpdateApiKey(
  payload: { provider: string; apiKey: string; model?: string },
  sendResponse: (response: any) => void
) {
  try {
    const { provider, apiKey, model } = payload

    // Get existing API keys
    const apiKeys = (await localStorage.get<Record<string, string>>('apiKeys')) || {}

    // Update API key
    apiKeys[provider] = apiKey

    await localStorage.set('apiKeys', apiKeys)

    // Re-register provider with model if provided
    providerManager.registerProvider(provider as any, { apiKey, model })

    // Update settings if model is provided (for OpenRouter)
    if (model) {
      const settings = (await localStorage.get<any>('settings')) || {}
      settings.defaultProvider = provider
      settings.openrouterModel = model
      await localStorage.set('settings', settings)
    }

    sendResponse({ success: true })
  } catch (error) {
    console.error('Error updating API key:', error)
    sendResponse({ success: false, error: 'Failed to update API key' })
  }
}

// Handle chat message
async function handleChatMessage(
  payload: { messages: any[]; stream?: boolean },
  sendResponse: (response: any) => void
) {
  console.log('Chat message requested:', payload)

  try {
    // Get settings
    const settings = await localStorage.get<any>('settings')
    const providerType = settings?.defaultProvider || 'claude'

    // Get provider
    const provider = providerManager.getProvider(providerType as any)

    // Send chat request
    const response = await provider.chat({
      messages: payload.messages,
      stream: false,
    })

    // Record usage statistics
    const tokensUsed = response.metadata?.tokensUsed || 0
    if (tokensUsed > 0) {
      const promptTokens = Math.floor(tokensUsed * 0.6)
      const completionTokens = tokensUsed - promptTokens
      await usageTracker.recordUsage(providerType as any, promptTokens, completionTokens)
    }

    sendResponse({
      success: true,
      message: response.message.content,
      metadata: response.metadata,
    })
  } catch (error) {
    console.error('Chat error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed',
    })
  }
}

// Handle streaming chat message
async function handleChatMessageStream(
  payload: { messages: any[] },
  port: chrome.runtime.Port
) {
  console.log('Streaming chat message requested:', payload)

  try {
    // Get settings
    const settings = await localStorage.get<any>('settings')
    const providerType = settings?.defaultProvider || 'claude'

    // Get provider
    const provider = providerManager.getProvider(providerType as any)

    // Stream chat response
    const stream = provider.chatStream({
      messages: payload.messages,
      stream: true,
    })

    for await (const chunk of stream) {
      port.postMessage({
        type: 'CHAT_STREAM_CHUNK',
        chunk,
      })
    }

    port.postMessage({
      type: 'CHAT_STREAM_DONE',
    })
  } catch (error) {
    console.error('Streaming chat error:', error)
    port.postMessage({
      type: 'CHAT_STREAM_ERROR',
      error: error instanceof Error ? error.message : 'Chat streaming failed',
    })
  }
}

// Handle streaming translation
async function handleTranslationStream(
  payload: { text: string; windowId?: number },
  port: chrome.runtime.Port
) {
  console.log('Streaming translation requested:', payload)

  try {
    const { text, windowId } = payload

    // Get settings
    const settings = await localStorage.get<any>('settings')
    const targetLang = settings?.defaultTargetLang || 'ko'
    const providerType = settings?.defaultProvider || 'claude'

    // Check cache first
    const cachedTranslation = translationCache.get(text, targetLang, providerType)
    if (cachedTranslation) {
      console.log('Translation found in cache')
      port.postMessage({
        type: 'TRANSLATION_STREAM_CHUNK',
        chunk: cachedTranslation,
      })
      port.postMessage({
        type: 'TRANSLATION_STREAM_DONE',
        windowId,
        fullText: cachedTranslation,
        sourceLang: 'auto',
        targetLang,
        provider: providerType,
        cached: true,
      })
      return
    }

    // Get provider
    const provider = providerManager.getProvider(providerType as any)

    // Stream translation
    const stream = provider.translateStream({
      text,
      targetLang,
    })

    let fullText = ''

    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text
        port.postMessage({
          type: 'TRANSLATION_STREAM_CHUNK',
          chunk: chunk.text,
        })
      }

      if (chunk.done) {
        // Cache result
        translationCache.set(text, fullText, 'auto', targetLang, providerType)

        // Save to history
        await saveTranslationToHistory({
          sourceText: text,
          translatedText: fullText,
          sourceLang: 'auto',
          targetLang,
          provider: providerType,
          timestamp: Date.now(),
        })

        port.postMessage({
          type: 'TRANSLATION_STREAM_DONE',
          windowId,
          fullText,
          sourceLang: 'auto',
          targetLang,
          provider: providerType,
          cached: false,
        })
      }
    }
  } catch (error) {
    console.error('Streaming translation error:', error)
    port.postMessage({
      type: 'TRANSLATION_STREAM_ERROR',
      error: error instanceof Error ? error.message : 'Translation streaming failed',
    })
  }
}

// Open side panel for a specific tab
async function handleOpenSidePanel(windowId: number, tabId: number) {
  try {
    // 1. 탭별 사이드 패널 경로 설정 (tabId를 query param으로 전달)
    await chrome.sidePanel.setOptions({
      tabId,
      path: `sidepanel.html?windowId=${windowId}&tabId=${tabId}`,
      enabled: true
    })

    // 2. 사이드 패널 열기 (setOptions로 이미 탭별 경로 설정됨)
    await chrome.sidePanel.open({ windowId })
    console.log(`Side panel opened for window ${windowId}, tab ${tabId}`)
  } catch (error) {
    console.error('Failed to open side panel:', error)
  }
}

// Handle batch translation for multiple paragraphs
async function handleBatchTranslation(payload: any, sendResponse: (response: any) => void) {
  console.log('Batch translation requested:', payload.paragraphs.length, 'paragraphs')

  try {
    const { paragraphs, targetLang } = payload

    // Get settings
    const settings = await localStorage.get<any>('settings')
    const providerType = settings?.defaultProvider || 'claude'

    // Check cache for each paragraph
    const cachedResults: any[] = []
    const uncachedParagraphs: any[] = []

    for (const paragraph of paragraphs) {
      const cachedTranslation = translationCache.get(paragraph.text, targetLang, providerType)
      if (cachedTranslation) {
        cachedResults.push({
          id: paragraph.id,
          translatedText: cachedTranslation,
          cached: true,
        })
      } else {
        uncachedParagraphs.push(paragraph)
      }
    }

    console.log(`Cache hits: ${cachedResults.length}, Cache misses: ${uncachedParagraphs.length}`)

    // If all cached, return immediately
    if (uncachedParagraphs.length === 0) {
      sendResponse({
        success: true,
        translations: cachedResults,
      })
      return
    }

    // Get provider
    const provider = providerManager.getProvider(providerType as any)

    // Batch translate uncached paragraphs (5-10 at a time)
    const batchSize = 10
    const newTranslations: any[] = []

    for (let i = 0; i < uncachedParagraphs.length; i += batchSize) {
      const batch = uncachedParagraphs.slice(i, i + batchSize)

      // Build batch prompt
      const batchText = batch
        .map((p, index) => `[${index + 1}] ${p.text}`)
        .join('\n\n---\n\n')

      const batchPrompt = `Translate the following ${batch.length} paragraphs from their source language to ${targetLang}.
Maintain the original formatting and tone. Return only the translations, separated by "---", in the same order.

${batchText}`

      // Translate batch
      const result = await provider.translate({
        text: batchPrompt,
        targetLang,
        context: {
          url: batch[0]?.context?.url || '',
          title: batch[0]?.context?.title || '',
        },
      })

      // Parse batch response
      const translations = result.translatedText.split('---').map((t: string) => t.trim())

      // Match translations to paragraphs
      for (let index = 0; index < batch.length; index++) {
        const paragraph = batch[index]
        const translatedText = translations[index] || batch[index].text // Fallback to original

        // Remove numbering if present (like "[1]")
        const cleanedTranslation = translatedText.replace(/^\[\d+\]\s*/, '')

        newTranslations.push({
          id: paragraph.id,
          translatedText: cleanedTranslation,
          cached: false,
        })

        // Cache result
        translationCache.set(
          paragraph.text,
          cleanedTranslation,
          result.sourceLang,
          result.targetLang,
          result.provider
        )

        // Save to history
        await saveTranslationToHistory({
          sourceText: paragraph.text,
          translatedText: cleanedTranslation,
          sourceLang: result.sourceLang,
          targetLang: result.targetLang,
          provider: result.provider,
          context: paragraph.context,
          timestamp: Date.now(),
        })
      }
    }

    // Combine cached and new translations
    const allTranslations = [...cachedResults, ...newTranslations]

    sendResponse({
      success: true,
      translations: allTranslations,
    })
  } catch (error) {
    console.error('Batch translation error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Batch translation failed',
    })
  }
}

// Handle toggle auto-translate setting
async function handleToggleAutoTranslate(
  payload: { enabled: boolean },
  sendResponse: (response: any) => void
) {
  try {
    const settings = (await localStorage.get<any>('settings')) || {}
    settings.autoTranslate = payload.enabled
    await localStorage.set('settings', settings)

    sendResponse({ success: true })
  } catch (error) {
    console.error('Error toggling auto-translate:', error)
    sendResponse({ success: false, error: 'Failed to toggle auto-translate' })
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection' && info.selectionText) {
    console.log('Context menu translation:', info.selectionText)

    const windowId = tab?.windowId
    const tabId = tab?.id
    if (!windowId || !tabId) return

    // Open side panel IMMEDIATELY (must be in user gesture context)
    handleOpenSidePanel(windowId, tabId)

    // Wait for side panel port connection, then send message directly
    const key = getStateKey(windowId, tabId)
    const checkAndSend = (attempts = 0) => {
      const port = tabPorts.get(key)
      if (port) {
        // Send directly to this tab's side panel via port
        port.postMessage({
          type: 'TRANSLATE_TEXT_STREAM_REQUEST',
          payload: {
            text: info.selectionText,
            windowId,
            tabId,
            context: {
              url: tab?.url,
              title: tab?.title,
            },
          },
        })
      } else if (attempts < 20) {
        // Retry up to 20 times (2 seconds total)
        setTimeout(() => checkAndSend(attempts + 1), 100)
      } else {
        console.warn(`Side panel port not available for window ${windowId}, tab ${tabId} after 2s`)
      }
    }

    // Start checking after a small delay for panel to initialize
    setTimeout(() => checkAndSend(), 100)
  }
})

export {}
