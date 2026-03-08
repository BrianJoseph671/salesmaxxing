// SalesMAXXing Content Script — injected on linkedin.com/*

import { scrollAndExtractConnections } from "./lib/extract-connections";
import { extractProfile } from "./lib/extract-profile";
import {
	isConnectionsPage,
	isProfilePage,
	isSearchPage,
	onPageChange,
} from "./lib/navigation";
import type {
	BackgroundMessage,
	LinkedInConnection,
	LinkedInProfile,
} from "./lib/types";

// biome-ignore lint/suspicious/noConsole: content script logging
console.log("[SalesMAXXing] Content script loaded on LinkedIn");

/**
 * Determine the page type from a URL string.
 */
function getPageType(
	url: string,
): "profile" | "connections" | "search" | "other" {
	if (isProfilePage(url)) return "profile";
	if (isConnectionsPage(url)) return "connections";
	if (isSearchPage(url)) return "search";
	return "other";
}

/**
 * Notify background worker that the page has changed.
 */
function notifyPageChange(url: string): void {
	const pageType = getPageType(url);
	chrome.runtime.sendMessage({ type: "page-changed", url, pageType });
	// biome-ignore lint/suspicious/noConsole: content script logging
	console.log(`[SalesMAXXing] Page changed: ${pageType} — ${url}`);
}

// Set up SPA navigation detection
const cleanupNavListener = onPageChange((url) => {
	notifyPageChange(url);
});

// Send initial page info
notifyPageChange(window.location.href);

// Listen for messages from the background worker
chrome.runtime.onMessage.addListener(
	(
		message: BackgroundMessage,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response: unknown) => void,
	) => {
		if (message.type === "extract-profile") {
			handleExtractProfile(sendResponse);
			return true; // keep channel open for async response
		}

		if (message.type === "extract-connections") {
			handleExtractConnections(sendResponse);
			return true; // keep channel open for async response
		}

		return false;
	},
);

/**
 * Extract profile data from the current page and send it back.
 */
function handleExtractProfile(sendResponse: (response: unknown) => void): void {
	try {
		const profile: LinkedInProfile = extractProfile();
		sendResponse({ profile });
		// biome-ignore lint/suspicious/noConsole: content script logging
		console.log("[SalesMAXXing] Profile extracted:", profile.name);
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: content script logging
		console.error("[SalesMAXXing] Profile extraction failed:", error);
		sendResponse({ error: String(error) });
	}
}

/**
 * Scroll through connections page, send progress updates, and return final result.
 */
function handleExtractConnections(
	sendResponse: (response: unknown) => void,
): void {
	scrollAndExtractConnections((count: number, total: number | null) => {
		// Send progress updates to background worker
		chrome.runtime.sendMessage({
			type: "connections-progress",
			count,
			total,
		});
	})
		.then((connections: LinkedInConnection[]) => {
			sendResponse({ connections });
			// biome-ignore lint/suspicious/noConsole: content script logging
			console.log(
				`[SalesMAXXing] Connections extracted: ${String(connections.length)}`,
			);
		})
		.catch((error: unknown) => {
			// biome-ignore lint/suspicious/noConsole: content script logging
			console.error("[SalesMAXXing] Connections extraction failed:", error);
			sendResponse({ error: String(error) });
		});
}

// Content scripts are torn down with the page, so explicit unload cleanup is unnecessary.
void cleanupNavListener;
