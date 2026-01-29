import { useState, useEffect } from 'react'

interface Settings {
  defaultProvider: 'claude' | 'openai' | 'gemini'
  defaultTargetLang: string
  autoTranslate: boolean
  showTooltip: boolean
  enableSync: boolean
  detectionMode: 'aggressive' | 'balanced' | 'conservative'
  autoTranslateOnLoad: boolean
  excludeCodeBlocks: boolean
  minParagraphLength: number
  maxParagraphLength: number
}

interface ApiKeys {
  claude?: string
  openai?: string
  gemini?: string
}

interface SyncStatus {
  isSignedIn: boolean
  userEmail?: string
  localCount: number
  cloudCount: number
  lastSyncTime?: number
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    defaultProvider: 'claude',
    defaultTargetLang: 'ko',
    autoTranslate: false,
    showTooltip: true,
    enableSync: false,
    detectionMode: 'balanced',
    autoTranslateOnLoad: false,
    excludeCodeBlocks: true,
    minParagraphLength: 100,
    maxParagraphLength: 2000,
  })

  const [apiKeys, setApiKeys] = useState<ApiKeys>({})
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSignedIn: false,
    localCount: 0,
    cloudCount: 0,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSignIn = async () => {
    try {
      const { signInWithGoogle, isFirebaseConfigured } = await import('../lib/firebase')

      if (!isFirebaseConfigured()) {
        showMessage('error', 'Firebase is not configured')
        return
      }

      const user = await signInWithGoogle()
      setSyncStatus((prev) => ({
        ...prev,
        isSignedIn: true,
        userEmail: user.email || undefined,
      }))
      showMessage('success', 'Signed in successfully!')
    } catch (error) {
      console.error('Sign-in error:', error)
      showMessage('error', 'Failed to sign in')
    }
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('../lib/firebase')
      await signOut()
      setSyncStatus({
        isSignedIn: false,
        localCount: 0,
        cloudCount: 0,
      })
      showMessage('success', 'Signed out successfully!')
    } catch (error) {
      console.error('Sign-out error:', error)
      showMessage('error', 'Failed to sign out')
    }
  }

  const handleSync = async () => {
    if (!syncStatus.isSignedIn) {
      showMessage('error', 'Please sign in first')
      return
    }

    setSyncing(true)

    try {
      const { performFullSync } = await import('../lib/firebase')
      const result = await performFullSync()
      showMessage('success', `Synced! Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}`)

      // Refresh sync status
      const { getSyncStatus } = await import('../lib/firebase')
      const status = await getSyncStatus()
      setSyncStatus((prev) => ({
        ...prev,
        ...status,
      }))
    } catch (error) {
      console.error('Sync error:', error)
      showMessage('error', 'Failed to sync')
    } finally {
      setSyncing(false)
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
                    Automatically detect and translate paragraphs on web pages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTranslate}
                  onChange={(e) => setSettings({ ...settings, autoTranslate: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>

              {settings.autoTranslate && (
                <div className="ml-6 space-y-4 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Detection Mode
                    </label>
                    <select
                      value={settings.detectionMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          detectionMode: e.target.value as 'aggressive' | 'balanced' | 'conservative',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="balanced">Balanced - Main content only (Recommended)</option>
                      <option value="aggressive">Aggressive - All text blocks</option>
                      <option value="conservative">Conservative - High confidence only</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Controls how many paragraphs are detected and translated
                    </p>
                  </div>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Auto-translate on page load
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        If unchecked, you'll need to manually trigger translation
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoTranslateOnLoad}
                      onChange={(e) =>
                        setSettings({ ...settings, autoTranslateOnLoad: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Exclude code blocks
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Skip translating code snippets and technical content
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.excludeCodeBlocks}
                      onChange={(e) =>
                        setSettings({ ...settings, excludeCodeBlocks: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>

                  <details className="mt-2">
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary-600">
                      Advanced Settings
                    </summary>
                    <div className="mt-3 space-y-3 pl-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Min paragraph length
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="50"
                            max="500"
                            value={settings.minParagraphLength}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                minParagraphLength: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">characters</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max paragraph length
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="500"
                            max="5000"
                            value={settings.maxParagraphLength}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                maxParagraphLength: parseInt(e.target.value) || 2000,
                              })
                            }
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">characters</span>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

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

          {/* Cloud Sync */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Cloud Sync (Beta)
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sync your translation history across devices using Google account.
              </p>

              {!syncStatus.isSignedIn ? (
                <div>
                  <button
                    onClick={handleSignIn}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {syncStatus.userEmail}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Local: {syncStatus.localCount} | Cloud: {syncStatus.cloudCount}
                      </p>
                      {syncStatus.lastSyncTime && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Last synced: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>

                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full btn-primary"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>

                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Note: Firebase configuration required. See README for setup instructions.
                  </p>
                </div>
              )}
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
