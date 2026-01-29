// UI Injector - Tooltip and overlays
import { SelectionInfo } from './textSelection'

let tooltipElement: HTMLElement | null = null

export function showTooltip(
  info: SelectionInfo,
  onAction: (action: 'translate' | 'explain') => void
) {
  // Remove existing tooltip
  hideTooltip()

  // Create tooltip element
  tooltipElement = createTooltipElement(onAction)

  // Position tooltip
  positionTooltip(tooltipElement, info.boundingRect)

  // Add to document
  document.body.appendChild(tooltipElement)

  // Animate in (use inline styles instead of CSS class)
  setTimeout(() => {
    if (tooltipElement) {
      tooltipElement.style.opacity = '1'
      tooltipElement.style.transform = 'translateY(0)'
    }
  }, 10)
}

export function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.opacity = '0'
    tooltipElement.style.transform = 'translateY(-4px)'
    const elementToRemove = tooltipElement
    tooltipElement = null
    setTimeout(() => {
      elementToRemove?.remove()
    }, 200)
  }
}

function createTooltipElement(onAction: (action: 'translate' | 'explain') => void): HTMLElement {
  const tooltip = document.createElement('div')
  tooltip.className = 'translation-tooltip'

  // Apply styles directly to avoid CSP issues with inline <style> tags
  Object.assign(tooltip.style, {
    position: 'fixed',
    zIndex: '2147483647',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '8px',
    display: 'flex',
    gap: '4px',
    opacity: '0',
    transform: 'translateY(-4px)',
    transition: 'all 0.2s ease-out',
    pointerEvents: 'auto',
  })

  // Create translate button
  const translateBtn = document.createElement('button')
  translateBtn.setAttribute('data-action', 'translate')
  applyButtonStyles(translateBtn, true)
  translateBtn.innerHTML = `
    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
    Translate
  `

  // Create explain button
  const explainBtn = document.createElement('button')
  explainBtn.setAttribute('data-action', 'explain')
  applyButtonStyles(explainBtn, false)
  explainBtn.innerHTML = `
    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Explain
  `

  tooltip.appendChild(translateBtn)
  tooltip.appendChild(explainBtn)

  // Add event listeners
  translateBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onAction('translate')
  })

  explainBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onAction('explain')
  })

  // Add hover effects
  addHoverEffects(translateBtn, true)
  addHoverEffects(explainBtn, false)

  return tooltip
}

function applyButtonStyles(btn: HTMLButtonElement, isPrimary: boolean) {
  Object.assign(btn.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    background: isPrimary ? '#3b82f6' : '#f3f4f6',
    color: isPrimary ? 'white' : '#1f2937',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  })
}

function addHoverEffects(btn: HTMLButtonElement, isPrimary: boolean) {
  const originalBg = isPrimary ? '#3b82f6' : '#f3f4f6'
  const hoverBg = isPrimary ? '#2563eb' : '#e5e7eb'

  btn.addEventListener('mouseenter', () => {
    btn.style.background = hoverBg
    btn.style.transform = 'translateY(-1px)'
  })

  btn.addEventListener('mouseleave', () => {
    btn.style.background = originalBg
    btn.style.transform = 'translateY(0)'
  })

  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'translateY(0)'
  })
}

function positionTooltip(tooltip: HTMLElement, selectionRect: DOMRect) {
  const tooltipHeight = 48 // Approximate height
  const tooltipWidth = 200 // Approximate width

  // Calculate position (fixed positioning uses viewport coordinates)
  // getBoundingClientRect already returns viewport-relative coordinates
  let top = selectionRect.top - tooltipHeight - 8
  let left = selectionRect.left + selectionRect.width / 2 - tooltipWidth / 2

  // Adjust if tooltip would go off screen
  if (top < 10) {
    // Position below selection if not enough space above
    top = selectionRect.bottom + 8
  }

  if (left < 10) {
    left = 10
  } else if (left + tooltipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltipWidth - 10
  }

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`
}

// Export for testing
export { createTooltipElement, positionTooltip }
