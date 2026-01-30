function Popup() {
  const openSidePanel = async () => {
    try {
      // Get current tab and open side panel for that specific tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id && tab?.windowId) {
        // background의 handleOpenSidePanel 사용 (setOptions + open + panelEnabledTabs 추적)
        // popup에서 직접 sidePanel.open() 호출하면 setOptions 없이 열려서 탭 전환 시 문제 발생
        chrome.runtime.sendMessage({
          type: 'OPEN_SIDE_PANEL',
          payload: { windowId: tab.windowId, tabId: tab.id }
        })
        // popup 닫기
        window.close()
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
