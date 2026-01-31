// Chat Window Component - Props-based for window isolation
import React, { useState, useRef, useEffect } from 'react'
import { MarkdownRenderer } from '../MarkdownRenderer'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatWindowProps {
  messages: ChatMessage[]
  onSendMessage: (message: ChatMessage) => void
  onClearChat?: () => void
  translationContext?: {
    sourceText: string
    translatedText: string
    sourceLang: string
    targetLang: string
  }
}

export function ChatWindow({
  messages,
  onSendMessage,
  onClearChat: _onClearChat,
  translationContext,
}: ChatWindowProps) {
  // Note: onClearChat can be used for a "Clear Chat" button feature
  void _onClearChat
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isComposing, setIsComposing] = useState(false) // IME composition state
  const [pendingUserMessage, setPendingUserMessage] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const userScrolledDuringStream = useRef(false) // Track if user scrolled away during streaming

  // Check if user is near bottom of scroll container
  const isNearBottom = () => {
    const container = scrollContainerRef.current
    if (!container) return true
    const threshold = 100 // px
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }

  // Auto-scroll to bottom (only if user is near bottom)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Track scroll position to determine if we should auto-scroll
  const handleScroll = () => {
    const nearBottom = isNearBottom()
    shouldAutoScroll.current = nearBottom

    // Track if user scrolled away during streaming
    if (streaming && !nearBottom) {
      userScrolledDuringStream.current = true
    }
  }

  useEffect(() => {
    // Don't auto-scroll if user scrolled away during streaming
    if (streaming && userScrolledDuringStream.current) {
      return
    }

    if (shouldAutoScroll.current) {
      scrollToBottom()
    }
  }, [messages, streaming, streamingContent])

  // Add initial context message when translationContext is provided and no messages exist
  useEffect(() => {
    if (translationContext && messages.length === 0) {
      const contextMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I can help you understand this translation:\n\n**Original (${translationContext.sourceLang}):** ${translationContext.sourceText}\n\n**Translation (${translationContext.targetLang}):** ${translationContext.translatedText}\n\nFeel free to ask me anything about the grammar, vocabulary, cultural context, or meaning!`,
        timestamp: Date.now(),
      }
      onSendMessage(contextMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationContext])

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return

    // Enable auto-scroll when user sends a message
    shouldAutoScroll.current = true
    userScrolledDuringStream.current = false // Reset scroll tracking for new message

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    // Send user message to parent
    onSendMessage(userMessage)
    setPendingUserMessage(userMessage) // 즉시 UI에 표시
    setInput('')
    setSending(true)

    // Create placeholder for streaming message
    const newStreamingMessageId = crypto.randomUUID()
    setStreamingMessageId(newStreamingMessageId)
    setStreamingContent('')
    setStreaming(true)

    try {
      // Prepare messages for API
      const apiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add translation context as system message if available
      if (translationContext) {
        apiMessages.unshift({
          role: 'user',
          content: `Context: I'm asking about this translation:\nOriginal (${translationContext.sourceLang}): ${translationContext.sourceText}\nTranslation (${translationContext.targetLang}): ${translationContext.translatedText}`,
        })
      }

      // Add user message
      apiMessages.push({
        role: 'user',
        content: input.trim(),
      })

      // Send to background script with streaming
      const port = chrome.runtime.connect({ name: 'chat-stream' })

      port.postMessage({
        type: 'SEND_CHAT_MESSAGE_STREAM',
        payload: {
          messages: apiMessages,
        },
      })

      let fullContent = ''

      port.onMessage.addListener((message) => {
        if (message.type === 'CHAT_STREAM_CHUNK') {
          fullContent += message.chunk
          setStreamingContent(fullContent)
        } else if (message.type === 'CHAT_STREAM_DONE') {
          // Create final assistant message and send to parent
          const assistantMessage: ChatMessage = {
            id: newStreamingMessageId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          }
          onSendMessage(assistantMessage)

          setStreaming(false)
          setStreamingMessageId(null)
          setStreamingContent('')
          userScrolledDuringStream.current = false // Reset for next stream
          port.disconnect()
        } else if (message.type === 'CHAT_STREAM_ERROR') {
          throw new Error(message.error)
        }
      })

      port.onDisconnect.addListener(() => {
        setStreaming(false)
        setSending(false)
        setStreamingMessageId(null)
      })
    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure you have set up your API key in the settings.`,
        timestamp: Date.now(),
      }

      // Send error message to parent
      onSendMessage(errorMessage)
      setStreaming(false)
      setStreamingMessageId(null)
      setStreamingContent('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't send on Enter during IME composition (Korean, Japanese, Chinese input)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Clear pending user message when it appears in messages prop
  useEffect(() => {
    if (pendingUserMessage && messages.some(m => m.id === pendingUserMessage.id)) {
      setPendingUserMessage(null)
    }
  }, [messages, pendingUserMessage])

  // Combine messages with pending user message and streaming content
  const displayMessages = React.useMemo(() => {
    const result = [...messages]

    // 아직 parent에 반영 안된 유저 메시지 추가
    if (pendingUserMessage && !messages.some(m => m.id === pendingUserMessage.id)) {
      result.push(pendingUserMessage)
    }

    // 스트리밍 중인 어시스턴트 메시지 추가
    if (streaming && streamingMessageId) {
      result.push({
        id: streamingMessageId,
        role: 'assistant' as const,
        content: streamingContent,
        timestamp: Date.now(),
      })
    }

    return result
  }, [messages, pendingUserMessage, streaming, streamingMessageId, streamingContent])

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {displayMessages.length === 0 && !streaming && (
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Start a conversation
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ask questions about your translations and get detailed explanations.
            </p>
          </div>
        )}

        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="break-words">
                <MarkdownRenderer content={message.content} />
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-primary-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {streaming && streamingContent === '' && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
