// Translation Overlay - UI injection and toggle functionality

/**
 * View mode for paragraph display
 */
export type ViewMode = 'original' | 'translated'

/**
 * Translation overlay state
 */
export interface OverlayState {
  paragraphId: string
  originalText: string
  translatedText: string
  viewMode: ViewMode
  container: HTMLElement | null
  toggleButton: HTMLButtonElement | null
}

/**
 * Registry to track all overlays
 */
const overlayRegistry = new Map<string, OverlayState>()

/**
 * CSS styles for translation overlays (injected once)
 */
const OVERLAY_STYLES = `
  .translation-overlay-container {
    position: relative;
    border-left: 3px solid #3b82f6;
    padding-left: 12px;
    margin: 8px 0;
    transition: all 0.3s ease;
  }

  .translation-overlay-container:hover {
    background: linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent);
  }

  .translation-overlay-text {
    color: #1f2937;
    background: linear-gradient(to right, #eff6ff, transparent);
    padding: 8px 12px;
    border-radius: 4px;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    transition: opacity 0.2s ease;
  }

  .translation-toggle-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 32px;
    height: 32px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .translation-overlay-container:hover .translation-toggle-btn {
    opacity: 1;
  }

  .translation-toggle-btn:hover {
    transform: scale(1.05);
    background: #2563eb;
  }

  .translation-toggle-btn:active {
    transform: scale(0.95);
  }

  .translation-overlay-original {
    opacity: 1;
  }

  .translation-overlay-translated {
    opacity: 0.95;
    font-style: italic;
  }

  .translation-loading {
    display: inline-block;
    color: #6b7280;
    font-style: italic;
    padding: 8px 12px;
  }

  .translation-error {
    display: inline-block;
    color: #dc2626;
    padding: 8px 12px;
    background: #fee2e2;
    border-radius: 4px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .translation-overlay-text {
      color: #e5e7eb;
      background: linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent);
    }

    .translation-error {
      background: rgba(220, 38, 38, 0.2);
    }
  }
`

/**
 * Inject overlay styles into page (call once on initialization)
 */
export function injectOverlayStyles(): void {
  // Check if styles already injected
  if (document.getElementById('translation-overlay-styles')) {
    return
  }

  const styleElement = document.createElement('style')
  styleElement.id = 'translation-overlay-styles'
  styleElement.textContent = OVERLAY_STYLES
  document.head.appendChild(styleElement)
}

/**
 * Create translation overlay for a paragraph
 */
export function createOverlay(
  paragraphId: string,
  element: HTMLElement,
  originalText: string,
  translatedText: string | null = null
): void {
  // Check if overlay already exists
  if (overlayRegistry.has(paragraphId)) {
    updateOverlay(paragraphId, translatedText)
    return
  }

  // Create container wrapper with ARIA attributes
  const container = document.createElement('div')
  container.className = 'translation-overlay-container'
  container.setAttribute('data-paragraph-id', paragraphId)
  container.setAttribute('data-translation-extension', 'true')
  container.setAttribute('role', 'region')
  container.setAttribute('aria-label', 'Translated paragraph')

  // Create text display element
  const textElement = document.createElement('div')
  textElement.className = 'translation-overlay-text translation-overlay-original'
  textElement.textContent = originalText

  // Create toggle button with enhanced accessibility
  const toggleButton = document.createElement('button')
  toggleButton.className = 'translation-toggle-btn'
  toggleButton.setAttribute('aria-label', 'Toggle translation view')
  toggleButton.setAttribute('aria-pressed', 'false')
  toggleButton.setAttribute('role', 'switch')
  toggleButton.setAttribute('title', 'Show Translation (Alt+T)')
  toggleButton.setAttribute('tabindex', '0')
  toggleButton.innerHTML = '🔄'

  // Add click handler
  toggleButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleView(paragraphId)
  })

  // Append elements
  container.appendChild(textElement)
  container.appendChild(toggleButton)

  // Wrap original element
  if (element.parentNode) {
    element.parentNode.insertBefore(container, element)
    container.appendChild(element)
  }

  // Store overlay state
  const state: OverlayState = {
    paragraphId,
    originalText,
    translatedText: translatedText || '',
    viewMode: 'original',
    container,
    toggleButton,
  }

  overlayRegistry.set(paragraphId, state)

  // If translation provided, show it
  if (translatedText) {
    updateOverlay(paragraphId, translatedText)
  } else {
    showLoadingState(paragraphId)
  }
}

/**
 * Update overlay with translation
 */
