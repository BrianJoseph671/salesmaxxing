type ExternalAuthMessage = {
	appUrl: string;
	session: {
		accessToken: string;
		expiresAt: number | null;
		expiresIn: number | null;
		refreshToken: string;
		tokenType: string;
	};
	type: "salesmaxxing:auth-session";
	user: {
		email: string | null;
		id: string;
		name: string | null;
	};
};

type StoredExtensionSession = {
	accessToken: string;
	appUrl: string;
	expiresAt: number | null;
	expiresIn: number | null;
	refreshToken: string;
	syncedAt: string;
	tokenType: string;
	user: ExternalAuthMessage["user"];
};

const allowedExternalOrigins = new Set(["https://salesmaxxing.vercel.app"]);
const LINKEDIN_CONNECTIONS_URL =
	"https://www.linkedin.com/mynetwork/invite-connect/connections/";
const TAB_READY_TIMEOUT_MS = 20000;
const MESSAGE_RETRY_DELAY_MS = 400;
const MAX_MESSAGE_ATTEMPTS = 12;

function isExternalAuthMessage(
	message: unknown,
): message is ExternalAuthMessage {
	if (!message || typeof message !== "object") {
		return false;
	}

	const candidate = message as Partial<ExternalAuthMessage>;
	return (
		candidate.type === "salesmaxxing:auth-session" &&
		typeof candidate.appUrl === "string" &&
		typeof candidate.session?.accessToken === "string" &&
		typeof candidate.session?.refreshToken === "string" &&
		typeof candidate.user?.id === "string"
	);
}

function isAllowedSenderUrl(senderUrl: string | undefined) {
	if (!senderUrl) {
		return false;
	}

	try {
		return allowedExternalOrigins.has(new URL(senderUrl).origin);
	} catch {
		return false;
	}
}

function toStoredExtensionSession(
	message: ExternalAuthMessage,
): StoredExtensionSession {
	return {
		accessToken: message.session.accessToken,
		appUrl: message.appUrl,
		expiresAt: message.session.expiresAt,
		expiresIn: message.session.expiresIn,
		refreshToken: message.session.refreshToken,
		syncedAt: new Date().toISOString(),
		tokenType: message.session.tokenType,
		user: message.user,
	};
}

// ---------------------------------------------------------------------------
// Content script message types
// ---------------------------------------------------------------------------

type PageChangedMessage = {
	pageType: "profile" | "connections" | "search" | "other";
	type: "page-changed";
	url: string;
};

type ConnectionsProgressMessage = {
	count: number;
	total: number | null;
	type: "connections-progress";
};

type ContentScriptInternalMessage =
	| ConnectionsProgressMessage
	| PageChangedMessage;

function isContentScriptMessage(
	message: unknown,
): message is ContentScriptInternalMessage {
	if (!message || typeof message !== "object") {
		return false;
	}
	const msg = message as { type?: string };
	return msg.type === "page-changed" || msg.type === "connections-progress";
}

// ---------------------------------------------------------------------------
// Side panel message types (from side panel UI)
// ---------------------------------------------------------------------------

type SidePanelMessage = {
	type: "request-extract-profile" | "request-extract-connections";
};

type ExtractResponse =
	| { error: string }
	| { profile: unknown }
	| { connections: unknown };

function isLinkedInUrl(url: string | undefined): boolean {
	return typeof url === "string" && url.includes("linkedin.com");
}

function isLinkedInProfileUrl(url: string | undefined): boolean {
	if (!url) {
		return false;
	}

	try {
		return /^\/in\/[^/]+\/?$/.test(new URL(url).pathname);
	} catch {
		return false;
	}
}

function isLinkedInConnectionsUrl(url: string | undefined): boolean {
	if (!url) {
		return false;
	}

	try {
		return new URL(url).pathname.startsWith(
			"/mynetwork/invite-connect/connections/",
		);
	} catch {
		return false;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getActiveLinkedInTab(): Promise<chrome.tabs.Tab> {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	const tab = tabs[0];

	if (!tab?.id) {
		throw new Error("No active tab found.");
	}

	if (!isLinkedInUrl(tab.url)) {
		throw new Error("Open LinkedIn in the current tab and try again.");
	}

	return tab;
}

async function waitForTabReady(
	tabId: number,
	urlCheck: (url: string | undefined) => boolean,
): Promise<chrome.tabs.Tab> {
	const existing = await chrome.tabs.get(tabId);
	if (existing.status === "complete" && urlCheck(existing.url)) {
		return existing;
	}

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			chrome.tabs.onUpdated.removeListener(listener);
			reject(new Error("Timed out waiting for LinkedIn to load."));
		}, TAB_READY_TIMEOUT_MS);

		const listener = (
			updatedTabId: number,
			changeInfo: chrome.tabs.TabChangeInfo,
			tab: chrome.tabs.Tab,
		) => {
			if (updatedTabId !== tabId) {
				return;
			}

			if (changeInfo.status === "complete" && urlCheck(tab.url)) {
				clearTimeout(timeout);
				chrome.tabs.onUpdated.removeListener(listener);
				resolve(tab);
			}
		};

		chrome.tabs.onUpdated.addListener(listener);
	});
}

