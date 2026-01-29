import { useState } from 'react'

function Options() {
  const [activeProvider, setActiveProvider] = useState<'claude' | 'openai' | 'gemini'>('claude')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your translation assistant
          </p>
        </header>

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
                  checked={activeProvider === 'claude'}
                  onChange={(e) => setActiveProvider(e.target.value as any)}
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
                  checked={activeProvider === 'openai'}
                  onChange={(e) => setActiveProvider(e.target.value as any)}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">OpenAI GPT</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ChatGPT API
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={activeProvider === 'gemini'}
                  onChange={(e) => setActiveProvider(e.target.value as any)}
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
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              API Keys
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {activeProvider === 'claude' && 'Claude API Key'}
                  {activeProvider === 'openai' && 'OpenAI API Key'}
                  {activeProvider === 'gemini' && 'Gemini API Key'}
                </label>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your API key is stored securely and never shared.
                </p>
              </div>
            </div>
          </div>

          {/* Translation Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Translation Settings
            </h2>
            <div className="space-y-4">
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
                  defaultChecked
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options
