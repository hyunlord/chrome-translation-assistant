function Popup() {
  const openSidePanel = async () => {
    try {
      // Get current tab and open side panel for that specific tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.windowId && tab?.id) {
        // 1. Set tab-specific side panel path with query params
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: `sidepanel.html?windowId=${tab.windowId}&tabId=${tab.id}`,
          enabled: true
        })
        // 2. Open side panel for this specific tab
        await chrome.sidePanel.open({ tabId: tab.id })
      }
    } catch (error) {
      console.error('Failed to open side panel:', error)
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="w-80 p-4 bg-white dark:bg-gray-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Translation Assistant
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Quick Actions
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={openSidePanel}
            className="w-full btn-primary"
          >
            Open Side Panel
          </button>

          <button
            onClick={openOptions}
            className="w-full btn-secondary"
          >
            Settings
          </button>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className="text-green-600 font-medium">Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Popup
