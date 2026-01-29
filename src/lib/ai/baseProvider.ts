// Base AI Provider Interface
export interface TranslationRequest {
  text: string
  sourceLang?: string
  targetLang: string
  context?: {
    url?: string
    title?: string
    surroundingText?: string
  }
}

export interface TranslationResponse {
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: AIProviderType
  metadata?: {
    tokensUsed?: number
    cost?: number
    duration?: number
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  context?: {
    translationId?: string
    relatedText?: string
  }
  stream?: boolean
}

export interface ChatResponse {
  message: ChatMessage
  metadata?: {
    tokensUsed?: number
    cost?: number
  }
}

export type AIProviderType = 'claude' | 'openai' | 'gemini' | 'openrouter'

export interface AIProviderConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Abstract base class for AI providers
 * All AI providers must extend this class
 */
export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  protected readonly providerType: AIProviderType

  constructor(providerType: AIProviderType, config: AIProviderConfig) {
    this.providerType = providerType
    this.config = config

    if (!config.apiKey) {
      throw new Error(`API key is required for ${providerType}`)
    }
  }

  /**
   * Translate text from source to target language
   */
  abstract translate(request: TranslationRequest): Promise<TranslationResponse>

  /**
   * Send chat message and get response
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>

  /**
   * Stream chat response (optional, not all providers may support)
   */
  async *chatStream(
    request: ChatRequest
  ): AsyncGenerator<string, void, unknown> {
    // Default implementation: fall back to non-streaming
    const response = await this.chat({ ...request, stream: false })
    yield response.message.content
  }

  /**
   * Detect language of given text
   */
  async detectLanguage(text: string): Promise<string> {
    // Default implementation using translation API
    // Can be overridden by specific providers
    try {
      const prompt = `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., 'en', 'ko', 'ja', 'zh', 'es', etc.):\n\n${text.substring(0, 500)}`

      const response = await this.chat({
        messages: [{ role: 'user', content: prompt }],
      })

      return response.message.content.trim().toLowerCase()
    } catch (error) {
      console.error('Language detection failed:', error)
      return 'en' // Default to English
    }
  }

  /**
   * Get provider type
   */
  getProviderType(): AIProviderType {
    return this.providerType
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Validate API key
   */
  abstract validateApiKey(): Promise<boolean>

  /**
   * Build system prompt for translation
   */
  protected buildTranslationPrompt(request: TranslationRequest): string {
    const { text, sourceLang, targetLang, context } = request

    let prompt = `Translate the following text from ${sourceLang || 'detected language'} to ${targetLang}.\n\n`

    if (context?.surroundingText) {
      prompt += `Context (for reference only, do not translate):\n${context.surroundingText}\n\n`
    }

    prompt += `Text to translate:\n${text}\n\n`
    prompt += `Provide ONLY the translation without any explanations or additional text.`

    return prompt
  }

  /**
   * Build system prompt for explanation
   */
  protected buildExplanationPrompt(text: string, targetLang: string): string {
    return `Explain the following text in ${targetLang}. Include:\n1. Translation\n2. Key vocabulary and grammar points\n3. Cultural or contextual notes if relevant\n\nText:\n${text}`
  }
}

/**
 * Provider factory
 */
export interface AIProviderFactory {
  createProvider(
    type: AIProviderType,
    config: AIProviderConfig
  ): BaseAIProvider
}
