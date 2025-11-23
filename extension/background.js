// Background service worker
// Currently not used for active processing to save resources.
// Can be used for context menus or handling events when popup is closed.

chrome.runtime.onInstalled.addListener(() => {
  console.log("OverPage Extension Installed");
});
