// Track the current active tab that we're refreshing
let currentTabId = null;

// Store the tabId for which auto-refresh is enabled
let refreshTabId = null;

// Generate random interval between 30s and 60s (in minutes for chrome.alarms)
function getRandomIntervalInMinutes() {
  const ms = Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000; // 30–60s in ms
  return ms / 1000 / 60; // convert ms to minutes (0.5–1.0)
}

// Creates an alarm for the specified tabId
function createAlarmForActiveTab(tabId) {
  // Clear any prior alarm for this tab
  chrome.alarms.clear(`refresh-${tabId}`, () => {
    currentTabId = tabId;
    chrome.alarms.create(`refresh-${tabId}`, {
      delayInMinutes: getRandomIntervalInMinutes()
    });
  });
}

// Clears the alarm for the specified tabId
function clearActiveTabAlarm() {
  if (refreshTabId !== null) {
    chrome.alarms.clear(`refresh-${refreshTabId}`, () => {
      currentTabId = null;
    });
  }
}

// Listen for the alarm event
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === `refresh-${refreshTabId}`) {
    // 1) Check if auto-refresh is still enabled
    chrome.storage.local.get(['autoRefreshEnabled'], (res) => {
      if (!res.autoRefreshEnabled) {
        // If disabled, clear everything
        clearActiveTabAlarm();
        return;
      }

      // If we have a valid refreshTabId, reload that tab
      if (refreshTabId !== null) {
        chrome.tabs.reload(refreshTabId, () => {
          // After reload, schedule the next one
          createAlarmForActiveTab(refreshTabId);
        });
      }
    });
  }
});

// When the extension is installed, default autoRefreshEnabled to false
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ autoRefreshEnabled: false });
});

// When user toggles auto-refresh in the popup, either set an alarm or clear it
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.autoRefreshEnabled) {
    if (changes.autoRefreshEnabled.newValue === true) {
      // Turned ON: set an alarm for the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          refreshTabId = tabs[0].id;
          createAlarmForActiveTab(refreshTabId);
        }
      });
    } else {
      // Turned OFF
      clearActiveTabAlarm();
      refreshTabId = null;
    }
  }
});
