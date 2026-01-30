// OpenAI Provider
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationRequest,
  TranslationResponse,
  ChatRequest,
  ChatResponse,
  ValidationResult,
} from './baseProvider'

export class OpenAIProvider extends BaseAIProvider {
  private readonly apiEndpoint = 'https://api.openai.com/v1/chat/completions'
  private readonly defaultModel = 'gpt-4o'

  constructor(config: AIProviderConfig) {
    super('openai', {
      model: config.model || 'gpt-4o',
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      ...config,
    })
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now()

    const sourceLang = request.sourceLang || (await this.detectLanguage(request.text))

    const systemPrompt = `You are a professional translator. Translate accurately while preserving the original meaning, tone, and style. Provide ONLY the translation without any explanations.`

    const userPrompt = this.buildTranslationPrompt({
      ...request,
      sourceLang,
    })

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model || this.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const translatedText = data.choices[0]?.message?.content || ''

      return {
        translatedText,
        sourceLang,
        targetLang: request.targetLang,
        provider: 'openai',
        metadata: {
          tokensUsed: data.usage?.total_tokens || 0,
          duration: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('OpenAI translation error:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model || this.defaultModel,
          messages: request.messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        message: {
          role: 'assistant',
          content: data.choices[0]?.message?.content || '',
        },
        metadata: {
          tokensUsed: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('OpenAI chat error:', error)
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model || this.defaultModel,
          messages: request.messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        }),
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
              const text = parsed.choices[0]?.delta?.content

              if (text) {
                yield text
              }
            } catch (e) {
              continue
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error)
      throw error
    }
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      })

      if (response.ok) {
        return { valid: true }
      }

      const errorText = await response.text()
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key', errorCode: 'INVALID_KEY' }
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded', errorCode: 'RATE_LIMIT' }
      }

      return { valid: false, error: errorText || 'Validation failed', errorCode: 'INVALID_KEY' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('API key validation failed:', error)

      if (message.includes('fetch') || message.includes('network')) {
        return { valid: false, error: 'Network error - could not connect', errorCode: 'NETWORK_ERROR' }
      }

      return { valid: false, error: message, errorCode: 'NETWORK_ERROR' }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    }
  }
}
