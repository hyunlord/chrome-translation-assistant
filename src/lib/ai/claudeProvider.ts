// Claude AI Provider
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationRequest,
  TranslationResponse,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ValidationResult,
} from './baseProvider'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequest {
  model: string
  messages: ClaudeMessage[]
  max_tokens: number
  temperature?: number
  system?: string
  stream?: boolean
}

interface ClaudeResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class ClaudeProvider extends BaseAIProvider {
  private readonly apiEndpoint = 'https://api.anthropic.com/v1/messages'
  private readonly defaultModel = 'claude-3-5-sonnet-20241022'

  constructor(config: AIProviderConfig) {
    super('claude', {
      model: config.model || 'claude-3-5-sonnet-20241022',
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      ...config,
    })
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now()

    // Detect source language if not provided
    const sourceLang = request.sourceLang || (await this.detectLanguage(request.text))

    const systemPrompt = `You are a professional translator. Translate accurately while preserving the original meaning, tone, and style. Provide ONLY the translation without any explanations.`

    const userPrompt = this.buildTranslationPrompt({
      ...request,
      sourceLang,
    })

    try {
      const claudeRequest: ClaudeRequest = {
        model: this.config.model || this.defaultModel,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature,
        system: systemPrompt,
      }

      const response = await this.makeRequest<ClaudeResponse>(claudeRequest)

      const translatedText = response.content[0]?.text || ''

      return {
        translatedText,
        sourceLang,
        targetLang: request.targetLang,
        provider: 'claude',
        metadata: {
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          duration: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('Claude translation error:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Convert messages (filter out system messages for Claude API)
      const messages: ClaudeMessage[] = request.messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))

      // Extract system message if present
      const systemMessage = request.messages.find((msg) => msg.role === 'system')

      const claudeRequest: ClaudeRequest = {
        model: this.config.model || this.defaultModel,
        messages,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature,
        system: systemMessage?.content,
      }

      const response = await this.makeRequest<ClaudeResponse>(claudeRequest)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content[0]?.text || '',
      }

      return {
        message: assistantMessage,
        metadata: {
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        },
      }
    } catch (error) {
      console.error('Claude chat error:', error)
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      const messages: ClaudeMessage[] = request.messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))

      const systemMessage = request.messages.find((msg) => msg.role === 'system')

      const claudeRequest: ClaudeRequest = {
        model: this.config.model || this.defaultModel,
        messages,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature,
        system: systemMessage?.content,
        stream: true,
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(claudeRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text
                if (text) {
                  yield text
                }
              }
            } catch (e) {
              // Skip invalid JSON
              continue
            }
          }
        }
      }
    } catch (error) {
      console.error('Claude streaming error:', error)
      throw error
    }
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      const testRequest: ClaudeRequest = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }

      await this.makeRequest<ClaudeResponse>(testRequest)
      return { valid: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('API key validation failed:', error)

      if (message.includes('401') || message.includes('invalid') || message.includes('authentication')) {
        return { valid: false, error: 'Invalid API key', errorCode: 'INVALID_KEY' }
      }
      if (message.includes('429') || message.includes('rate')) {
        return { valid: false, error: 'Rate limit exceeded', errorCode: 'RATE_LIMIT' }
      }
      if (message.includes('fetch') || message.includes('network')) {
        return { valid: false, error: 'Network error - could not connect', errorCode: 'NETWORK_ERROR' }
      }

      return { valid: false, error: message, errorCode: 'INVALID_KEY' }
    }
  }

  private async makeRequest<T>(request: ClaudeRequest): Promise<T> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2024-10-22',
    }
  }
}
