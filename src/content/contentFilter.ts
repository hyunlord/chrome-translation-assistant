// Content Filter - Filters out navigation, headers, footers, and ads

import { isVisible } from '../lib/utils/domUtils'

/**
 * Selectors for elements that should be excluded from translation
 */
const EXCLUDED_SELECTORS = [
  // Navigation elements
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '[role="contentinfo"]',

  // Common class/ID patterns
  '.sidebar',
  '.menu',
  '.navigation',
  '.nav',
  '.footer',
  '.header',
  '#header',
  '#footer',
  '#sidebar',
  '#menu',

  // Advertisements
  '.ad',
  '.ads',
  '.advertisement',
  '.advert',
  '[id*="ad-"]',
  '[class*="ad-"]',
  '[id*="google_ads"]',
  '[class*="google-ad"]',

  // Cookie banners and notices
  '.cookie-banner',
  '.cookie-notice',
  '.privacy-notice',
  '.gdpr',

  // Social share buttons
  '.social-share',
  '.share-buttons',
  '.social-buttons',

  // Newsletter signup
  '.newsletter',
  '.subscribe',
  '.signup',

  // Comments section (often noisy)
  '.comments',
  '#comments',
  '.comment-section',

  // Tags and metadata
  '.tags',
  '.metadata',
  '.post-meta',

  // Non-content elements
  'script',
  'style',
  'noscript',
  'iframe',
  'embed',
  'object',
  'svg',
  'canvas',

  // Forms and inputs
  'form',
  'input',
  'button',
  'select',
  'textarea',
]

/**
 * Code-related element selectors
 */
const CODE_SELECTORS = ['pre', 'code', 'kbd', 'samp', 'var', '.code', '.highlight']

/**
 * Check if element should be excluded from translation
 */
export function isExcludedElement(element: HTMLElement): boolean {
  // Check if element is visible
  if (!isVisible(element)) {
    return true
  }

  // Check if element matches excluded selectors
  for (const selector of EXCLUDED_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true
      }
    } catch (e) {
      // Invalid selector, skip
      continue
    }
  }

  // Check if element is inside excluded parent
  for (const selector of EXCLUDED_SELECTORS) {
    try {
      if (element.closest(selector)) {
        return true
      }
    } catch (e) {
      continue
    }
  }

  // Check aria-hidden attribute
  if (element.getAttribute('aria-hidden') === 'true') {
    return true
  }

  // Check hidden attribute
  if (element.hasAttribute('hidden')) {
    return true
  }

  return false
}

/**
 * Check if element is a code block
 */
export function isCodeBlock(element: HTMLElement): boolean {
  // Check if element matches code selectors
  for (const selector of CODE_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true
      }
    } catch (e) {
      continue
    }
  }

  // Check if element is inside code block
  for (const selector of CODE_SELECTORS) {
    try {
      if (element.closest(selector)) {
        return true
      }
    } catch (e) {
      continue
    }
  }

  // Check for monospace font (common for code)
  const style = window.getComputedStyle(element)
  const fontFamily = style.fontFamily.toLowerCase()
  const monospaceKeywords = ['monospace', 'courier', 'consolas', 'monaco', 'source code']

  for (const keyword of monospaceKeywords) {
    if (fontFamily.includes(keyword)) {
      return true
    }
  }

  return false
}

/**
 * Detect language of text using lang attribute
 * Returns language code or null if not detectable
 */
export function detectLanguageFromAttribute(element: HTMLElement): string | null {
  // Check element's lang attribute
  const lang = element.getAttribute('lang')
  if (lang) {
    return lang.split('-')[0].toLowerCase() // Extract primary language code
  }

  // Check parent elements
  let parent = element.parentElement
  while (parent) {
    const parentLang = parent.getAttribute('lang')
    if (parentLang) {
      return parentLang.split('-')[0].toLowerCase()
    }
    parent = parent.parentElement
  }

  // Check html element
  const htmlLang = document.documentElement.getAttribute('lang')
  if (htmlLang) {
    return htmlLang.split('-')[0].toLowerCase()
  }

  return null
}

