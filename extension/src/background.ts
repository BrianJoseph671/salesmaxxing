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

const allowedExternalOrigins = new Set([
	"http://localhost:3000",
	"https://salesmaxxing.vercel.app",
]);

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
			.then(() => {
				sendResponse({ ok: true });
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
