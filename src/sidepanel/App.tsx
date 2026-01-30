import { useState, useEffect, useRef, useCallback } from 'react'
import { TranslationCard } from './components/TranslationView/TranslationCard'
import { TranslationError } from './components/TranslationView/TranslationError'
import { ChatWindow } from './components/ChatInterface/ChatWindow'
import { ModelSelector } from './components/ModelSelector'

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
  streamingText: string
  isStreaming: boolean
  streamingSourceText: string
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
  const streamingText = currentWindowData?.streamingText ?? ''
  const isStreaming = currentWindowData?.isStreaming ?? false
  const streamingSourceText = currentWindowData?.streamingSourceText ?? ''

  // Helper to update current window's data
  const updateWindowData = (windowId: number, updates: Partial<WindowData>) => {
    setDataByWindow((prev) => ({
      ...prev,
      [windowId]: {
        translation: prev[windowId]?.translation ?? null,
        error: prev[windowId]?.error ?? null,
        loading: prev[windowId]?.loading ?? false,
        streamingText: prev[windowId]?.streamingText ?? '',
        isStreaming: prev[windowId]?.isStreaming ?? false,
        streamingSourceText: prev[windowId]?.streamingSourceText ?? '',
        ...updates,
      },
    }))
  }

  // Main port for window-specific communication with background
  const mainPortRef = useRef<chrome.runtime.Port | null>(null)
  // Translation stream port reference
  const translationPortRef = useRef<chrome.runtime.Port | null>(null)

  // Internal streaming translation function (defined before handlePortMessage to avoid circular deps)
  const startStreamingTranslationInternal = useCallback((text: string, windowId: number) => {
    // Disconnect existing port if any
    if (translationPortRef.current) {
      translationPortRef.current.disconnect()
    }

    updateWindowData(windowId, {
      isStreaming: true,
      streamingText: '',
      streamingSourceText: text,
      error: null,
      loading: false,
    })
    setActiveTab('translation')

    const port = chrome.runtime.connect({ name: 'translation-stream' })
    translationPortRef.current = port

    port.postMessage({
      type: 'TRANSLATE_TEXT_STREAM',
      payload: { text, windowId },
    })

    port.onMessage.addListener((message) => {
      if (message.type === 'TRANSLATION_STREAM_CHUNK') {
        updateWindowData(windowId, {
          streamingText: message.payload.text,
          isStreaming: !message.payload.done,
        })
        if (message.payload.done) {
          // Create final translation object
          const finalTranslation: Translation = {
            id: crypto.randomUUID(),
            sourceText: text,
            translatedText: message.payload.text,
            sourceLang: message.payload.sourceLang || 'auto',
            targetLang: message.payload.targetLang || 'ko',
            provider: message.payload.provider || 'unknown',
            timestamp: Date.now(),
          }
          updateWindowData(windowId, {
            translation: finalTranslation,
            isStreaming: false,
          })
          port.disconnect()
        }
      } else if (message.type === 'TRANSLATION_ERROR') {
        updateWindowData(windowId, {
          error: {
            message: message.payload?.error || 'Translation failed',
            errorCode: message.payload?.errorCode || 'UNKNOWN',
            sourceText: text,
          },
          isStreaming: false,
        })
        port.disconnect()
      }
    })

    port.onDisconnect.addListener(() => {
      translationPortRef.current = null
    })
  }, [])

  // Handle messages from the main port (background script)
  const handlePortMessage = useCallback((message: any, windowId: number) => {
    console.log('Port message received:', message.type)

    switch (message.type) {
      case 'TRANSLATION_HISTORY_RESPONSE':
        if (message.success) {
          setHistory(message.history || [])
        }
        break

      case 'TRANSLATION_COMPLETE': {
        const completeTranslation: Translation = {
          id: crypto.randomUUID(),
          sourceText: message.payload?.sourceText || '',
          translatedText: message.payload?.translatedText,
          sourceLang: message.payload?.sourceLang,
          targetLang: message.payload?.targetLang,
          provider: message.payload?.provider,
          context: message.payload?.context,
          timestamp: Date.now(),
        }
        updateWindowData(windowId, {
          translation: completeTranslation,
          error: null,
          loading: false,
        })
        setActiveTab('translation')
        break
      }

      case 'TRANSLATION_ERROR':
        updateWindowData(windowId, {
          error: {
            message: message.payload?.error,
            errorCode: message.payload?.errorCode || 'UNKNOWN',
            sourceText: message.payload?.sourceText,
          },
          translation: null,
          loading: false,
        })
        setActiveTab('translation')
        break

      case 'TRANSLATE_TEXT_STREAM_REQUEST':
        console.log('Streaming translation request via port:', message.payload)
        startStreamingTranslationInternal(message.payload.text, windowId)
        break

      default:
        console.log('Unknown port message type:', message.type)
    }
  }, [startStreamingTranslationInternal])

  // Connect to background via dedicated port for this window
  useEffect(() => {
    chrome.windows.getCurrent().then((window) => {
      const windowId = window.id ?? null
      setMyWindowId(windowId)
      console.log('Side panel initialized for window:', windowId)

      if (windowId === null) return

      // Connect to background with window-specific port name
      const port = chrome.runtime.connect({ name: `sidepanel-${windowId}` })
      mainPortRef.current = port
      console.log(`Connected to background via sidepanel-${windowId}`)

      // Handle messages from background (window-specific)
      port.onMessage.addListener((message) => {
        handlePortMessage(message, windowId)
      })

      port.onDisconnect.addListener(() => {
        console.log('Main port disconnected')
        mainPortRef.current = null
      })

      // Load history via port
      port.postMessage({ type: 'GET_TRANSLATION_HISTORY' })
    })

    return () => {
      mainPortRef.current?.disconnect()
    }
  }, [handlePortMessage])

  // Note: Message handling is now done via dedicated port in handlePortMessage
  // History is loaded when the port connects to background

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

    // Use streaming translation for retry via port
    startStreamingTranslationInternal(error.sourceText, myWindowId)
  }

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Translation Assistant
          </h1>
          <ModelSelector />
        </div>
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

            {isStreaming && (
              <div className="card p-4">
                {/* Source text */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Original
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {streamingSourceText}
                  </p>
                </div>

                {/* Streaming translation */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Translation
                    </span>
                    <span className="flex items-center text-xs text-primary-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mr-2"></div>
                      Translating...
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {streamingText}
                    <span className="animate-pulse text-primary-600">|</span>
                  </p>
                </div>
              </div>
            )}

            {!loading && !isStreaming && error && (
              <TranslationError
                error={error.message}
                errorCode={error.errorCode}
                sourceText={error.sourceText}
                onRetry={handleRetry}
                onOpenSettings={handleOpenSettings}
              />
            )}

            {!loading && !isStreaming && !error && currentTranslation && (
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

            {!loading && !isStreaming && !error && !currentTranslation && (
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
