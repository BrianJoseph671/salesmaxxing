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
		const extractType =
			message.type === "request-extract-profile"
				? "extract-profile"
				: "extract-connections";

		void chrome.tabs
			.query({ active: true, currentWindow: true })
			.then((tabs) => {
				const tab = tabs[0];
				if (!tab?.id) {
					sendResponse({ error: "No active tab found." });
					return;
				}

				void chrome.tabs
					.sendMessage(tab.id, { type: extractType })
					.then((response: unknown) => {
						sendResponse(response);
					})
					.catch(() => {
						sendResponse({
							error: "Content script not responding.",
						});
					});
			});

		return true; // async response
	}

	return false;
});
