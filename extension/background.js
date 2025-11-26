// Background service worker
// Tracks user navigation to provide context for the AI.

const MAX_TRAIL_LENGTH = 5;

chrome.runtime.onInstalled.addListener(() => {
  console.log("OverPage Extension Installed");
  chrome.storage.local.set({ navigationTrail: [] });
});

// Listen for tab updates to track navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    updateNavigationTrail(tab.title, tab.url);
  }
});

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && tab.status === 'complete') {
      updateNavigationTrail(tab.title, tab.url);
    }
  } catch (e) {
    // Tab might be closed or inaccessible
  }
});

async function updateNavigationTrail(title, url) {
  const data = await chrome.storage.local.get('navigationTrail');
  let trail = data.navigationTrail || [];

  // Avoid duplicates at the end of the trail
  if (trail.length > 0 && trail[trail.length - 1].url === url) {
    return;
  }

  trail.push({
    title: title,
    url: url,
    timestamp: new Date().toISOString()
  });

  // Keep only the last N items
  if (trail.length > MAX_TRAIL_LENGTH) {
    trail = trail.slice(-MAX_TRAIL_LENGTH);
  }

  await chrome.storage.local.set({ navigationTrail: trail });
}

// Allow side panel to open on click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

