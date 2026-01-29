// Background Service Worker
console.log('Translation Assistant: Background service worker loaded')

// Install event
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)

  // Set default settings
  chrome.storage.local.set({
    settings: {
      defaultProvider: 'claude',
      autoTranslate: false,
      showTooltip: true,
    }
  })
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

    default:
      console.warn('Unknown message type:', message.type)
  }

  return false
})

// Translation handler (placeholder)
async function handleTranslation(payload: any, sendResponse: (response: any) => void) {
  console.log('Translation requested:', payload)

  // TODO: Implement actual translation logic
  // For now, return a mock translation
  setTimeout(() => {
    sendResponse({
      success: true,
      translation: `[Mock Translation] ${payload.text}`,
      provider: 'mock'
    })
  }, 1000)
}

// Open side panel
async function handleOpenSidePanel(windowId?: number) {
  if (windowId) {
    await chrome.sidePanel.open({ windowId })
  }
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate "%s"',
    contexts: ['selection']
  })
})

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection' && info.selectionText) {
    console.log('Context menu translation:', info.selectionText)

    // Send message to content script or open side panel
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TRANSLATE_SELECTION',
        payload: { text: info.selectionText }
      })
    }
  }
})

export {}
