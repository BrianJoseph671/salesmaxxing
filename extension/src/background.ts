// SalesMAXXing Background Service Worker

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
	if (tab.id) {
		chrome.sidePanel.open({ tabId: tab.id });
	}
});

// biome-ignore lint/suspicious/noConsole: service worker logging
console.log("[SalesMAXXing] Background service worker started");