/**
 * Check if text is already in target language
 * Uses simple heuristics based on character sets
 */
export function isLikelyInLanguage(text: string, targetLang: string): boolean {
  const sampleText = text.substring(0, 100).toLowerCase()

  switch (targetLang) {
    case 'ko': // Korean
      // Check for Korean characters (Hangul)
      return /[\u3131-\uD79D]/.test(sampleText)

    case 'ja': // Japanese
      // Check for Japanese characters (Hiragana, Katakana, Kanji)
      return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sampleText)

    case 'zh': // Chinese
      // Check for Chinese characters (CJK Unified Ideographs)
      return /[\u4E00-\u9FFF]/.test(sampleText)

    case 'ar': // Arabic
      // Check for Arabic characters
      return /[\u0600-\u06FF]/.test(sampleText)

    case 'he': // Hebrew
      // Check for Hebrew characters
      return /[\u0590-\u05FF]/.test(sampleText)

    case 'ru': // Russian
      // Check for Cyrillic characters
      return /[\u0400-\u04FF]/.test(sampleText)

    case 'el': // Greek
      // Check for Greek characters
      return /[\u0370-\u03FF]/.test(sampleText)

    case 'th': // Thai
      // Check for Thai characters
      return /[\u0E00-\u0E7F]/.test(sampleText)

    case 'en': {
      // Check if mostly ASCII and common English words
      const commonWords = ['the', 'a', 'is', 'in', 'to', 'and', 'of', 'for', 'on', 'with']
      return commonWords.some((word) => sampleText.includes(word))
    }

    default:
      // For other languages, assume need translation
      return false
  }
}

/**
 * Final decision: should this element be translated?
 */
export function shouldTranslate(
  element: HTMLElement,
  text: string,
  targetLang: string,
  excludeCodeBlocks: boolean
): boolean {
  // Check if element is excluded
  if (isExcludedElement(element)) {
    return false
  }

  // Check if code block and user wants to exclude them
  if (excludeCodeBlocks && isCodeBlock(element)) {
    return false
  }

  // Check if text is too short
  if (text.length < 10) {
    return false
  }

  // Check if already in target language (from lang attribute)
  const detectedLang = detectLanguageFromAttribute(element)
  if (detectedLang === targetLang) {
    return false
  }

  // Check if text is likely already in target language (heuristic)
  if (isLikelyInLanguage(text, targetLang)) {
    return false
  }

  return true
}

/**
 * Get content quality score for filtering
 * Higher score = more likely to be meaningful content
 */
export function getContentQualityScore(element: HTMLElement, text: string): number {
  let score = 0

  // Semantic HTML tags
  const semanticTags = ['article', 'section', 'p', 'blockquote', 'main']
  if (semanticTags.includes(element.tagName.toLowerCase())) {
    score += 30
  }

  // Has meaningful ID or class
  const id = element.id.toLowerCase()
  const className = element.className.toString().toLowerCase()
  const contentKeywords = ['content', 'article', 'post', 'text', 'body', 'main']

  if (contentKeywords.some((keyword) => id.includes(keyword) || className.includes(keyword))) {
    score += 20
  }

  // Text length is reasonable
  if (text.length >= 100 && text.length <= 2000) {
    score += 20
  } else if (text.length > 50 && text.length < 100) {
    score += 10
  }

  // Low punctuation ratio (not code or data)
  const punctuationRatio = (text.match(/[^\w\s]/g) || []).length / text.length
  if (punctuationRatio < 0.1) {
    score += 15
  }

  // Low number ratio (not tables or data)
  const numberRatio = (text.match(/\d/g) || []).length / text.length
  if (numberRatio < 0.1) {
    score += 15
  }

  return score
}