export function updateOverlay(paragraphId: string, translatedText: string | null): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state) return

  if (translatedText) {
    state.translatedText = translatedText
    hideLoadingState(paragraphId)

    // Update toggle button to indicate translation available
    if (state.toggleButton) {
      state.toggleButton.setAttribute('title', 'Toggle: Original ↔ Translation (Alt+T)')
    }
  }
}

/**
 * Toggle between original and translated view
 */
export function toggleView(paragraphId: string): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state || !state.container) return

  // Find text element
  const textElement = state.container.querySelector('.translation-overlay-text')
  if (!textElement) return

  // Toggle mode
  state.viewMode = state.viewMode === 'original' ? 'translated' : 'original'

  // Update display
  if (state.viewMode === 'translated' && state.translatedText) {
    textElement.textContent = state.translatedText
    textElement.className = 'translation-overlay-text translation-overlay-translated'
    textElement.setAttribute('lang', 'ko') // Set target language
    if (state.toggleButton) {
      state.toggleButton.innerHTML = '↩️'
      state.toggleButton.setAttribute('title', 'Show Original')
      state.toggleButton.setAttribute('aria-label', 'Show original text')
      state.toggleButton.setAttribute('aria-pressed', 'true')
    }
  } else {
    textElement.textContent = state.originalText
    textElement.className = 'translation-overlay-text translation-overlay-original'
    textElement.removeAttribute('lang') // Remove lang attribute for original
    if (state.toggleButton) {
      state.toggleButton.innerHTML = '🔄'
      state.toggleButton.setAttribute('title', 'Show Translation')
      state.toggleButton.setAttribute('aria-label', 'Show translation')
      state.toggleButton.setAttribute('aria-pressed', 'false')
    }
  }
}

/**
 * Toggle all overlays on the page
 */
export function toggleAllViews(): void {
  overlayRegistry.forEach((state) => {
    toggleView(state.paragraphId)
  })
}

/**
 * Show loading state for a paragraph
 */
export function showLoadingState(paragraphId: string): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state || !state.container) return

  const textElement = state.container.querySelector('.translation-overlay-text')
  if (!textElement) return

  const loadingElement = document.createElement('span')
  loadingElement.className = 'translation-loading'
  loadingElement.textContent = 'Translating...'

  textElement.appendChild(loadingElement)
}

/**
 * Hide loading state
 */
export function hideLoadingState(paragraphId: string): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state || !state.container) return

  const loadingElement = state.container.querySelector('.translation-loading')
  if (loadingElement) {
    loadingElement.remove()
  }
}

/**
 * Show error state for a paragraph
 */
export function showErrorState(paragraphId: string, errorMessage: string): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state || !state.container) return

  hideLoadingState(paragraphId)

  const textElement = state.container.querySelector('.translation-overlay-text')
  if (!textElement) return

  const errorElement = document.createElement('div')
  errorElement.className = 'translation-error'
  errorElement.textContent = `Translation failed: ${errorMessage}`

  textElement.appendChild(errorElement)
}

/**
 * Remove overlay for a paragraph
 */
export function removeOverlay(paragraphId: string): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state) return

  // Remove container from DOM
  if (state.container && state.container.parentNode) {
    // Move original element back
    const originalElement = state.container.querySelector('[data-paragraph-id]')
    if (originalElement && state.container.parentNode) {
      state.container.parentNode.insertBefore(originalElement, state.container)
    }
    state.container.remove()
  }

  // Remove from registry
  overlayRegistry.delete(paragraphId)
}

/**
 * Remove all overlays
 */
export function removeAllOverlays(): void {
  const paragraphIds = Array.from(overlayRegistry.keys())
  paragraphIds.forEach((id) => removeOverlay(id))
}

/**
 * Get overlay state
 */
export function getOverlayState(paragraphId: string): OverlayState | undefined {
  return overlayRegistry.get(paragraphId)
}

/**
 * Get all overlay states
 */
export function getAllOverlayStates(): Map<string, OverlayState> {
  return new Map(overlayRegistry)
}

/**
 * Check if overlay exists
 */
export function hasOverlay(paragraphId: string): boolean {
  return overlayRegistry.has(paragraphId)
}

/**
 * Get count of overlays
 */
export function getOverlayCount(): number {
  return overlayRegistry.size
}

/**
 * Update overlay style based on state
 */
export function updateOverlayStyle(paragraphId: string, style: Partial<CSSStyleDeclaration>): void {
  const state = overlayRegistry.get(paragraphId)
  if (!state || !state.container) return

  Object.assign(state.container.style, style)
}
