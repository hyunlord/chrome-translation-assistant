// Error Handling and User Feedback System

/**
 * Error types for better categorization
 */
export enum ErrorType {
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public context?: Record<string, any>,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Error handler singleton
 */
class ErrorHandler {
  private errorLog: AppError[] = []
  private maxLogSize = 100

  /**
   * Handle an error
   */
  handle(error: Error | AppError, context?: Record<string, any>): void {
    const appError = error instanceof AppError
      ? error
      : new AppError(
          ErrorType.UNKNOWN_ERROR,
          error.message,
          context,
          'An unexpected error occurred'
        )

    // Log to console
    console.error(`[${appError.type}]`, appError.message, appError.context)

    // Add to error log
    this.errorLog.push(appError)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Show user notification
    this.showUserNotification(appError)
  }

  /**
   * Show user-friendly notification
   */
  private showUserNotification(error: AppError): void {
    const message = error.userMessage || this.getDefaultUserMessage(error.type)

    // In content script context, create toast notification
    if (typeof document !== 'undefined') {
      this.showToast(message, 'error')
    }
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'error' | 'warning' | 'info' | 'success'): void {
    // Check if toast container exists
    let container = document.getElementById('translation-assistant-toast-container')

    if (!container) {
      container = document.createElement('div')
      container.id = 'translation-assistant-toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `
      document.body.appendChild(container)
    }

    // Create toast element
    const toast = document.createElement('div')
    toast.className = `translation-assistant-toast toast-${type}`
    toast.style.cssText = `
      background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
      color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : type === 'warning' ? '#92400e' : '#1e40af'};
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    `
    toast.textContent = message

    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `
    if (!document.getElementById('translation-assistant-toast-styles')) {
      style.id = 'translation-assistant-toast-styles'
      document.head.appendChild(style)
    }

    container.appendChild(toast)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => {
        toast.remove()
        if (container!.children.length === 0) {
          container!.remove()
        }
      }, 300)
    }, 5000)
  }

  /**
   * Get default user message for error type
   */
  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.API_ERROR:
        return 'Translation service error. Please check your API key in settings.'
      case ErrorType.NETWORK_ERROR:
        return 'Network error. Please check your internet connection.'
      case ErrorType.VALIDATION_ERROR:
        return 'Invalid input. Please try again.'
      case ErrorType.STORAGE_ERROR:
        return 'Storage error. Please try clearing extension data.'
      case ErrorType.CONFIGURATION_ERROR:
        return 'Configuration error. Please check your settings.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  /**
   * Get error log
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    if (typeof document !== 'undefined') {
      this.showToast(message, 'success')
    }
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    if (typeof document !== 'undefined') {
      this.showToast(message, 'info')
    }
  }

  /**
   * Show warning message
   */
  showWarning(message: string): void {
    if (typeof document !== 'undefined') {
      this.showToast(message, 'warning')
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler()

/**
 * Wrap async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    errorHandler.handle(error as Error, context)
    return null
  }
}

/**
 * Create API error
 */
export function createAPIError(message: string, statusCode?: number): AppError {
  return new AppError(
    ErrorType.API_ERROR,
    message,
    { statusCode },
    'Translation failed. Please check your API key and try again.'
  )
}

/**
 * Create network error
 */
export function createNetworkError(message: string): AppError {
  return new AppError(
    ErrorType.NETWORK_ERROR,
    message,
    undefined,
    'Network error. Please check your connection.'
  )
}

/**
 * Create validation error
 */
export function createValidationError(message: string, field?: string): AppError {
  return new AppError(
    ErrorType.VALIDATION_ERROR,
    message,
    { field },
    'Invalid input. Please check your settings.'
  )
}
