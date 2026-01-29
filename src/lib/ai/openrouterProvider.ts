// OpenRouter Provider - Access 100+ AI models through a single API
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationRequest,
  TranslationResponse,
  ChatRequest,
  ChatResponse,
} from './baseProvider'

// Popular OpenRouter models (Updated Jan 2026)
export const OPENROUTER_MODELS = [
  // Free models
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free)' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Free)' },
  { id: 'deepseek/deepseek-v3.2-20251201', name: 'DeepSeek V3.2 (Free)' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Free)' },
  { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast (Free)' },
  { id: 'mistralai/devstral-2512:free', name: 'Devstral (Free)' },
  // Premium models
  { id: 'anthropic/claude-4.5-sonnet-20250929', name: 'Claude 4.5 Sonnet' },
  { id: 'anthropic/claude-4.5-opus-20251124', name: 'Claude 4.5 Opus' },
  { id: 'anthropic/claude-4-sonnet-20250522', name: 'Claude 4 Sonnet' },
  { id: 'openai/gpt-5.2-20251211', name: 'GPT-5.2' },
  { id: 'openai/gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini' },
  { id: 'google/gemini-3-pro-preview-20251117', name: 'Gemini 3 Pro' },
  { id: 'google/gemini-3-flash-preview-20251217', name: 'Gemini 3 Flash' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast' },
  { id: 'qwen/qwen3-coder-480b-a35b-07-25', name: 'Qwen 3 Coder 480B' },
]

export class OpenRouterProvider extends BaseAIProvider {
  private readonly apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions'
  private readonly defaultModel = 'google/gemini-2.5-flash'

  constructor(config: AIProviderConfig) {
    super('openrouter', {
      model: config.model || 'google/gemini-2.5-flash',
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const translatedText = data.choices[0]?.message?.content || ''

      return {
        translatedText,
        sourceLang,
        targetLang: request.targetLang,
        provider: 'openrouter',
        metadata: {
          tokensUsed: data.usage?.total_tokens || 0,
          duration: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('OpenRouter translation error:', error)
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
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
      console.error('OpenRouter chat error:', error)
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
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
            } catch {
              continue
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenRouter streaming error:', error)
      throw error
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Use a free model for validation to avoid costs
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('OpenRouter API key validation failed:', error)
      return false
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://github.com/hyunlord/chrome-translation-assistant',
      'X-Title': 'Translation Assistant',
    }
  }
}
