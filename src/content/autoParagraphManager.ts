// Auto Paragraph Manager - Main orchestrator for auto paragraph translation

import {
  detectParagraphs,
  detectParagraphsInSubtree,
  generateParagraphId,
  type ParagraphCandidate,
  type DetectionSettings,
} from './paragraphDetector'
import {
  createOverlay,
  updateOverlay,
  removeOverlay,
  removeAllOverlays,
  toggleAllViews,
  showErrorState,
  injectOverlayStyles,
  type ViewMode,
} from './paragraphOverlay'
import { ParagraphObserverManager } from './observerManager'

/**
 * Paragraph state in registry
 */
interface ParagraphState {
  id: string
  element: HTMLElement
  text: string
  translatedText: string | null
  status: 'pending' | 'translating' | 'translated' | 'error'
  viewMode: ViewMode
  metadata: {
    xpath: string
    wordCount: number
    charCount: number
  }
}

/**
 * Translation queue with priority
 */
interface TranslationQueue {
  high: ParagraphCandidate[] // Visible in viewport
  medium: ParagraphCandidate[] // Just below fold
  low: ParagraphCandidate[] // Rest of page
}

/**
 * Settings for auto paragraph manager
 */
interface AutoParagraphSettings extends DetectionSettings {
  autoTranslateOnLoad: boolean
  maxConcurrentRequests: number
}

/**
 * Auto Paragraph Manager - Coordinates detection, translation, and display
 */
export class AutoParagraphManager {
  private paragraphRegistry: Map<string, ParagraphState> = new Map()
  private observerManager: ParagraphObserverManager | null = null
  private translationQueue: TranslationQueue = { high: [], medium: [], low: [] }
  private settings: AutoParagraphSettings
  private isProcessingQueue: boolean = false
  private concurrentRequests: number = 0
  private isInitialized: boolean = false

  constructor(settings: Partial<AutoParagraphSettings>) {
    this.settings = {
      minParagraphLength: settings.minParagraphLength || 100,
      maxParagraphLength: settings.maxParagraphLength || 2000,
      detectionMode: settings.detectionMode || 'balanced',
      excludeCodeBlocks: settings.excludeCodeBlocks !== false,
      targetLang: settings.targetLang || 'ko',
      autoTranslateOnLoad: settings.autoTranslateOnLoad !== false,
      maxConcurrentRequests: settings.maxConcurrentRequests || 3,
    }
  }

