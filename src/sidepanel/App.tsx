import { useState, useEffect } from 'react'
import { TranslationCard } from './components/TranslationView/TranslationCard'
import { TranslationError } from './components/TranslationView/TranslationError'
import { ChatWindow } from './components/ChatInterface/ChatWindow'

interface Translation {
  id: string
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
  timestamp: number
}

interface ErrorState {
  message: string
  errorCode: string
  sourceText: string
}

interface WindowData {
  translation: Translation | null
  error: ErrorState | null
  loading: boolean
}

function App() {
  const [activeTab, setActiveTab] = useState<'translation' | 'chat' | 'history'>('translation')
  const [history, setHistory] = useState<Translation[]>([])
  const [myWindowId, setMyWindowId] = useState<number | null>(null)
  // Store data per window to prevent cross-window state sharing
  const [dataByWindow, setDataByWindow] = useState<Record<number, WindowData>>({})

  // Derived state for current window
  const currentWindowData = myWindowId ? dataByWindow[myWindowId] : null
  const currentTranslation = currentWindowData?.translation ?? null
  const error = currentWindowData?.error ?? null
  const loading = currentWindowData?.loading ?? false

  // Helper to update current window's data
  const updateWindowData = (windowId: number, updates: Partial<WindowData>) => {
    setDataByWindow((prev) => ({
      ...prev,
      [windowId]: {
        translation: prev[windowId]?.translation ?? null,
        error: prev[windowId]?.error ?? null,
        loading: prev[windowId]?.loading ?? false,
        ...updates,
      },
    }))
  }

  // Get current window ID on mount
  useEffect(() => {
    chrome.windows.getCurrent().then((window) => {
      setMyWindowId(window.id ?? null)
      console.log('Side panel initialized for window:', window.id)
    })
  }, [])

  // Listen for translation messages (filtered by windowId)
  useEffect(() => {
    const messageListener = (message: any) => {
      // Get the windowId from the message
      const messageWindowId = message.payload?.windowId

      if (message.type === 'TRANSLATION_COMPLETE') {
        console.log('Translation received in side panel:', message.payload)

        // Only update state for the specific window
        if (messageWindowId !== undefined) {
          const translation: Translation = {
            id: crypto.randomUUID(),
            sourceText: message.payload.sourceText || '',
            translatedText: message.payload.translatedText,
            sourceLang: message.payload.sourceLang,
            targetLang: message.payload.targetLang,
            provider: message.payload.provider,
            context: message.payload.context,
            timestamp: Date.now(),
          }

          updateWindowData(messageWindowId, {
            translation,
            error: null,
            loading: false,
          })

          // Switch to translation tab only if this is our window
          if (messageWindowId === myWindowId) {
            setActiveTab('translation')
          }
        }
      }

      if (message.type === 'TRANSLATION_ERROR') {
        console.log('Translation error received in side panel:', message.payload)

        // Only update state for the specific window
        if (messageWindowId !== undefined) {
          updateWindowData(messageWindowId, {
            error: {
              message: message.payload.error,
              errorCode: message.payload.errorCode,
              sourceText: message.payload.sourceText,
            },
            translation: null,
            loading: false,
          })

          // Switch to translation tab only if this is our window
          if (messageWindowId === myWindowId) {
            setActiveTab('translation')
          }
        }
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [myWindowId])

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_TRANSLATION_HISTORY' })
      if (response.success) {
        setHistory(response.history || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const handleAskQuestion = () => {
    // TODO: Switch to chat tab with current translation context
    setActiveTab('chat')
  }

  const handleHistoryItemClick = (translation: Translation) => {
    if (myWindowId !== null) {
      updateWindowData(myWindowId, {
        translation,
        error: null,
      })
    }
    setActiveTab('translation')
  }

  const handleRetry = () => {
    if (!error?.sourceText || myWindowId === null) return

    updateWindowData(myWindowId, {
      error: null,
      loading: true,
    })

    chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text: error.sourceText,
        action: 'translate',
      },
    })
  }

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Translation Assistant
        </h1>
      </header>

      {/* Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('translation')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'translation'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Translation
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            History
            {history.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'translation' && (
          <div className="space-y-4">
            {loading && (
              <div className="card">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Translating...</span>
                </div>
              </div>
            )}

            {!loading && error && (
              <TranslationError
                error={error.message}
                errorCode={error.errorCode}
                sourceText={error.sourceText}
                onRetry={handleRetry}
                onOpenSettings={handleOpenSettings}
              />
            )}

            {!loading && !error && currentTranslation && (
              <TranslationCard
                sourceText={currentTranslation.sourceText}
                translatedText={currentTranslation.translatedText}
                sourceLang={currentTranslation.sourceLang}
                targetLang={currentTranslation.targetLang}
                provider={currentTranslation.provider}
                context={currentTranslation.context}
                timestamp={currentTranslation.timestamp}
                onAskQuestion={handleAskQuestion}
              />
            )}

            {!loading && !error && !currentTranslation && (
              <div className="card">
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Select text to translate
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Highlight any text on a webpage or PDF to see the translation here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            <ChatWindow
              translationContext={
                currentTranslation
                  ? {
                      sourceText: currentTranslation.sourceText,
                      translatedText: currentTranslation.translatedText,
                      sourceLang: currentTranslation.sourceLang,
                      targetLang: currentTranslation.targetLang,
                    }
                  : undefined
              }
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="card">
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    No history yet
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Your translation history will appear here.
                  </p>
                </div>
              </div>
            ) : (
              history.map((translation) => (
                <div
                  key={translation.id}
                  onClick={() => handleHistoryItemClick(translation)}
                  className="cursor-pointer"
                >
                  <TranslationCard
                    sourceText={translation.sourceText}
                    translatedText={translation.translatedText}
                    sourceLang={translation.sourceLang}
                    targetLang={translation.targetLang}
                    provider={translation.provider}
                    context={translation.context}
                    timestamp={translation.timestamp}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
