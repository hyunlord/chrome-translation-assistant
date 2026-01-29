// Content Script - Main
import { initializeTextSelection } from './textSelection'

console.log('Translation Assistant: Content script loaded')

// Initialize text selection handler
initializeTextSelection()

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)

  switch (message.type) {
    case 'TRANSLATION_COMPLETE':
      // Translation completed, side panel will handle display
      console.log('Translation complete:', message.payload)
      break

    default:
      console.warn('Unknown message type:', message.type)
  }

  return false
})

export {}
