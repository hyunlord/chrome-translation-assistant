// Google Gemini Provider
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationRequest,
  TranslationResponse,
  ChatRequest,
  ChatResponse,
  ValidationResult,
} from './baseProvider'

export class GeminiProvider extends BaseAIProvider {
  private readonly apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models'
  private readonly defaultModel = 'gemini-1.5-flash'

  constructor(config: AIProviderConfig) {
    super('gemini', {
      model: config.model || 'gemini-1.5-flash',
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

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

    try {
      const model = this.config.model || this.defaultModel
      const url = `${this.apiEndpoint}/${model}:generateContent?key=${this.config.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      return {
        translatedText,
        sourceLang,
        targetLang: request.targetLang,
        provider: 'gemini',
        metadata: {
          tokensUsed: data.usageMetadata?.totalTokenCount || 0,
          duration: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('Gemini translation error:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Convert messages to Gemini format
      const contents = request.messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))

      const model = this.config.model || this.defaultModel
      const url = `${this.apiEndpoint}/${model}:generateContent?key=${this.config.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        message: {
          role: 'assistant',
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        },
        metadata: {
          tokensUsed: data.usageMetadata?.totalTokenCount || 0,
        },
      }
    } catch (error) {
      console.error('Gemini chat error:', error)
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      const contents = request.messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))

      const model = this.config.model || this.defaultModel
      const url = `${this.apiEndpoint}/${model}:streamGenerateContent?key=${this.config.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
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
          try {
            const parsed = JSON.parse(line)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text

            if (text) {
              yield text
            }
          } catch (e) {
            continue
          }
        }
      }
    } catch (error) {
      console.error('Gemini streaming error:', error)
      throw error
    }
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      const model = this.defaultModel
      const url = `${this.apiEndpoint}/${model}:generateContent?key=${this.config.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Hi' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      })

      if (response.ok) {
        return { valid: true }
      }

      const errorText = await response.text()
      if (response.status === 400 || response.status === 401 || response.status === 403) {
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
}
