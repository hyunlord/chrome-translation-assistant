// Content Script - Main
console.log('Translation Assistant: Content script loaded')

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection)

function handleTextSelection() {
  const selectedText = window.getSelection()?.toString().trim()

  if (selectedText && selectedText.length > 0) {
    console.log('Text selected:', selectedText)

    // TODO: Show tooltip or send to background
    // For now, just log it
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)

  switch (message.type) {
    case 'TRANSLATE_SELECTION':
      handleTranslationRequest(message.payload.text)
      break

    default:
      console.warn('Unknown message type:', message.type)
  }

  return false
})

function handleTranslationRequest(text: string) {
  console.log('Translation requested for:', text)

  // Send to background for processing
  chrome.runtime.sendMessage({
    type: 'TRANSLATE_TEXT',
    payload: { text }
  }, (response) => {
    console.log('Translation response:', response)

    // TODO: Display translation in UI
  })
}

export {}
