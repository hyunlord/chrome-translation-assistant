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

  // Animate in
  setTimeout(() => {
    tooltipElement?.classList.add('translation-tooltip-visible')
  }, 10)
}

export function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.classList.remove('translation-tooltip-visible')
    setTimeout(() => {
      tooltipElement?.remove()
      tooltipElement = null
    }, 200)
  }
}

function createTooltipElement(onAction: (action: 'translate' | 'explain') => void): HTMLElement {
  const tooltip = document.createElement('div')
  tooltip.className = 'translation-tooltip'

  tooltip.innerHTML = `
    <style>
      .translation-tooltip {
        position: fixed;
        z-index: 2147483647;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 8px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transform: translateY(-4px);
        transition: all 0.2s ease-out;
        pointer-events: auto;
      }

      .translation-tooltip-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .translation-tooltip-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        background: #f3f4f6;
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }

      .translation-tooltip-btn:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      .translation-tooltip-btn:active {
        transform: translateY(0);
      }

      .translation-tooltip-btn-primary {
        background: #3b82f6;
        color: white;
      }

      .translation-tooltip-btn-primary:hover {
        background: #2563eb;
      }

      .translation-tooltip-icon {
        width: 16px;
        height: 16px;
      }
    </style>

    <button class="translation-tooltip-btn translation-tooltip-btn-primary" data-action="translate">
      <svg class="translation-tooltip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      Translate
    </button>

    <button class="translation-tooltip-btn" data-action="explain">
      <svg class="translation-tooltip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Explain
    </button>
  `

  // Add event listeners
  const translateBtn = tooltip.querySelector('[data-action="translate"]') as HTMLButtonElement
  const explainBtn = tooltip.querySelector('[data-action="explain"]') as HTMLButtonElement

  translateBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    onAction('translate')
  })

  explainBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    onAction('explain')
  })

  return tooltip
}

function positionTooltip(tooltip: HTMLElement, selectionRect: DOMRect) {
  const tooltipHeight = 48 // Approximate height
  const tooltipWidth = 200 // Approximate width

  // Calculate position
  let top = selectionRect.top + window.scrollY - tooltipHeight - 8
  let left = selectionRect.left + window.scrollX + selectionRect.width / 2 - tooltipWidth / 2

  // Adjust if tooltip would go off screen
  if (top < window.scrollY + 10) {
    // Position below selection if not enough space above
    top = selectionRect.bottom + window.scrollY + 8
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
