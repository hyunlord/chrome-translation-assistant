// Translation Card Component
import React from 'react'

interface TranslationCardProps {
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: string
  context?: {
    url?: string
    title?: string
    surroundingText?: string
  }
  timestamp?: number
  onAskQuestion?: () => void
}

export function TranslationCard({
  sourceText,
  translatedText,
  sourceLang,
  targetLang,
  provider,
  context,
  timestamp,
  onAskQuestion,
}: TranslationCardProps) {
  const [showOriginal, setShowOriginal] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText)
    // TODO: Show toast notification
  }

  const handleGoToSource = () => {
    if (context?.url) {
      chrome.tabs.create({ url: context.url })
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{sourceLang.toUpperCase()}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-medium">{targetLang.toUpperCase()}</span>
            <span className="mx-2">·</span>
            <span className="text-xs">{provider}</span>
          </div>

          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(timestamp).toLocaleString()}
            </span>
          )}
        </div>

        {context?.title && (
          <div className="mt-2 flex items-center gap-2">
            <a
              href={context.url}
              onClick={(e) => {
                e.preventDefault()
                handleGoToSource()
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-md"
              title={context.title}
            >
              {context.title}
            </a>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Source Text (collapsible) */}
        <div>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${showOriginal ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Original Text
          </button>

          {showOriginal && (
            <div className="pl-6 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded">
              {sourceText}
            </div>
          )}
        </div>

        {/* Translated Text */}
        <div>
          <div className="text-base text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {translatedText}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
            title="Copy translation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>

          {context?.url && (
            <button
              onClick={handleGoToSource}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
              title="Go to source page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Go to Source
            </button>
          )}
        </div>

        {onAskQuestion && (
          <button
            onClick={onAskQuestion}
            className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            Ask Question
          </button>
        )}
      </div>
    </div>
  )
}
