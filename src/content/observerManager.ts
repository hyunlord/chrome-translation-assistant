// Observer Manager - Handles visibility and dynamic content detection

import { debounce, throttle } from '../lib/utils/domUtils'

/**
 * Callback types for observers
 */
export type VisibilityCallback = (element: HTMLElement, isVisible: boolean) => void
export type ContentChangeCallback = (addedNodes: HTMLElement[]) => void
export type UrlChangeCallback = () => void

/**
 * Observer Manager - Manages IntersectionObserver and MutationObserver
 */
export class ParagraphObserverManager {
  private intersectionObserver: IntersectionObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private visibleParagraphs: Set<string> = new Set()
  private observedElements: Map<string, HTMLElement> = new Map()

  private onVisibilityChange: VisibilityCallback
  private onContentChange: ContentChangeCallback
  private onUrlChange: UrlChangeCallback

  private lastUrl: string = ''
  private isDestroyed: boolean = false

  constructor(
    onVisibilityChange: VisibilityCallback,
    onContentChange: ContentChangeCallback,
    onUrlChange: UrlChangeCallback
  ) {
    this.onVisibilityChange = onVisibilityChange
    this.onContentChange = onContentChange
    this.onUrlChange = onUrlChange

    this.setupIntersectionObserver()
    this.setupMutationObserver()
    this.setupUrlWatcher()
    this.setupScrollWatcher()
  }

  /**
   * Setup IntersectionObserver for visibility detection
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (this.isDestroyed) return

        entries.forEach((entry) => {
          const element = entry.target as HTMLElement
          const paragraphId = element.getAttribute('data-paragraph-id')
          if (!paragraphId) return

          const isVisible = entry.isIntersecting

          // Update visibility tracking
          if (isVisible) {
            this.visibleParagraphs.add(paragraphId)
          } else {
            this.visibleParagraphs.delete(paragraphId)
          }

          // Notify callback
          this.onVisibilityChange(element, isVisible)
        })
      },
      {
        root: null, // viewport
        rootMargin: '100px', // Pre-load 100px before entering viewport
        threshold: 0.1, // Trigger when 10% visible
      }
    )
  }

  /**
   * Setup MutationObserver for dynamic content
   */
  private setupMutationObserver(): void {
    const debouncedCallback = debounce((mutations: MutationRecord[]) => {
      if (this.isDestroyed) return

      const addedElements: HTMLElement[] = []

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            addedElements.push(element)
          }
        })
      })

      if (addedElements.length > 0) {
        this.onContentChange(addedElements)
      }
    }, 500) // Debounce 500ms to avoid excessive re-detection

    this.mutationObserver = new MutationObserver((mutations) => {
      debouncedCallback(mutations)
    })
  }

  /**
   * Setup URL change watcher for SPA navigation
   */
  private setupUrlWatcher(): void {
    this.lastUrl = location.href

    // Watch for URL changes via MutationObserver on document
    const urlWatcher = new MutationObserver(() => {
      if (this.isDestroyed) return

      const currentUrl = location.href
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl
        this.onUrlChange()
      }
    })

    urlWatcher.observe(document, { subtree: true, childList: true })

    // Also listen to popstate for browser back/forward
    window.addEventListener('popstate', () => {
      if (!this.isDestroyed) {
        this.onUrlChange()
      }
    })

    // Listen to pushState and replaceState (for SPAs)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      if (!this.isDestroyed) {
        this.lastUrl = location.href
        this.onUrlChange()
      }
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      if (!this.isDestroyed) {
        this.lastUrl = location.href
        this.onUrlChange()
      }
    }
  }

  /**
   * Setup scroll watcher for infinite scroll detection
   */
  private setupScrollWatcher(): void {
    const throttledScroll = throttle(() => {
      if (this.isDestroyed) return

      const scrollPosition = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // If scrolled to 80% of page, likely new content loaded
      if (scrollPosition > documentHeight * 0.8) {
        // Trigger content change detection
        // This will be picked up by MutationObserver if new content added
      }
    }, 300) // Throttle to every 300ms

    window.addEventListener('scroll', throttledScroll, { passive: true })
  }

  /**
   * Observe a paragraph element for visibility
   */
  observeParagraph(element: HTMLElement, paragraphId: string): void {
    if (this.isDestroyed || !this.intersectionObserver) return

    // Set paragraph ID attribute
    element.setAttribute('data-paragraph-id', paragraphId)

    // Track element
    this.observedElements.set(paragraphId, element)

    // Start observing
    this.intersectionObserver.observe(element)
  }

  /**
   * Unobserve a paragraph element
   */
  unobserveParagraph(paragraphId: string): void {
    if (this.isDestroyed || !this.intersectionObserver) return

    const element = this.observedElements.get(paragraphId)
    if (element) {
      this.intersectionObserver.unobserve(element)
      this.observedElements.delete(paragraphId)
      this.visibleParagraphs.delete(paragraphId)
    }
  }

  /**
   * Start observing content changes in a container
   */
  observeContentChanges(container: HTMLElement = document.body): void {
    if (this.isDestroyed || !this.mutationObserver) return

    this.mutationObserver.observe(container, {
      childList: true, // Watch for added/removed children
      subtree: true, // Watch entire subtree
      characterData: false, // Ignore text changes (performance)
      attributes: false, // Ignore attribute changes (performance)
    })
  }

  /**
   * Check if a paragraph is currently visible
   */
  isVisible(paragraphId: string): boolean {
    return this.visibleParagraphs.has(paragraphId)
  }

  /**
   * Get all visible paragraph IDs
   */
  getVisibleParagraphs(): string[] {
    return Array.from(this.visibleParagraphs)
  }

  /**
   * Get count of visible paragraphs
   */
  getVisibleCount(): number {
    return this.visibleParagraphs.size
  }

  /**
   * Get count of observed paragraphs
   */
  getObservedCount(): number {
    return this.observedElements.size
  }

  /**
   * Clear all observations
   */
  clearObservations(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
      this.setupIntersectionObserver()
    }

    this.observedElements.clear()
    this.visibleParagraphs.clear()
  }

  /**
   * Pause observations (for performance)
   */
  pause(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }
  }

  /**
   * Resume observations
   */
  resume(): void {
    // Re-observe all tracked elements
    if (this.intersectionObserver) {
      this.observedElements.forEach((element, _paragraphId) => {
        this.intersectionObserver?.observe(element)
      })
    }

    // Resume mutation observer
    if (this.mutationObserver) {
      this.observeContentChanges()
    }
  }

  /**
   * Destroy and cleanup all observers
   */
  destroy(): void {
    this.isDestroyed = true

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
      this.intersectionObserver = null
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }

    this.observedElements.clear()
    this.visibleParagraphs.clear()
  }

  /**
   * Get statistics about observations
   */
  getStats() {
    return {
      observed: this.observedElements.size,
      visible: this.visibleParagraphs.size,
      visibilityRate: this.observedElements.size > 0
        ? (this.visibleParagraphs.size / this.observedElements.size) * 100
        : 0,
    }
  }
}
