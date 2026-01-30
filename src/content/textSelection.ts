// Text Selection Handler
import { showTooltip, hideTooltip } from './uiInjector'

/**
 * Text position information for navigation back to source
 */
export interface TextPosition {
  xpath: string
  textOffset: number
  textLength: number
  scrollY: number
  boundingRect?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface SelectionInfo {
  text: string
  boundingRect: DOMRect
  position: TextPosition
  context: {
    url: string
    title: string
    surroundingText: string
  }
}

/**
 * Generate XPath for an element
 */
function getXPath(element: Element): string {
  // If element has an ID, use it for a simple XPath
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousElementSibling

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.tagName.toLowerCase()
    parts.unshift(`${tagName}[${index}]`)
    current = current.parentElement
  }

  return '/' + parts.join('/')
}

/**
 * Get text position information from a Range
 */
function getTextPosition(range: Range): TextPosition {
  const container = range.commonAncestorContainer
  const element =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as Element)

  const rect = range.getBoundingClientRect()

  return {
    xpath: element ? getXPath(element) : '',
    textOffset: range.startOffset,
    textLength: range.toString().length,
    scrollY: window.scrollY,
    boundingRect: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    },
  }
}

let selectionTimeout: ReturnType<typeof setTimeout> | null = null
let mousedownHandler: ((e: MouseEvent) => void) | null = null
let isInitialized = false

export function initializeTextSelection() {
  // Prevent double initialization
  if (isInitialized) return
  isInitialized = true

  console.log('Translation Assistant: Text selection handler initialized')

  // Handle text selection
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('selectionchange', handleSelectionChange)

  // Hide tooltip when clicking elsewhere
  mousedownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.translation-tooltip')) {
      hideTooltip()
    }
  }
  document.addEventListener('mousedown', mousedownHandler)
}

/**
 * Cleanup function to remove all event listeners
 */
export function cleanupTextSelection() {
  if (!isInitialized) return

  // Clear pending timeout
  if (selectionTimeout) {
    clearTimeout(selectionTimeout)
    selectionTimeout = null
  }

  // Remove event listeners
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectionchange', handleSelectionChange)

  if (mousedownHandler) {
    document.removeEventListener('mousedown', mousedownHandler)
    mousedownHandler = null
  }

  // Hide any visible tooltip
  hideTooltip()

  isInitialized = false
  console.log('Translation Assistant: Text selection handler cleaned up')
}

function handleMouseUp(event: MouseEvent) {
  // Small delay to ensure selection is finalized
  if (selectionTimeout) {
    clearTimeout(selectionTimeout)
  }

  selectionTimeout = setTimeout(() => {
    processSelection(event)
  }, 100)
}

function handleSelectionChange() {
  const selection = window.getSelection()
  if (!selection || selection.toString().trim().length === 0) {
    hideTooltip()
  }
}

function processSelection(_event: MouseEvent) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return
  }

  const selectedText = selection.toString().trim()

  // Ignore if too short or too long
  if (selectedText.length < 2 || selectedText.length > 5000) {
    return
  }

  // Get selection bounding rectangle
  const range = selection.getRangeAt(0)
  const boundingRect = range.getBoundingClientRect()

  if (boundingRect.width === 0 && boundingRect.height === 0) {
    return
  }

  // Extract position and context
  const position = getTextPosition(range)
  const selectionInfo: SelectionInfo = {
    text: selectedText,
    boundingRect,
    position,
    context: {
      url: window.location.href,
      title: document.title,
      surroundingText: extractSurroundingText(range),
    },
  }

  // Show tooltip near selection
  showTooltip(selectionInfo, (action) => {
    handleTooltipAction(action, selectionInfo)
  })
}

function extractSurroundingText(range: Range): string {
  try {
    const container = range.commonAncestorContainer
    const parentElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement)

    if (!parentElement) {
      return ''
    }

    // Get text from parent element (limited to 500 chars)
    const fullText = parentElement.textContent || ''
    const selectionStart = fullText.indexOf(range.toString())

    if (selectionStart === -1) {
      return fullText.substring(0, 500)
    }

    // Get text before and after selection
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

function handleTooltipAction(action: 'translate' | 'explain', info: SelectionInfo) {
  console.log(`Action: ${action}`, info)

  // Open side panel IMMEDIATELY (must be in user gesture context)
  chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })

  // Send translation request (async, side panel already opening)
  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_TEXT',
      payload: {
        text: info.text,
        action,
        context: info.context,
        position: info.position,
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError)
        return
      }

      console.log('Translation response:', response)
    }
  )

  // Hide tooltip after action
  hideTooltip()
}

export type { SelectionInfo }
