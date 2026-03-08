const APP_URL = "https://salesmaxxing.vercel.app";

export type AuthStatus = {
	appUrl: string;
	isAuthenticated: boolean;
	source: "extension" | "web";
	user: {
		email: string | null;
		id: string;
		name: string | null;
	} | null;
};

export type StoredExtensionSession = {
	accessToken: string;
	appUrl: string;
	expiresAt: number | null;
	expiresIn: number | null;
	refreshToken: string;
	syncedAt: string;
	tokenType: string;
	user: AuthStatus["user"];
};

type ExtensionSessionPayload = {
	session: {
		accessToken: string;
		expiresAt: number | null;
		expiresIn: number | null;
		refreshToken: string;
		tokenType: string;
	};
	user: NonNullable<AuthStatus["user"]>;
};

async function fetchJsonWithTimeout(
	input: string,
	timeoutMs: number,
	init?: RequestInit,
) {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(input, {
			cache: "no-store",
			credentials: "include",
			signal: controller.signal,
			...init,
		});
	} finally {
		window.clearTimeout(timeoutId);
	}
}

function isStoredExtensionSession(
	value: unknown,
): value is StoredExtensionSession {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<StoredExtensionSession>;
	return (
		typeof candidate.accessToken === "string" &&
		typeof candidate.appUrl === "string" &&
		typeof candidate.refreshToken === "string" &&
		typeof candidate.user?.id === "string"
	);
}

function toStoredExtensionSession(
	appUrl: string,
	payload: ExtensionSessionPayload,
): StoredExtensionSession {
	return {
		accessToken: payload.session.accessToken,
		appUrl,
		expiresAt: payload.session.expiresAt,
		expiresIn: payload.session.expiresIn,
		refreshToken: payload.session.refreshToken,
		syncedAt: new Date().toISOString(),
		tokenType: payload.session.tokenType,
		user: payload.user,
	};
}

export async function probeAuthStatus(appUrl = APP_URL): Promise<AuthStatus | null> {
	try {
		const response = await fetchJsonWithTimeout(
			`${appUrl}/api/auth/status`,
			1500,
		);

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as {
			isAuthenticated?: boolean;
			user?: AuthStatus["user"];
		};

		return {
			appUrl,
			isAuthenticated: payload.isAuthenticated === true,
			source: "web",
			user: payload.user ?? null,
		};
	} catch {
		return null;
	}
}

export async function readStoredAuthStatus(): Promise<AuthStatus | null> {
	const { authSession } = await chrome.storage.local.get("authSession");

	if (!isStoredExtensionSession(authSession)) {
		return null;
	}

	if (
		typeof authSession.expiresAt === "number" &&
		authSession.expiresAt * 1000 <= Date.now()
	) {
		await chrome.storage.local.remove("authSession");
		return null;
	}

	return {
		appUrl: authSession.appUrl,
		isAuthenticated: true,
		source: "extension",
		user: authSession.user,
	};
}

export async function syncExtensionSessionFromWeb(
	appUrl = APP_URL,
): Promise<AuthStatus | null> {
	try {
		const response = await fetchJsonWithTimeout(
			`${appUrl}/api/auth/extension-session`,
			2500,
		);

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as ExtensionSessionPayload;
		const authSession = toStoredExtensionSession(appUrl, payload);
		await chrome.storage.local.set({ authSession });

		return {
			appUrl,
			isAuthenticated: true,
			source: "extension",
			user: payload.user,
		};
	} catch {
		return null;
	}
}

export { APP_URL };
