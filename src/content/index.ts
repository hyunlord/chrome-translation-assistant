// Content Script - Main
import { initializeTextSelection } from './textSelection'
import { AutoParagraphManager } from './autoParagraphManager'

console.log('Translation Assistant: Content script loaded')

// Auto paragraph manager instance
let autoParagraphManager: AutoParagraphManager | null = null

// Initialize based on settings
async function initialize() {
  try {
    // Always initialize text selection
    initializeTextSelection()

    // Load settings from storage
    const result = await chrome.storage.local.get('settings')
    const settings = result.settings || {}

    console.log('Content script settings:', settings)

    // Initialize auto paragraph detection if enabled
    if (settings.autoTranslate) {
      console.log('Auto-translate enabled, initializing manager...')
      autoParagraphManager = new AutoParagraphManager(settings)
      autoParagraphManager.initialize()
    }
  } catch (error) {
    console.error('Error initializing content script:', error)
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    const newSettings = changes.settings.newValue

    console.log('Settings changed:', newSettings)

    if (newSettings.autoTranslate && !autoParagraphManager) {
      // Enable auto paragraph detection
      console.log('Enabling auto-translate...')
      autoParagraphManager = new AutoParagraphManager(newSettings)
      autoParagraphManager.initialize()
    } else if (!newSettings.autoTranslate && autoParagraphManager) {
      // Disable and clean up
      console.log('Disabling auto-translate...')
      autoParagraphManager.destroy()
      autoParagraphManager = null
    } else if (autoParagraphManager) {
      // Settings changed but auto-translate still enabled
      // Restart with new settings
      console.log('Restarting auto-translate with new settings...')
      autoParagraphManager.destroy()
      autoParagraphManager = new AutoParagraphManager(newSettings)
      autoParagraphManager.initialize()
    }
  }
})

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  console.log('Content script received message:', message)

  switch (message.type) {
    case 'TRANSLATION_COMPLETE':
      // Translation completed, side panel will handle display
      console.log('Translation complete:', message.payload)
      break

    case 'TRIGGER_AUTO_TRANSLATE':
      // Manual trigger (if autoTranslateOnLoad is false)
      if (autoParagraphManager) {
        console.log('Manual auto-translate triggered')
        autoParagraphManager.detectAndTranslate()
      }
      break

    case 'TOGGLE_ALL_PARAGRAPHS':
      // Toggle all paragraph views
      if (autoParagraphManager) {
        console.log('Toggling all paragraph views')
        autoParagraphManager.toggleAll()
      }
      break

    default:
      console.warn('Unknown message type:', message.type)
  }

  return false
})

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+T to toggle all paragraphs
  if (e.altKey && e.key === 't') {
    e.preventDefault()
    if (autoParagraphManager) {
      console.log('Keyboard shortcut: Alt+T - Toggling all paragraphs')
      autoParagraphManager.toggleAll()
    }
  }
})

export {}
