// API Key Format Validator
// Pre-validates API key format before making API calls

export interface ApiKeyFormat {
  pattern: RegExp
  example: string
  description: string
}

export const API_KEY_FORMATS: Record<string, ApiKeyFormat> = {
  claude: {
    pattern: /^sk-ant-[a-zA-Z0-9-_]{90,}$/,
    example: 'sk-ant-api03-...',
    description: 'Claude API keys start with "sk-ant-"',
  },
  openai: {
    pattern: /^sk-[a-zA-Z0-9-_]{40,}$/,
    example: 'sk-...',
    description: 'OpenAI API keys start with "sk-"',
  },
  gemini: {
    pattern: /^AIza[a-zA-Z0-9-_]{35}$/,
    example: 'AIza...',
    description: 'Gemini API keys start with "AIza"',
  },
  openrouter: {
    pattern: /^sk-or-[a-zA-Z0-9-_]{40,}$/,
    example: 'sk-or-v1-...',
    description: 'OpenRouter API keys start with "sk-or-"',
  },
}

export interface FormatValidationResult {
  valid: boolean
  error?: string
}

/**
 * Pre-validate API key format before making API call
 * This catches obviously wrong keys early without consuming API quota
 */
export function preValidateApiKey(provider: string, key: string): FormatValidationResult {
  // Check if key is provided
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API key is required' }
  }

  const trimmedKey = key.trim()

  // Get format for provider
  const format = API_KEY_FORMATS[provider]
  if (!format) {
    // Unknown provider, skip format check
    return { valid: true }
  }

  // Check format
  if (!format.pattern.test(trimmedKey)) {
    return {
      valid: false,
      error: `Invalid format. ${format.description}`,
    }
  }

  return { valid: true }
}

/**
 * Get expected format description for a provider
 */
export function getApiKeyFormatHint(provider: string): string | null {
  const format = API_KEY_FORMATS[provider]
  return format ? format.description : null
}

/**
 * Get example API key format for a provider
 */
export function getApiKeyExample(provider: string): string | null {
  const format = API_KEY_FORMATS[provider]
  return format ? format.example : null
}
