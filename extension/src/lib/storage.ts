import type { LinkedInConnection, LinkedInProfile } from "./types";

// ---------------------------------------------------------------------------
// Stored auth session — mirrors StoredExtensionSession in background.ts
// ---------------------------------------------------------------------------

export type StoredAuthSession = {
	accessToken: string;
	appUrl: string;
	expiresAt: number | null;
	expiresIn: number | null;
	refreshToken: string;
	syncedAt: string;
	tokenType: string;
	user: { email: string | null; id: string; name: string | null };
};

// ---------------------------------------------------------------------------
// Storage keys (single source of truth)
// ---------------------------------------------------------------------------

const KEYS = {
	authSession: "authSession",
	connections: "connections",
	currentPage: "currentPage",
	ownProfile: "ownProfile",
} as const;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLinkedInProfile(value: unknown): value is LinkedInProfile {
	if (!isRecord(value)) return false;
	return (
		typeof value.extractedAt === "string" &&
		Array.isArray(value.experience) &&
		Array.isArray(value.education) &&
		Array.isArray(value.skills)
	);
}

function isLinkedInConnection(value: unknown): value is LinkedInConnection {
	if (!isRecord(value)) return false;
	return (
		typeof value.name === "string" &&
		typeof value.profileUrl === "string" &&
		typeof value.extractedAt === "string"
	);
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
	if (!isRecord(value)) return false;
	return (
		typeof value.accessToken === "string" &&
		typeof value.appUrl === "string" &&
		typeof value.refreshToken === "string" &&
		typeof value.syncedAt === "string" &&
		typeof value.tokenType === "string" &&
		isRecord(value.user) &&
		typeof (value.user as Record<string, unknown>).id === "string"
	);
}

type CurrentPage = { pageType: string; updatedAt: string; url: string };

function isCurrentPage(value: unknown): value is CurrentPage {
	if (!isRecord(value)) return false;
	return (
		typeof value.url === "string" &&
		typeof value.pageType === "string" &&
		typeof value.updatedAt === "string"
	);
}

// ---------------------------------------------------------------------------
// Profile storage
// ---------------------------------------------------------------------------

export async function saveOwnProfile(profile: LinkedInProfile): Promise<void> {
	await chrome.storage.local.set({ [KEYS.ownProfile]: profile });
}

export async function getOwnProfile(): Promise<LinkedInProfile | null> {
	const result = await chrome.storage.local.get(KEYS.ownProfile);
	const value: unknown = result[KEYS.ownProfile];
	return isLinkedInProfile(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Connections storage
// ---------------------------------------------------------------------------

export async function saveConnections(
	connections: LinkedInConnection[],
): Promise<void> {
	await chrome.storage.local.set({ [KEYS.connections]: connections });
}

export async function getConnections(): Promise<LinkedInConnection[] | null> {
	const result = await chrome.storage.local.get(KEYS.connections);
	const value: unknown = result[KEYS.connections];

	if (!Array.isArray(value)) return null;

	const valid = value.filter(isLinkedInConnection);
	return valid.length > 0 ? valid : null;
}

export async function clearConnections(): Promise<void> {
	await chrome.storage.local.remove(KEYS.connections);
}

// ---------------------------------------------------------------------------
// Auth session (read-only typed getter — background.ts owns writes)
// ---------------------------------------------------------------------------

export async function getAuthSession(): Promise<StoredAuthSession | null> {
	const result = await chrome.storage.local.get(KEYS.authSession);
	const value: unknown = result[KEYS.authSession];
	return isStoredAuthSession(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Page state (read-only — background.ts owns writes via page-changed messages)
// ---------------------------------------------------------------------------

export async function getCurrentPage(): Promise<CurrentPage | null> {
	const result = await chrome.storage.local.get(KEYS.currentPage);
	const value: unknown = result[KEYS.currentPage];
	return isCurrentPage(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Clear all cached data
// ---------------------------------------------------------------------------

export async function clearAllData(): Promise<void> {
	await chrome.storage.local.remove(Object.values(KEYS));
}