  /**
   * Initialize the manager
   */
  initialize(): void {
    if (this.isInitialized) return

    console.log('Auto Paragraph Manager: Initializing...')

    // Inject overlay styles
    injectOverlayStyles()

    // Setup observers
    this.observerManager = new ParagraphObserverManager(
      this.handleVisibilityChange.bind(this),
      this.handleContentChange.bind(this),
      this.handleUrlChange.bind(this)
    )

    // Start observing content changes
    this.observerManager.observeContentChanges()

    // Initial detection if auto-translate enabled
    if (this.settings.autoTranslateOnLoad) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.detectAndTranslate()
        })
      } else {
        this.detectAndTranslate()
      }
    }

    this.isInitialized = true
    console.log('Auto Paragraph Manager: Initialized')
  }

  /**
   * Detect paragraphs and queue for translation
   */
  detectAndTranslate(): void {
    console.log('Auto Paragraph Manager: Detecting paragraphs...')

    // Detect paragraphs
    const candidates = detectParagraphs(this.settings)

    console.log(`Auto Paragraph Manager: Found ${candidates.length} candidates`)

    // Register and queue paragraphs
    candidates.forEach((candidate) => {
      const id = generateParagraphId(candidate)

      // Skip if already registered
      if (this.paragraphRegistry.has(id)) return

      // Register paragraph
      this.registerParagraph(id, candidate)

      // Create overlay (without translation yet)
      createOverlay(id, candidate.element, candidate.text, null)

      // Observe for visibility
      this.observerManager?.observeParagraph(candidate.element, id)

      // Queue for translation based on visibility
      this.queueParagraph(candidate)
    })

    // Process queue
    this.processQueue()
  }

  /**
   * Register a paragraph in the registry
   */
  private registerParagraph(id: string, candidate: ParagraphCandidate): void {
    const state: ParagraphState = {
      id,
      element: candidate.element,
      text: candidate.text,
      translatedText: null,
      status: 'pending',
      viewMode: 'original',
      metadata: {
        xpath: candidate.metadata.xpath,
        wordCount: candidate.metadata.wordCount,
        charCount: candidate.metadata.charCount,
      },
    }

    this.paragraphRegistry.set(id, state)
  }

  /**
   * Queue a paragraph for translation based on priority
   */
  private queueParagraph(candidate: ParagraphCandidate): void {
    const rect = candidate.metadata.boundingRect
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY

    // Determine priority based on position
    if (rect.top >= scrollY && rect.top <= scrollY + viewportHeight) {
      // Visible in viewport - high priority
      this.translationQueue.high.push(candidate)
    } else if (rect.top > scrollY + viewportHeight && rect.top <= scrollY + viewportHeight * 2) {
      // Just below fold - medium priority
      this.translationQueue.medium.push(candidate)
    } else {
      // Rest of page - low priority
      this.translationQueue.low.push(candidate)
    }
  }

  /**
   * Process translation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    try {
      // Process high priority first (one at a time for responsiveness)
      while (this.translationQueue.high.length > 0 && this.concurrentRequests < this.settings.maxConcurrentRequests) {
        const candidate = this.translationQueue.high.shift()
        if (candidate) {
          this.translateParagraph(candidate)
        }
      }

      // Process medium priority (batch 5-10 at a time)
      if (this.translationQueue.medium.length > 0 && this.concurrentRequests < this.settings.maxConcurrentRequests) {
        const batch = this.translationQueue.medium.splice(0, 10)
        this.translateParagraphsBatch(batch)
      }

      // Low priority paragraphs are processed when they become visible (via IntersectionObserver)
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * Translate a single paragraph
   */
  private async translateParagraph(candidate: ParagraphCandidate): Promise<void> {
    const id = generateParagraphId(candidate)
    const state = this.paragraphRegistry.get(id)
    if (!state) return

    // Update status
    state.status = 'translating'
    this.concurrentRequests++

    try {
      // Send translation request to background
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        payload: {
          text: candidate.text,
          targetLang: this.settings.targetLang,
          context: {
            url: location.href,
            title: document.title,
            surroundingText: '', // Could add context if needed
            isPDF: false,
          },
        },
      })

      if (response && response.translatedText) {
        // Update state
        state.translatedText = response.translatedText
        state.status = 'translated'

        // Update overlay
        updateOverlay(id, response.translatedText)
      } else {
        throw new Error('No translation received')
      }
    } catch (error) {
      console.error('Translation error:', error)
      state.status = 'error'
      showErrorState(id, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      this.concurrentRequests--
      this.processQueue() // Continue processing queue
    }
  }

  /**
   * Translate multiple paragraphs in a batch
   */
  private async translateParagraphsBatch(candidates: ParagraphCandidate[]): Promise<void> {
    if (candidates.length === 0) return

    this.concurrentRequests++

    try {
      // Prepare batch request
      const paragraphs = candidates.map((c) => ({
        id: generateParagraphId(c),
        text: c.text,
        context: {
          url: location.href,
          title: document.title,
          xpath: c.metadata.xpath,
        },
      }))

      // Update status for all
      paragraphs.forEach((p) => {
        const state = this.paragraphRegistry.get(p.id)
        if (state) {
          state.status = 'translating'
        }
      })

      // Send batch translation request
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_PARAGRAPHS_BATCH',
        payload: {
          paragraphs,
          targetLang: this.settings.targetLang,
        },
      })

      if (response && response.translations) {
        // Update each paragraph
        response.translations.forEach((translation: { id: string; translatedText: string }) => {
          const state = this.paragraphRegistry.get(translation.id)
          if (state) {
            state.translatedText = translation.translatedText
            state.status = 'translated'
            updateOverlay(translation.id, translation.translatedText)
          }
        })
      }
    } catch (error) {
      console.error('Batch translation error:', error)
      // Mark all as error
      candidates.forEach((c) => {
        const id = generateParagraphId(c)
        const state = this.paragraphRegistry.get(id)
        if (state) {
          state.status = 'error'
          showErrorState(id, error instanceof Error ? error.message : 'Unknown error')
        }
      })
    } finally {
      this.concurrentRequests--
      this.processQueue()
    }
  }

  /**
   * Handle visibility change (from IntersectionObserver)
   */
  private handleVisibilityChange(element: HTMLElement, isVisible: boolean): void {
    const paragraphId = element.getAttribute('data-paragraph-id')
    if (!paragraphId) return

    const state = this.paragraphRegistry.get(paragraphId)
    if (!state) return

    // If paragraph becomes visible and not yet translated, translate it
    if (isVisible && state.status === 'pending') {
      // Move from low priority queue to high priority
      const lowIndex = this.translationQueue.low.findIndex(
        (c) => generateParagraphId(c) === paragraphId
      )
      if (lowIndex !== -1) {
        const [candidate] = this.translationQueue.low.splice(lowIndex, 1)
        this.translationQueue.high.push(candidate)
        this.processQueue()
      }
    }
  }

  /**
   * Handle content change (from MutationObserver)
   */
  private handleContentChange(addedElements: HTMLElement[]): void {
    console.log(`Auto Paragraph Manager: Detected ${addedElements.length} new elements`)

    // Detect paragraphs in new elements
    addedElements.forEach((element) => {
      const newCandidates = detectParagraphsInSubtree(element, this.settings)

      newCandidates.forEach((candidate) => {
        const id = generateParagraphId(candidate)

        // Skip if already registered
        if (this.paragraphRegistry.has(id)) return

        // Register and process
        this.registerParagraph(id, candidate)
        createOverlay(id, candidate.element, candidate.text, null)
        this.observerManager?.observeParagraph(candidate.element, id)
        this.queueParagraph(candidate)
      })
    })

    // Process new paragraphs
    if (addedElements.length > 0) {
      this.processQueue()
    }
  }

  /**
   * Handle URL change (SPA navigation)
   */
  private handleUrlChange(): void {
    console.log('Auto Paragraph Manager: URL changed, resetting...')
    this.reset()
    setTimeout(() => {
      this.detectAndTranslate()
    }, 500) // Wait for new content to load
  }

  /**
   * Toggle all paragraph views
   */
  toggleAll(): void {
    toggleAllViews()
  }

  /**
   * Reset manager (clear all paragraphs and overlays)
   */
  reset(): void {
    console.log('Auto Paragraph Manager: Resetting...')

    // Remove all overlays
    removeAllOverlays()

    // Clear registry
    this.paragraphRegistry.clear()

    // Clear queue
    this.translationQueue = { high: [], medium: [], low: [] }

    // Clear observers
    this.observerManager?.clearObservations()
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    console.log('Auto Paragraph Manager: Destroying...')

    this.reset()

    // Destroy observers
    this.observerManager?.destroy()
    this.observerManager = null

    this.isInitialized = false
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      paragraphs: {
        total: this.paragraphRegistry.size,
        pending: Array.from(this.paragraphRegistry.values()).filter((s) => s.status === 'pending').length,
        translating: Array.from(this.paragraphRegistry.values()).filter((s) => s.status === 'translating').length,
        translated: Array.from(this.paragraphRegistry.values()).filter((s) => s.status === 'translated').length,
        error: Array.from(this.paragraphRegistry.values()).filter((s) => s.status === 'error').length,
      },
      queue: {
        high: this.translationQueue.high.length,
        medium: this.translationQueue.medium.length,
        low: this.translationQueue.low.length,
      },
      concurrentRequests: this.concurrentRequests,
      observer: this.observerManager?.getStats(),
    }
  }
}
