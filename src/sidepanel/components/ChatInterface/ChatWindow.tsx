// Chat Window Component
import React, { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatWindowProps {
  translationContext?: {
    sourceText: string
    translatedText: string
    sourceLang: string
    targetLang: string
  }
}

export function ChatWindow({ translationContext }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add initial context message
  useEffect(() => {
    if (translationContext && messages.length === 0) {
      const contextMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I can help you understand this translation:\n\n**Original (${translationContext.sourceLang}):** ${translationContext.sourceText}\n\n**Translation (${translationContext.targetLang}):** ${translationContext.translatedText}\n\nFeel free to ask me anything about the grammar, vocabulary, cultural context, or meaning!`,
        timestamp: Date.now(),
      }
      setMessages([contextMessage])
    }
  }, [translationContext])

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    // Create placeholder for streaming message
    const streamingMessageId = crypto.randomUUID()
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, streamingMessage])
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
          // Update the streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageId ? { ...msg, content: fullContent } : msg
            )
          )
        } else if (message.type === 'CHAT_STREAM_DONE') {
          setStreaming(false)
          port.disconnect()
        } else if (message.type === 'CHAT_STREAM_ERROR') {
          throw new Error(message.error)
        }
      })

      port.onDisconnect.addListener(() => {
        setStreaming(false)
        setSending(false)
      })
    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure you have set up your API key in the settings.`,
        timestamp: Date.now(),
      }

      // Remove the streaming placeholder and add error message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== streamingMessageId).concat(errorMessage)
      )
      setStreaming(false)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
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

        {messages.map((message) => (
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
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
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

        {streaming && (
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
