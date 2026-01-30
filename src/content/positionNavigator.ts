// Position Navigator - Navigate to a specific position in a document
import type { TextPosition } from './textSelection'

/**
 * Find text node and offset that matches the given criteria
 */
function findTextNodeAtOffset(element: Element, targetOffset: number): { node: Text; offset: number } | null {
  let currentOffset = 0

  function traverse(node: Node): { node: Text; offset: number } | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text
      const length = textNode.textContent?.length || 0

      if (currentOffset + length > targetOffset) {
        return { node: textNode, offset: targetOffset - currentOffset }
      }
      currentOffset += length
    } else {
      for (const child of Array.from(node.childNodes)) {
        const result = traverse(child)
        if (result) return result
      }
    }
    return null
  }

  return traverse(element)
}

/**
 * Navigate to a specific position in the document
 * @returns true if navigation was successful
 */
export function navigateToPosition(position: TextPosition): boolean {
  if (!position.xpath) {
    // Fallback to scroll position only
    if (position.scrollY > 0) {
      window.scrollTo({ top: position.scrollY, behavior: 'smooth' })
      return true
    }
    return false
  }

  try {
    // Find element using XPath
    const result = document.evaluate(
      position.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )

    const element = result.singleNodeValue as Element | null

    if (!element) {
      console.warn('Could not find element at XPath:', position.xpath)
      // Fallback to scroll position
      if (position.scrollY > 0) {
        window.scrollTo({ top: position.scrollY, behavior: 'smooth' })
      }
      return false
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Try to highlight the text if we have offset information
    if (position.textLength > 0) {
      highlightText(element, position.textOffset, position.textLength)
    } else {
      // Just highlight the entire element briefly
      highlightElement(element)
    }

    return true
  } catch (error) {
    console.error('Error navigating to position:', error)

    // Fallback to scroll position
    if (position.scrollY > 0) {
      window.scrollTo({ top: position.scrollY, behavior: 'smooth' })
    }
    return false
  }
}

/**
 * Highlight text within an element
 */
function highlightText(element: Element, offset: number, length: number): void {
  try {
    const textNodeInfo = findTextNodeAtOffset(element, offset)
    if (!textNodeInfo) {
      highlightElement(element)
      return
    }

    const { node, offset: nodeOffset } = textNodeInfo

    // Create a range for the text
    const range = document.createRange()
    const endOffset = Math.min(nodeOffset + length, node.textContent?.length || 0)

    range.setStart(node, nodeOffset)
    range.setEnd(node, endOffset)

    // Create highlight element
    const highlight = document.createElement('mark')
    highlight.className = 'translation-assistant-highlight'
    highlight.style.cssText = `
      background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
      padding: 2px 0;
      border-radius: 2px;
      transition: opacity 0.5s ease-out;
    `

    // Wrap the range
    range.surroundContents(highlight)

    // Remove highlight after 3 seconds
    setTimeout(() => {
      highlight.style.opacity = '0'
      setTimeout(() => {
        // Unwrap the highlight
        const parent = highlight.parentNode
        while (highlight.firstChild) {
          parent?.insertBefore(highlight.firstChild, highlight)
        }
        highlight.remove()
      }, 500)
    }, 3000)
  } catch (error) {
    console.warn('Could not highlight text, falling back to element highlight:', error)
    highlightElement(element)
  }
}

/**
 * Highlight an entire element temporarily
 */
function highlightElement(element: Element): void {
  const htmlElement = element as HTMLElement

  // Save original styles
  const originalBackground = htmlElement.style.background
  const originalTransition = htmlElement.style.transition

  // Apply highlight
  htmlElement.style.transition = 'background 0.3s ease-in-out'
  htmlElement.style.background = 'linear-gradient(120deg, #fef08a 0%, #fde047 100%)'

  // Remove highlight after 3 seconds
  setTimeout(() => {
    htmlElement.style.background = originalBackground || ''
    setTimeout(() => {
      htmlElement.style.transition = originalTransition || ''
    }, 300)
  }, 3000)
}

/**
 * Check if we can navigate to a position (is the URL the same?)
 */
export function canNavigateToPosition(sourceUrl: string): boolean {
  return window.location.href === sourceUrl
}

/**
 * Navigate to a URL and then to a position
 */
export function navigateToUrlAndPosition(url: string, position: TextPosition): void {
  // Store position in session storage to use after navigation
  sessionStorage.setItem('translation-assistant-pending-position', JSON.stringify(position))

  // Navigate to the URL
  window.location.href = url
}

/**
 * Check for and execute pending navigation (called on page load)
 */
export function checkPendingNavigation(): void {
  const pendingPositionJson = sessionStorage.getItem('translation-assistant-pending-position')
  if (pendingPositionJson) {
    sessionStorage.removeItem('translation-assistant-pending-position')

    try {
      const position = JSON.parse(pendingPositionJson) as TextPosition

      // Wait for page to fully load
      if (document.readyState === 'complete') {
        setTimeout(() => navigateToPosition(position), 500)
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => navigateToPosition(position), 500)
        })
      }
    } catch (error) {
      console.error('Error parsing pending position:', error)
    }
  }
}
