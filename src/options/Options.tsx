import { useState, useEffect } from 'react'

interface Settings {
  defaultProvider: 'claude' | 'openai' | 'gemini'
  defaultTargetLang: string
  autoTranslate: boolean
  showTooltip: boolean
}

interface ApiKeys {
  claude?: string
  openai?: string
  gemini?: string
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    defaultProvider: 'claude',
    defaultTargetLang: 'ko',
    autoTranslate: false,
    showTooltip: true,
  })

  const [apiKeys, setApiKeys] = useState<ApiKeys>({})
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Update current API key when provider changes
  useEffect(() => {
    const key = apiKeys[settings.defaultProvider] || ''
    setCurrentApiKey(key)
  }, [settings.defaultProvider, apiKeys])

  const loadSettings = async () => {
    try {
      const [storedSettings, storedApiKeys] = await Promise.all([
        chrome.storage.local.get('settings'),
        chrome.storage.local.get('apiKeys'),
      ])

      if (storedSettings.settings) {
        setSettings(storedSettings.settings)
      }

      if (storedApiKeys.apiKeys) {
        setApiKeys(storedApiKeys.apiKeys)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showMessage('error', 'Failed to load settings')
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSaveSettings = async () => {
    setSaving(true)

    try {
      // Save settings
      await chrome.storage.local.set({ settings })

      // Save API keys
      const updatedApiKeys = {
        ...apiKeys,
        [settings.defaultProvider]: currentApiKey,
      }
      setApiKeys(updatedApiKeys)
      await chrome.storage.local.set({ apiKeys: updatedApiKeys })

      // Notify background script to update API key
      if (currentApiKey) {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_API_KEY',
          payload: {
            provider: settings.defaultProvider,
            apiKey: currentApiKey,
          },
        })
      }

      showMessage('success', 'Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleValidateApiKey = async () => {
    if (!currentApiKey) {
      showMessage('error', 'Please enter an API key')
      return
    }

    setValidating(true)

    try {
      // Create a temporary provider and validate
      const { createAIProvider } = await import('../lib/ai')
      const provider = createAIProvider(settings.defaultProvider, {
        apiKey: currentApiKey,
      })

      const isValid = await provider.validateApiKey()

      if (isValid) {
        showMessage('success', 'API key is valid!')
      } else {
        showMessage('error', 'Invalid API key')
      }
    } catch (error) {
      console.error('Validation error:', error)
      showMessage('error', 'Failed to validate API key')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your translation assistant
          </p>
        </header>

        {/* Message Toast */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* AI Provider */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              AI Provider
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="claude"
                  checked={settings.defaultProvider === 'claude'}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultProvider: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Claude</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Anthropic's Claude API (Recommended)
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={settings.defaultProvider === 'openai'}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultProvider: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">OpenAI GPT</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ChatGPT API</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={settings.defaultProvider === 'gemini'}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultProvider: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Google Gemini</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Google's Gemini API
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* API Keys */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {settings.defaultProvider === 'claude' && 'Claude API Key'}
                  {settings.defaultProvider === 'openai' && 'OpenAI API Key'}
                  {settings.defaultProvider === 'gemini' && 'Gemini API Key'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={currentApiKey}
                    onChange={(e) => setCurrentApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleValidateApiKey}
                    disabled={validating || !currentApiKey}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {validating ? 'Validating...' : 'Validate'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your API key is stored locally and never shared.
                </p>
                <div className="mt-3 text-sm">
                  <a
                    href={
                      settings.defaultProvider === 'claude'
                        ? 'https://console.anthropic.com/account/keys'
                        : settings.defaultProvider === 'openai'
                          ? 'https://platform.openai.com/api-keys'
                          : 'https://makersuite.google.com/app/apikey'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Get your API key →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Translation Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Language
                </label>
                <select
                  value={settings.defaultTargetLang}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultTargetLang: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ko">Korean (한국어)</option>
                  <option value="en">English</option>
                  <option value="ja">Japanese (日本語)</option>
                  <option value="zh">Chinese (中文)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>

              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Auto-translate paragraphs
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically detect and suggest paragraph translations
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTranslate}
                  onChange={(e) => setSettings({ ...settings, autoTranslate: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Show tooltip on selection
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Display translation tooltip when text is selected
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTooltip}
                  onChange={(e) => setSettings({ ...settings, showTooltip: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options