async function updateTabAndWait(
	tabId: number,
	url: string,
	urlCheck: (url: string | undefined) => boolean,
): Promise<chrome.tabs.Tab> {
	await chrome.tabs.update(tabId, { url });
	return waitForTabReady(tabId, urlCheck);
}

async function sendMessageToTabWithRetry<TResponse>(
	tabId: number,
	message: { type: string },
): Promise<TResponse> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < MAX_MESSAGE_ATTEMPTS; attempt += 1) {
		try {
			return (await chrome.tabs.sendMessage(tabId, message)) as TResponse;
		} catch (error) {
			lastError =
				error instanceof Error
					? error
					: new Error("Content script not responding.");
			await sleep(MESSAGE_RETRY_DELAY_MS);
		}
	}

	throw lastError ?? new Error("Content script not responding.");
}

async function getOwnProfileUrlFromTab(tabId: number): Promise<string | null> {
	const response = await sendMessageToTabWithRetry<{
		profileUrl?: string | null;
	}>(tabId, { type: "get-own-profile-url" });
	return typeof response.profileUrl === "string" ? response.profileUrl : null;
}

async function ensureProfileTab(): Promise<chrome.tabs.Tab> {
	const tab = await getActiveLinkedInTab();
	const tabId = tab.id;
	if (!tabId) {
		throw new Error("No active LinkedIn tab found.");
	}

	if (isLinkedInProfileUrl(tab.url)) {
		return tab;
	}

	const profileUrl = await getOwnProfileUrlFromTab(tabId);
	if (!profileUrl) {
		throw new Error(
			"Could not find your LinkedIn profile from the current page. Open your LinkedIn feed or profile and try again.",
		);
	}

	return updateTabAndWait(tabId, profileUrl, isLinkedInProfileUrl);
}

async function ensureConnectionsTab(): Promise<chrome.tabs.Tab> {
	const tab = await getActiveLinkedInTab();
	const tabId = tab.id;
	if (!tabId) {
		throw new Error("No active LinkedIn tab found.");
	}

	if (isLinkedInConnectionsUrl(tab.url)) {
		return tab;
	}

	return updateTabAndWait(
		tabId,
		LINKEDIN_CONNECTIONS_URL,
		isLinkedInConnectionsUrl,
	);
}

async function handleSidePanelExtraction(
	message: SidePanelMessage,
): Promise<ExtractResponse> {
	const tab =
		message.type === "request-extract-profile"
			? await ensureProfileTab()
			: await ensureConnectionsTab();
	const tabId = tab.id;
	if (!tabId) {
		throw new Error("No active LinkedIn tab found.");
	}

	return sendMessageToTabWithRetry<ExtractResponse>(tabId, {
		type:
			message.type === "request-extract-profile"
				? "extract-profile"
				: "extract-connections",
	});
}

function isSidePanelMessage(message: unknown): message is SidePanelMessage {
	if (!message || typeof message !== "object") {
		return false;
	}
	const msg = message as { type?: string };
	return (
		msg.type === "request-extract-profile" ||
		msg.type === "request-extract-connections"
	);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
	// biome-ignore lint/suspicious/noConsole: service worker boot logging
	console.log("[SalesMAXXing] Extension installed");
});

chrome.runtime.onStartup.addListener(() => {
	// biome-ignore lint/suspicious/noConsole: service worker boot logging
	console.log("[SalesMAXXing] Background service worker started");
});

chrome.runtime.onMessageExternal.addListener(
	(message, sender, sendResponse) => {
		if (!isAllowedSenderUrl(sender.url)) {
			sendResponse({
				error: "Rejected external sender.",
				ok: false,
			});
			return false;
		}

		if (!isExternalAuthMessage(message)) {
			sendResponse({
				error: "Rejected invalid auth payload.",
				ok: false,
			});
			return false;
		}

		void chrome.storage.local
			.set({
				authSession: toStoredExtensionSession(message),
			})
			.then(async () => {
				try {
					await chrome.action.openPopup();
					sendResponse({ ok: true });
				} catch {
					sendResponse({ ok: true });
				}
			})
			.catch(() => {
				sendResponse({
					error: "Could not persist the auth session.",
					ok: false,
				});
			});

		return true;
	},
);

// ---------------------------------------------------------------------------
// Internal message routing (content script ↔ side panel)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	// Messages from content script → store state / forward to side panel
	if (isContentScriptMessage(message)) {
		if (message.type === "page-changed") {
			void chrome.storage.local.set({
				currentPage: {
					pageType: message.pageType,
					updatedAt: new Date().toISOString(),
					url: message.url,
				},
			});
			// biome-ignore lint/suspicious/noConsole: message routing logging
			console.log(`[SalesMAXXing] Page: ${message.pageType} — ${message.url}`);
		}

		if (message.type === "connections-progress") {
			// biome-ignore lint/suspicious/noConsole: progress logging
			console.log(
				`[SalesMAXXing] Connections progress: ${String(message.count)}`,
			);
		}

		sendResponse({ ok: true });
		return false;
	}

	// Messages from side panel → forward extraction requests to active LinkedIn tab
	if (isSidePanelMessage(message)) {
		void handleSidePanelExtraction(message)
			.then((response) => {
				sendResponse(response);
			})
			.catch((error: unknown) => {
				sendResponse({
					error:
						error instanceof Error
							? error.message
							: "Could not read the current LinkedIn tab.",
				});
			});

		return true; // async response
	}

	return false;
});
