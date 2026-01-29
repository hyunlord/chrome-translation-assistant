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

// Open side panel
async function handleOpenSidePanel(windowId?: number) {
  if (windowId) {
    await chrome.sidePanel.open({ windowId })
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
