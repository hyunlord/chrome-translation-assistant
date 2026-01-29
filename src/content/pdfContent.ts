// Content Script - PDF Handler
console.log('Translation Assistant: PDF content script loaded')

// Check if this is a PDF page
function isPDFPage(): boolean {
  return window.location.href.includes('/pdf') ||
         document.querySelector('embed[type="application/pdf"]') !== null
}

if (isPDFPage()) {
  console.log('PDF detected')

  // Listen for text selection in PDF
  document.addEventListener('mouseup', handlePDFSelection)
}

function handlePDFSelection() {
  const selectedText = window.getSelection()?.toString().trim()

  if (selectedText && selectedText.length > 0) {
    console.log('PDF text selected:', selectedText)

    // TODO: Get PDF page number and send to background
    // For now, just log it
  }
}

export {}
