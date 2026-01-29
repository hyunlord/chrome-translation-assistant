// Paragraph Detector - Core detection algorithm with scoring

import {
  getXPath,
  extractCleanText,
  countWords,
  isInViewport,
  hasBlockChildren,
  getPunctuationRatio,
  getNumberRatio,
  getComputedFontSize,
  hashString,
} from '../lib/utils/domUtils'
import { isExcludedElement, isCodeBlock, shouldTranslate } from './contentFilter'

/**
 * Settings for paragraph detection
 */
export interface DetectionSettings {
  minParagraphLength: number
  maxParagraphLength: number
  detectionMode: 'aggressive' | 'balanced' | 'conservative'
  excludeCodeBlocks: boolean
  targetLang: string
}

/**
 * Paragraph candidate with metadata
 */
export interface ParagraphCandidate {
  element: HTMLElement
  text: string
  score: number
  metadata: {
    wordCount: number
    charCount: number
    isSemanticElement: boolean
    xpath: string
    boundingRect: DOMRect
  }
}

/**
 * Semantic HTML elements that typically contain paragraphs
 */
const SEMANTIC_PARAGRAPH_TAGS = ['p', 'article', 'section', 'blockquote', 'li', 'dd', 'td', 'th']

/**
 * Block-level elements that might contain text
 */
const BLOCK_ELEMENTS = [
  'div',
  'p',
  'article',
  'section',
  'blockquote',
  'li',
  'dd',
  'td',
  'th',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'figcaption',
]

/**
 * Detect paragraphs on the page
 */
export function detectParagraphs(
  settings: DetectionSettings,
  root: HTMLElement = document.body
): ParagraphCandidate[] {
  const candidates: ParagraphCandidate[] = []

  // Priority 1: Semantic elements
  const semanticElements = root.querySelectorAll(SEMANTIC_PARAGRAPH_TAGS.join(', '))
  semanticElements.forEach((element) => {
    const candidate = createCandidate(element as HTMLElement, settings, true)
    if (candidate) {
      candidates.push(candidate)
    }
  })

  // Priority 2: Block elements with text (only if not already processed)
  const blockElements = root.querySelectorAll(BLOCK_ELEMENTS.join(', '))
  blockElements.forEach((element) => {
    const htmlElement = element as HTMLElement

    // Skip if already processed as semantic element
    if (candidates.some((c) => c.element === htmlElement)) {
      return
    }

    // Skip if has block children (not a leaf node)
    if (hasBlockChildren(htmlElement)) {
      return
    }

    const candidate = createCandidate(htmlElement, settings, false)
    if (candidate) {
      candidates.push(candidate)
    }
  })

  // Filter and sort by score
  return filterAndSortCandidates(candidates, settings)
}

/**
 * Create a paragraph candidate from an element
 */
function createCandidate(
  element: HTMLElement,
  settings: DetectionSettings,
  isSemantic: boolean
): ParagraphCandidate | null {
  // Extract text
  const text = extractCleanText(element)

  // Check length constraints
  if (text.length < settings.minParagraphLength || text.length > settings.maxParagraphLength) {
    return null
  }

  // Check if should translate
  if (!shouldTranslate(element, text, settings.targetLang, settings.excludeCodeBlocks)) {
    return null
  }

  // Calculate score
  const score = scoreParagraph(element, text, isSemantic, settings)

  // Create candidate
  const candidate: ParagraphCandidate = {
    element,
    text,
    score,
    metadata: {
      wordCount: countWords(text),
      charCount: text.length,
      isSemanticElement: isSemantic,
      xpath: getXPath(element),
      boundingRect: element.getBoundingClientRect(),
    },
  }

  return candidate
}

/**
 * Score a paragraph candidate (0-100)
 */
function scoreParagraph(
  element: HTMLElement,
  text: string,
  isSemantic: boolean,
  settings: DetectionSettings
): number {
  let score = 0

  // 1. Semantic HTML tags (+30)
  if (isSemantic) {
    score += 30
  }

  // 2. Text length (100-2000 chars optimal) (+20)
  if (text.length >= 100 && text.length <= 2000) {
    score += 20
  } else if (text.length >= 50 && text.length < 100) {
    score += 10
  } else if (text.length > 2000 && text.length <= 5000) {
    score += 5
  }

  // 3. Low punctuation ratio (+15)
  const punctuationRatio = getPunctuationRatio(text)
  if (punctuationRatio < 0.1) {
    score += 15
  } else if (punctuationRatio < 0.2) {
    score += 7
  }

  // 4. Readable font size >12px (+10)
  const fontSize = getComputedFontSize(element)
  if (fontSize >= 12) {
    score += 10
  }

  // 5. Visible in viewport (+10)
  if (isInViewport(element, 100)) {
    score += 10
  }

  // 6. Not inside excluded elements (+15)
  if (!isExcludedElement(element)) {
    score += 15
  }

  // 7. Low number ratio (+10)
  const numberRatio = getNumberRatio(text)
  if (numberRatio < 0.1) {
    score += 10
  } else if (numberRatio < 0.2) {
    score += 5
  }

  // 8. Has good content structure (+10)
  const id = element.id.toLowerCase()
  const className = element.className.toString().toLowerCase()
  const contentKeywords = ['content', 'article', 'post', 'text', 'body', 'main', 'entry']

  if (contentKeywords.some((keyword) => id.includes(keyword) || className.includes(keyword))) {
    score += 10
  }

  return Math.min(100, score)
}

/**
 * Filter and sort candidates based on detection mode
 */
function filterAndSortCandidates(
  candidates: ParagraphCandidate[],
  settings: DetectionSettings
): ParagraphCandidate[] {
  // Apply detection mode threshold
  let threshold = 0

  switch (settings.detectionMode) {
    case 'aggressive':
      threshold = 30 // Lower threshold = more paragraphs
      break
    case 'balanced':
      threshold = 50 // Medium threshold (recommended)
      break
    case 'conservative':
      threshold = 70 // Higher threshold = fewer, high-quality paragraphs
      break
  }

  // Filter by threshold
  const filtered = candidates.filter((c) => c.score >= threshold)

  // Sort by score (highest first)
  filtered.sort((a, b) => b.score - a.score)

  // Limit total number (prevent overwhelming on huge pages)
  const maxParagraphs = settings.detectionMode === 'aggressive' ? 100 : 50
  return filtered.slice(0, maxParagraphs)
}

/**
 * Generate stable paragraph ID from candidate
 * Uses xpath and text hash for uniqueness
 */
export function generateParagraphId(candidate: ParagraphCandidate): string {
  const textHash = hashString(candidate.text.substring(0, 50))
  const xpathHash = hashString(candidate.metadata.xpath)
  return `para-${textHash}-${xpathHash}`
}

/**
 * Re-detect paragraphs (for dynamic content)
 * Only returns new paragraphs not in existing set
 */
export function detectNewParagraphs(
  settings: DetectionSettings,
  existingIds: Set<string>,
  root: HTMLElement = document.body
): ParagraphCandidate[] {
  const allCandidates = detectParagraphs(settings, root)

  // Filter out existing paragraphs
  return allCandidates.filter((candidate) => {
    const id = generateParagraphId(candidate)
    return !existingIds.has(id)
  })
}

/**
 * Detect paragraphs in a specific subtree (for dynamic content)
 */
export function detectParagraphsInSubtree(
  element: HTMLElement,
  settings: DetectionSettings
): ParagraphCandidate[] {
  return detectParagraphs(settings, element)
}
