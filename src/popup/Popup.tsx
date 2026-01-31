function Popup() {
  const openSidePanel = async () => {
    try {
      // Get current tab and window
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('Popup: Current tab info:', tab)

      if (tab?.id && tab?.windowId) {
        console.log('Popup: Setting options for tab', tab.id)
        // 1. Enable the panel for this tab with explicit path (don't await to preserve gesture)
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: 'sidepanel.html',
          enabled: true
        })

        console.log('Popup: Opening panel for window', tab.windowId)
        // 2. Open the panel immediately (user gesture required)
        await chrome.sidePanel.open({ windowId: tab.windowId })
        console.log('Popup: Panel opened successfully')

        // 3. Tell background to track this tab in panelEnabledTabs
        chrome.runtime.sendMessage({
          type: 'TRACK_PANEL_TAB',
          payload: { tabId: tab.id }
        })

        // 4. Close popup
        window.close()
      } else {
        console.error('Popup: No valid tab found', tab)
      }
    } catch (error) {
      console.error('Popup: Failed to open side panel:', error)
      // Show error to user
      alert('Failed to open side panel: ' + (error instanceof Error ? error.message : String(error)))
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
