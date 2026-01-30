// Translation Error Component
interface TranslationErrorProps {
  error: string
  errorCode: string
  sourceText: string
  onRetry: () => void
  onOpenSettings: () => void
}

export function TranslationError({
  error,
  errorCode,
  sourceText,
  onRetry,
  onOpenSettings,
}: TranslationErrorProps) {
  const getErrorDetails = () => {
    switch (errorCode) {
      case 'API_KEY_INVALID':
        return {
          title: 'Invalid API Key',
          description: 'Your API key is invalid or has expired. Please check your settings.',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          ),
          showSettings: true,
          showRetry: false,
        }
      case 'RATE_LIMIT':
        return {
          title: 'Rate Limit Exceeded',
          description: 'Too many requests. Please wait a moment and try again.',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          showSettings: false,
          showRetry: true,
        }
      case 'NETWORK_ERROR':
        return {
          title: 'Network Error',
          description: 'Could not connect to the translation service. Please check your internet connection.',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          ),
          showSettings: false,
          showRetry: true,
        }
      case 'SERVICE_UNAVAILABLE':
        return {
          title: 'Service Unavailable',
          description: 'The translation service is temporarily unavailable. Please try again later.',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          ),
          showSettings: false,
          showRetry: true,
        }
      default:
        return {
          title: 'Translation Failed',
          description: error || 'An unexpected error occurred.',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          showSettings: true,
          showRetry: true,
        }
    }
  }

  const details = getErrorDetails()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 overflow-hidden">
      {/* Error Header */}
      <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <div className="text-red-500 dark:text-red-400">
            {details.icon}
          </div>
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              {details.title}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
              {details.description}
            </p>
          </div>
        </div>
      </div>

      {/* Source Text Preview */}
      {sourceText && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Text that failed to translate:
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded line-clamp-3">
            {sourceText}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
        {details.showRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}

        {details.showSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open Settings
          </button>
        )}
      </div>
    </div>
  )
}
