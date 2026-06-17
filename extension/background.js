// Therabee EHR Sync - background service worker
//
// Opens the side panel when the user clicks the toolbar action, rather than
// showing a popup.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Therabee EHR Sync installed');
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('sidePanel.setPanelBehavior failed:', error));
