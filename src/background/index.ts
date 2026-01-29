// Background Service Worker
import { AIProviderManager, type TranslationRequest } from '../lib/ai'
import { getTranslationCache } from '../lib/storage'
import { localStorage } from '../lib/storage/chromeStorage'

console.log('Translation Assistant: Background service worker loaded')

// AI Provider Manager instance
const providerManager = new AIProviderManager()
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

// Handle streaming chat connections
chrome.runtime.onConnect.addListener((port) => {
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
})

// Listen for messages from content scripts and UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender)

  // Handle different message types
  switch (message.type) {
    case 'TRANSLATE_TEXT':
      handleTranslation(message.payload, sendResponse)
      return true // Keep channel open for async response

    case 'OPEN_SIDE_PANEL':
      handleOpenSidePanel(sender.tab?.windowId)
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
async function handleTranslation(payload: any, sendResponse: (response: any) => void) {
  console.log('Translation requested:', payload)

  try {
    const { text, action, context } = payload

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

    // Send response
    sendResponse({
      success: true,
      ...result,
      cached: false,
    })

    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'TRANSLATION_COMPLETE',
      payload: result,
    })
  } catch (error) {
    console.error('Translation error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed',
    })
  }
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

// Update API key
async function handleUpdateApiKey(
  payload: { provider: string; apiKey: string },
  sendResponse: (response: any) => void
) {
  try {
    const { provider, apiKey } = payload

    // Get existing API keys
    const apiKeys = (await localStorage.get<Record<string, string>>('apiKeys')) || {}

    // Update API key
    apiKeys[provider] = apiKey

    await localStorage.set('apiKeys', apiKeys)

    // Re-register provider
    providerManager.registerProvider(provider as any, { apiKey })

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

// Open side panel
async function handleOpenSidePanel(windowId?: number) {
  if (windowId) {
    await chrome.sidePanel.open({ windowId })
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
          url: batch[0].context.url,
          title: batch[0].context.title,
        },
      })

      // Parse batch response
      const translations = result.translatedText.split('---').map((t: string) => t.trim())

      // Match translations to paragraphs
      batch.forEach((paragraph, index) => {
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
        saveTranslationToHistory({
          sourceText: paragraph.text,
          translatedText: cleanedTranslation,
          sourceLang: result.sourceLang,
          targetLang: result.targetLang,
          provider: result.provider,
          context: paragraph.context,
          timestamp: Date.now(),
        })
      })
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
    const settings = await localStorage.get<any>('settings')
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

    // Trigger translation
    handleTranslation(
      {
        text: info.selectionText,
        action: 'translate',
        context: {
          url: tab?.url,
          title: tab?.title,
        },
      },
      (response) => {
        console.log('Context menu translation response:', response)

        // Open side panel to show result
        if (tab?.windowId) {
          handleOpenSidePanel(tab.windowId)
        }
      }
    )
  }
})

export {}
