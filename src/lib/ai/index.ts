// AI Provider Manager and Factory
import {
  BaseAIProvider,
  AIProviderConfig,
  AIProviderType,
} from './baseProvider'
import { ClaudeProvider } from './claudeProvider'
import { OpenAIProvider } from './openaiProvider'
import { GeminiProvider } from './geminiProvider'

/**
 * Factory function to create AI provider instances
 */
export function createAIProvider(
  type: AIProviderType,
  config: AIProviderConfig
): BaseAIProvider {
  switch (type) {
    case 'claude':
      return new ClaudeProvider(config)

    case 'openai':
      return new OpenAIProvider(config)

    case 'gemini':
      return new GeminiProvider(config)

    default:
      throw new Error(`Unknown AI provider type: ${type}`)
  }
}

/**
 * AI Provider Manager - manages multiple provider instances
 */
export class AIProviderManager {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map()
  private defaultProvider: AIProviderType = 'claude'

  /**
   * Register a provider
   */
  registerProvider(type: AIProviderType, config: AIProviderConfig): void {
    const provider = createAIProvider(type, config)
    this.providers.set(type, provider)
  }

  /**
   * Get provider by type
   */
  getProvider(type?: AIProviderType): BaseAIProvider {
    const providerType = type || this.defaultProvider

    const provider = this.providers.get(providerType)
    if (!provider) {
      throw new Error(`Provider ${providerType} is not registered. Please set up API key in settings.`)
    }

    return provider
  }

  /**
   * Set default provider
   */
  setDefaultProvider(type: AIProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Cannot set default provider: ${type} is not registered`)
    }
    this.defaultProvider = type
  }

  /**
   * Get default provider type
   */
  getDefaultProviderType(): AIProviderType {
    return this.defaultProvider
  }

  /**
   * Check if provider is registered
   */
  hasProvider(type: AIProviderType): boolean {
    return this.providers.has(type)
  }

  /**
   * Remove provider
   */
  removeProvider(type: AIProviderType): void {
    this.providers.delete(type)
  }

  /**
   * Get all registered provider types
   */
  getRegisteredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys())
  }
}

// Re-export types and classes
export { BaseAIProvider } from './baseProvider'
export type {
  AIProviderType,
  AIProviderConfig,
  TranslationRequest,
  TranslationResponse,
  ChatRequest,
  ChatResponse,
  ChatMessage,
} from './baseProvider'

export { ClaudeProvider } from './claudeProvider'
export { OpenAIProvider } from './openaiProvider'
export { GeminiProvider } from './geminiProvider'
