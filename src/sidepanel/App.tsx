import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState<'translation' | 'chat' | 'history'>('translation')

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Translation Assistant
        </h1>
      </header>

      {/* Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('translation')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'translation'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Translation
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'translation' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Select text to translate
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Highlight any text on a webpage or PDF to see the translation here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ask questions about your translations and get detailed explanations.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                History
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View your translation and chat history here.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
