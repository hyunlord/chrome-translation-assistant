// DOM Utility Functions for Paragraph Detection

/**
 * Generate XPath for an element
 * Used for stable element identification across page reloads
 */
export function getXPath(element: HTMLElement): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  if (element === document.body) {
    return '/html/body'
  }

  const siblings = element.parentNode?.children
  if (!siblings) {
    return ''
  }

  let index = 0
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i]
    if (sibling === element) {
      const tagName = element.tagName.toLowerCase()
      const parentPath = element.parentElement ? getXPath(element.parentElement) : ''
      return `${parentPath}/${tagName}[${index + 1}]`
    }
    if (sibling.tagName === element.tagName) {
      index++
    }
  }

  return ''
}

/**
 * Get element by XPath
 */
export function getElementByXPath(xpath: string): HTMLElement | null {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  )
  return result.singleNodeValue as HTMLElement | null
}

/**
 * Check if element is visible
 * Considers display, visibility, opacity, and bounding rect
 */
export function isVisible(element: HTMLElement): boolean {
  // Check if element exists
  if (!element) return false

  // Check computed style
  const style = window.getComputedStyle(element)

  // Check display
  if (style.display === 'none') return false

  // Check visibility
  if (style.visibility === 'hidden') return false

  // Check opacity
  if (parseFloat(style.opacity) === 0) return false

  // Check if element has any size
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false

  // Check if element is positioned off-screen
  if (rect.top < -rect.height || rect.left < -rect.width) return false

  return true
}

/**
 * Get computed font size in pixels
 */
export function getComputedFontSize(element: HTMLElement): number {
  const style = window.getComputedStyle(element)
  const fontSize = style.fontSize

  if (fontSize.endsWith('px')) {
    return parseFloat(fontSize)
  }

  // Fallback for other units - create temporary element
  const tempDiv = document.createElement('div')
  tempDiv.style.fontSize = fontSize
  tempDiv.style.position = 'absolute'
  tempDiv.style.visibility = 'hidden'
  document.body.appendChild(tempDiv)
  const computedSize = parseFloat(window.getComputedStyle(tempDiv).fontSize)
  document.body.removeChild(tempDiv)

  return computedSize
}

/**
 * Calculate text density (text chars vs total chars including whitespace)
 * Higher density = more meaningful content
 */
export function getTextDensity(element: HTMLElement): number {
  const text = element.textContent || ''
  if (text.length === 0) return 0

  const textChars = text.replace(/\s/g, '').length
  const totalChars = text.length

  return textChars / totalChars
}

/**
 * Extract clean text content from element
 * Removes excessive whitespace and normalizes
 */
export function extractCleanText(element: HTMLElement): string {
  const text = element.textContent || ''

  // Normalize whitespace
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim()
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement, margin: number = 0): boolean {
  const rect = element.getBoundingClientRect()

  return (
    rect.top >= -margin &&
    rect.left >= -margin &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + margin &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + margin
  )
}

/**
 * Get element's position relative to document
 */
export function getElementPosition(element: HTMLElement): { top: number; left: number } {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  }
}

/**
 * Check if element has block-level children
 */
export function hasBlockChildren(element: HTMLElement): boolean {
  const blockElements = [
    'div',
    'p',
    'article',
    'section',
    'header',
    'footer',
    'nav',
    'aside',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'table',
  ]

  for (const child of element.children) {
    if (blockElements.includes(child.tagName.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Calculate punctuation ratio
 * High ratio might indicate non-translatable content (code, data, etc.)
 */
export function getPunctuationRatio(text: string): number {
  if (text.length === 0) return 0

  const punctuationChars = text.match(/[^\w\s]/g) || []
  return punctuationChars.length / text.length
}

/**
 * Calculate number ratio
 * High ratio might indicate non-translatable content (tables, data, etc.)
 */
export function getNumberRatio(text: string): number {
  if (text.length === 0) return 0

  const numberChars = text.match(/\d/g) || []
  return numberChars.length / text.length
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Hash string to generate unique ID
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Sanitize HTML to prevent XSS
 * Removes script tags and dangerous attributes
 */
export function sanitizeHTML(html: string): string {
  const temp = document.createElement('div')
  temp.textContent = html
  return temp.innerHTML
}
