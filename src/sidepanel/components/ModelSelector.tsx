// Model Selector Component for Side Panel
import { useState, useEffect, useRef } from 'react'
import { OPENROUTER_MODELS } from '../../lib/ai/openrouterProvider'

interface Settings {
  defaultProvider: string
  openrouterModel?: string
  defaultTargetLang?: string
}

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

export function ModelSelector() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [isOpen, setIsOpen] = useState(false)
  const [showModels, setShowModels] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load settings and API keys on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await chrome.storage.local.get(['settings', 'apiKeys'])
        setSettings(result.settings || { defaultProvider: 'claude' })
        setApiKeys(result.apiKeys || {})
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadData()

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.settings) {
        setSettings(changes.settings.newValue)
      }
      if (changes.apiKeys) {
        setApiKeys(changes.apiKeys.newValue || {})
      }
    }

    chrome.storage.local.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowModels(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get providers with valid API keys
  const availableProviders = Object.entries(apiKeys)
    .filter(([, key]) => key && key.length > 0)
    .map(([provider]) => provider)

  // Handle provider selection
  const handleSelectProvider = async (provider: string) => {
    if (!settings) return

    const newSettings = {
      ...settings,
      defaultProvider: provider,
    }

    try {
      await chrome.storage.local.set({ settings: newSettings })
      setSettings(newSettings)

      // Notify background script to update provider
      await chrome.runtime.sendMessage({
        type: 'UPDATE_API_KEY',
        payload: {
          provider,
          apiKey: apiKeys[provider],
        },
      })

      if (provider === 'openrouter') {
        setShowModels(true)
      } else {
        setIsOpen(false)
        setShowModels(false)
      }
    } catch (error) {
      console.error('Failed to update provider:', error)
    }
  }

  // Handle OpenRouter model selection
  const handleSelectModel = async (modelId: string) => {
    if (!settings) return

    const newSettings = {
      ...settings,
      openrouterModel: modelId,
    }

    try {
      await chrome.storage.local.set({ settings: newSettings })
      setSettings(newSettings)

      // Re-register provider with new model
      await chrome.runtime.sendMessage({
        type: 'UPDATE_API_KEY',
        payload: {
          provider: 'openrouter',
          apiKey: apiKeys.openrouter,
          model: modelId,
        },
      })

      setIsOpen(false)
      setShowModels(false)
    } catch (error) {
      console.error('Failed to update model:', error)
    }
  }

  // Open settings page
  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage()
    setIsOpen(false)
  }

  // Get current provider label
  const getCurrentLabel = () => {
    if (!settings) return 'Loading...'

    const provider = settings.defaultProvider
    if (provider === 'openrouter' && settings.openrouterModel) {
      const model = OPENROUTER_MODELS.find((m) => m.id === settings.openrouterModel)
      return model?.name || 'OpenRouter'
    }
    return PROVIDER_LABELS[provider] || provider
  }

  if (availableProviders.length === 0) {
    return (
      <button
        onClick={handleOpenSettings}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        Set up API keys
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span className="max-w-[120px] truncate">{getCurrentLabel()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {!showModels ? (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                Select Provider
              </div>
              <div className="py-1">
                {availableProviders.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => handleSelectProvider(provider)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      settings?.defaultProvider === provider
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{PROVIDER_LABELS[provider] || provider}</span>
                    {settings?.defaultProvider === provider && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {provider === 'openrouter' && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={handleOpenSettings}
                  className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Manage API Keys...
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <button
                  onClick={() => setShowModels(false)}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span>Select Model</span>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {OPENROUTER_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      settings?.openrouterModel === model.id
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="truncate">{model.name}</span>
                    {settings?.openrouterModel === model.id && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
