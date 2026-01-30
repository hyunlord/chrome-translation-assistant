// Content Script - PDF Handler
import { showTooltip, hideTooltip } from './uiInjector'

console.log('Translation Assistant: PDF content script loaded')

// Check if this is a PDF page
function isPDFPage(): boolean {
  return (
    window.location.href.endsWith('.pdf') ||
    window.location.href.includes('/pdf') ||
    document.querySelector('embed[type="application/pdf"]') !== null ||
    document.contentType === 'application/pdf'
  )
}

// Get current PDF page number
function getPDFPageNumber(): number | undefined {
  try {
    // Try to get from Chrome's PDF viewer
    const viewer = (window as any).PDFViewerApplication
    if (viewer && viewer.page) {
      return viewer.page
    }

    // Try to get from URL hash
    const match = window.location.hash.match(/page=(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }

    // Try to find visible page in viewport
    const pages = document.querySelectorAll('[data-page-number]')
    for (const page of Array.from(pages)) {
      const rect = page.getBoundingClientRect()
      if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
        const pageNum = page.getAttribute('data-page-number')
        if (pageNum) {
          return parseInt(pageNum, 10)
        }
      }
    }
  } catch (error) {
    console.error('Error getting PDF page number:', error)
  }

  return undefined
}

if (isPDFPage()) {
  console.log('PDF detected')

  const initPDFHandler = () => {
    document.addEventListener('mouseup', handlePDFSelection)
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.translation-tooltip')) {
        hideTooltip()
      }
    })
    console.log('PDF handler initialized')
  }

  if (document.readyState === 'complete') {
    initPDFHandler()
  } else {
    window.addEventListener('load', initPDFHandler)
  }
}

function handleSelectionChange() {
  const selection = window.getSelection()
  if (!selection || selection.toString().trim().length === 0) {
    hideTooltip()
  }
}

function handlePDFSelection(_event: MouseEvent) {
  setTimeout(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const selectedText = selection.toString().trim()
    if (selectedText.length < 2 || selectedText.length > 5000) return

    const range = selection.getRangeAt(0)
    const boundingRect = range.getBoundingClientRect()
    if (boundingRect.width === 0 && boundingRect.height === 0) return

    console.log('PDF text selected:', selectedText)
    const pageNumber = getPDFPageNumber()
    console.log('PDF page number:', pageNumber)

    // PDF position tracking (simplified - uses scroll position and page number)
    const rect = boundingRect
    const selectionInfo = {
      text: selectedText,
      boundingRect,
      position: {
        xpath: '', // PDF elements don't have stable XPaths
        textOffset: 0,
        textLength: selectedText.length,
        scrollY: window.scrollY,
        boundingRect: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        },
      },
      context: {
        url: window.location.href,
        title: document.title || 'PDF Document',
        isPDF: true,
        pdfPage: pageNumber,
        surroundingText: extractSurroundingText(range),
      },
    }

    showTooltip(selectionInfo, (action) => {
      handleTooltipAction(action, selectionInfo)
    })
  }, 100)
}

function extractSurroundingText(range: Range): string {
  try {
    const container = range.commonAncestorContainer
    const parentElement =
      container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement)

    if (!parentElement) return ''

    const fullText = parentElement.textContent || ''
    const selectionStart = fullText.indexOf(range.toString())
    if (selectionStart === -1) return fullText.substring(0, 500)

    const before = fullText.substring(Math.max(0, selectionStart - 200), selectionStart)
    const after = fullText.substring(
      selectionStart + range.toString().length,
      selectionStart + range.toString().length + 200
    )
    return `${before}[...]${after}`
  } catch (error) {
    console.error('Error extracting surrounding text:', error)
    return ''
  }
}

function handleTooltipAction(action: 'translate' | 'explain', info: any) {
  console.log(`PDF ${action} action:`, info)

  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_TEXT',
      payload: {
        text: info.text,
        action,
        context: info.context,
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError)
        return
      }
      console.log('Translation response:', response)
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
    }
  )

  hideTooltip()
}

export {}
