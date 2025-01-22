document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleRefresh');
  
    // Load the current state from storage
    chrome.storage.local.get(['autoRefreshEnabled'], (result) => {
      toggle.checked = Boolean(result.autoRefreshEnabled);
    });
  
    // Listen for changes to the checkbox
    toggle.addEventListener('change', () => {
      const isEnabled = toggle.checked;
      
      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const currentTabId = tabs[0].id;
          
          // Store the state and tabId in storage
          chrome.storage.local.set({ 
            autoRefreshEnabled: isEnabled,
            refreshTabId: currentTabId
          }, () => {
            // Send a message to the background script
            chrome.runtime.sendMessage({ 
              action: isEnabled ? 'enableTimers' : 'disableTimers',
              tabId: currentTabId
            });
          });
        }
      });
    });
  });
  