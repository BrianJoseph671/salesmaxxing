import { useCallback, useEffect, useRef, useState } from "react";
import {
	getAuthSession,
	getConnections,
	getOwnProfile,
	type StoredAuthSession,
	saveConnections,
	saveOwnProfile,
} from "../lib/storage";
import type { LinkedInConnection, LinkedInProfile } from "../lib/types";
import type {
	LeadStatus,
	QualificationConfig,
	QualifiedLead,
	UserInfo,
} from "./types";

// ── Auth ────────────────────────────────────────────────────────────────────

interface AuthState {
	user: UserInfo | null;
	isLoading: boolean;
}

function sessionToUserInfo(session: StoredAuthSession): UserInfo {
	return {
		id: session.user.id,
		name: session.user.name ?? session.user.email ?? "LinkedIn User",
		avatarUrl: "",
		email: session.user.email ?? "",
	};
}

export function useAuth(): AuthState {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function syncAuth() {
			try {
				const authSession = await getAuthSession();
				if (cancelled) return;

				if (
					authSession &&
					(typeof authSession.expiresAt !== "number" ||
						authSession.expiresAt * 1000 > Date.now())
				) {
					setUser(sessionToUserInfo(authSession));
				} else {
					setUser(null);
				}
			} catch {
				if (!cancelled) setUser(null);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		function handleStorageChange(
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) {
			if (areaName !== "local" || !("authSession" in changes)) {
				return;
			}

			void syncAuth();
		}

		void syncAuth();
		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => {
			cancelled = true;
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, []);

	return { user, isLoading };
}

// ── Leads ───────────────────────────────────────────────────────────────────

interface LeadsState {
	leads: QualifiedLead[];
	isLoading: boolean;
	refresh: () => void;
	updateLeadStatus: (leadId: string, status: LeadStatus) => void;
}

/** Try fetching leads from Supabase when local storage is empty. */
async function fetchLeadsFromSupabase(
	session: StoredAuthSession,
): Promise<QualifiedLead[] | null> {
	try {
		const response = await fetch(`${session.appUrl}/api/leads`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${session.accessToken}`,
			},
		});
		if (!response.ok) return null;

		const data: unknown = await response.json();
		if (
			!data ||
			typeof data !== "object" ||
			!("leads" in data) ||
			!Array.isArray((data as { leads: unknown }).leads)
		) {
			return null;
		}

		const apiLeads = (data as { leads: Record<string, unknown>[] }).leads;
		if (apiLeads.length === 0) return null;

		return apiLeads.map((lead) => ({
			id: typeof lead.id === "string" ? lead.id : generateId(),
			name: typeof lead.name === "string" ? lead.name : "",
			title: typeof lead.title === "string" ? lead.title : "",
			company: typeof lead.company === "string" ? lead.company : "",
			score: typeof lead.score === "number" ? lead.score : 0,
			connectionDegree:
				typeof lead.connectionDegree === "string"
					? lead.connectionDegree
					: "1st",
			location: typeof lead.location === "string" ? lead.location : "",
			profileUrl:
				typeof lead.profileUrl === "string"
					? lead.profileUrl
					: typeof lead.linkedinUrl === "string"
						? lead.linkedinUrl
						: "",
			avatarUrl:
				typeof lead.avatarUrl === "string" ? lead.avatarUrl : undefined,
			justification:
				typeof lead.justification === "string" ? lead.justification : "",
			keySignals: Array.isArray(lead.keySignals)
				? (lead.keySignals as string[])
				: [],
			talkingPoints: Array.isArray(lead.talkingPoints)
				? (lead.talkingPoints as string[])
				: [],
			profileHighlights: Array.isArray(lead.profileHighlights)
				? (lead.profileHighlights as string[])
				: [],
			status:
				typeof lead.status === "string" ? (lead.status as LeadStatus) : "new",
		}));
	} catch {
		return null;
	}
}

export function useLeads(): LeadsState {
	const [leads, setLeads] = useState<QualifiedLead[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadLeads = useCallback(async () => {
		setIsLoading(true);
		try {
			// 1. Read from chrome.storage (fast, local)
			const result = await chrome.storage.local.get("qualifiedLeads");
			const stored: unknown = result.qualifiedLeads;
			if (Array.isArray(stored) && stored.length > 0) {
				setLeads(stored as QualifiedLead[]);
				setIsLoading(false);
				return;
			}

			// 2. Local storage empty — try fetching from Supabase
			const authSession = await getAuthSession();
			if (authSession) {
				const supabaseLeads = await fetchLeadsFromSupabase(authSession);
				if (supabaseLeads && supabaseLeads.length > 0) {
					// 3. Save to chrome.storage and update state
					await chrome.storage.local.set({
						qualifiedLeads: supabaseLeads,
					});
					setLeads(supabaseLeads);
					setIsLoading(false);
					return;
				}
			}

			setLeads([]);
		} catch {
			setLeads([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadLeads();
	}, [loadLeads]);

	const refresh = useCallback(() => {
		void loadLeads();
	}, [loadLeads]);

	const updateLeadStatus = useCallback((leadId: string, status: LeadStatus) => {
		setLeads((prev) => {
			const updated = prev.map((lead) =>
				lead.id === leadId ? { ...lead, status } : lead,
			);

			// Persist to chrome.storage
			void chrome.storage.local.set({ qualifiedLeads: updated });

			// Fire-and-forget PATCH to Supabase
			void (async () => {
				try {
					const authSession = await getAuthSession();
					if (!authSession) return;
					await fetch(`${authSession.appUrl}/api/leads`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${authSession.accessToken}`,
						},
						body: JSON.stringify({ id: leadId, status }),
					});
				} catch {
					// Non-critical — local state is already updated
				}
			})();

			return updated;
		});
	}, []);

	return { leads, isLoading, refresh, updateLeadStatus };
}

// ── Qualification ───────────────────────────────────────────────────────────

interface QualificationState {
	isQualifying: boolean;
	progress: string;
	error: string | null;
	startQualification: (config: QualificationConfig) => void;
}

interface QualificationOptions {
	onComplete?: (leads: QualifiedLead[]) => void;
}

/** Parse a headline like "VP of Sales at Acme Corp" into { title, company }. */
function parseHeadline(headline: string): { title: string; company: string } {
	const separators = [" at ", " @ ", " | ", " - "];
	for (const sep of separators) {
		const idx = headline.indexOf(sep);
		if (idx > 0) {
			return {
				title: headline.slice(0, idx).trim(),
				company: headline.slice(idx + sep.length).trim(),
			};
		}
	}
	return { title: headline, company: "" };
}

/** Generate a UUID v4 for lead IDs. */
function generateId(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** Resolve the user's LinkedIn profile from storage or via content script extraction. */
async function resolveProfile(
	onProgress: (msg: string) => void,
): Promise<LinkedInProfile> {
	onProgress("Loading your profile...");
	const cached = await getOwnProfile();
	if (cached) return cached;

	onProgress("Extracting your LinkedIn profile...");
	const response = (await chrome.runtime.sendMessage({
		type: "request-extract-profile",
	})) as { profile: LinkedInProfile } | { error: string };

	if ("error" in response) {
		throw new Error(`Profile extraction failed: ${response.error}`);
	}

	await saveOwnProfile(response.profile);
	return response.profile;
}

/** Resolve connections from storage or via content script extraction. */
async function resolveConnections(
	onProgress: (msg: string) => void,
): Promise<LinkedInConnection[]> {
	onProgress("Loading your connections...");
	const cached = await getConnections();
	if (cached && cached.length > 0) return cached;

	onProgress("Extracting connections from LinkedIn...");
	const response = (await chrome.runtime.sendMessage({
		type: "request-extract-connections",
	})) as { connections: LinkedInConnection[] } | { error: string };

	if ("error" in response) {
		throw new Error(`Connections extraction failed: ${response.error}`);
	}

	await saveConnections(response.connections);
	return response.connections;
}

/** Build the /api/qualify request body from profile, connections, and config. */
function buildRequestBody(
	profile: LinkedInProfile,
	connections: LinkedInConnection[],
	config: QualificationConfig,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		mode: config.mode,
		userProfile: {
			name: profile.name,
			headline: profile.headline,
			location: profile.location,
			about: profile.about,
			experience: profile.experience,
			education: profile.education,
			skills: profile.skills,
		},
		connections: connections.map((c) => ({
			name: c.name,
			headline: c.headline,
			profileUrl: c.profileUrl,
			avatarUrl: c.avatarUrl,
		})),
	};

	if (config.mode === "custom") {
		body.customConfig = {
			keywords: config.keywords.length > 0 ? config.keywords : undefined,
			companyUrls:
				config.companyUrls.length > 0 ? config.companyUrls : undefined,
			icpNotes: config.icpNotes || undefined,
			industries: config.industries.length > 0 ? config.industries : undefined,
		};
	}

	return body;
}

/** API lead shape returned by /api/qualify. */
interface ApiLead {
	name: string;
	headline: string;
	profileUrl: string;
	score: number;
	justification: string;
	keySignals: string[];
	talkingPoints: string[];
}

/** Read a streaming fetch response to completion and return the full text. */
async function readStream(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) throw new Error("No response body received.");

	const decoder = new TextDecoder();
	let text = "";

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		text += decoder.decode(value, { stream: true });
	}
	text += decoder.decode();
	return text;
}

/** Map API leads to the side panel QualifiedLead type. */
function mapApiLeads(
	apiLeads: ApiLead[],
	connections: LinkedInConnection[],
): QualifiedLead[] {
	return apiLeads.map((lead) => {
		const { title, company } = parseHeadline(lead.headline);
		const conn = connections.find(
			(c) => c.profileUrl === lead.profileUrl || c.name === lead.name,
		);
		return {
			id: generateId(),
			name: lead.name,
			title,
			company,
			score: lead.score,
			connectionDegree: "1st",
			location: "",
			profileUrl: lead.profileUrl,
			avatarUrl: conn?.avatarUrl ?? undefined,
			justification: lead.justification,
			keySignals: lead.keySignals,
			talkingPoints: lead.talkingPoints,
			profileHighlights: [],
		};
	});
}

/** Persist leads to Supabase via /api/leads. Fire-and-forget. */
async function persistLeadsToSupabase(
	session: StoredAuthSession,
	apiLeads: ApiLead[],
): Promise<void> {
	try {
		await fetch(`${session.appUrl}/api/leads`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${session.accessToken}`,
			},
			body: JSON.stringify({
				leads: apiLeads.map((lead) => ({
					linkedinUrl: lead.profileUrl,
					name: lead.name,
					headline: lead.headline,
					score: lead.score,
					justification: lead.justification,
					keySignals: lead.keySignals,
					talkingPoints: lead.talkingPoints,
				})),
			}),
		});
	} catch {
		// Non-critical — leads are already saved locally in chrome.storage
	}
}

export function useQualification(
	options?: QualificationOptions,
): QualificationState {
	const [isQualifying, setIsQualifying] = useState(false);
	const [progress, setProgress] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Store onComplete in a ref so the callback in startQualification
	// always sees the latest version without re-creating the function.
	const onCompleteRef = useRef(options?.onComplete);
	onCompleteRef.current = options?.onComplete;

	const startQualification = useCallback((config: QualificationConfig) => {
		setIsQualifying(true);
		setError(null);
		setProgress("Preparing qualification...");

		void (async () => {
			try {
				// 1. Authenticate
				setProgress("Checking authentication...");
				const authSession = await getAuthSession();
				if (!authSession) {
					throw new Error(
						"Not authenticated. Please sign in from the extension popup.",
					);
				}

				// 2. Resolve profile and connections
				const profile = await resolveProfile(setProgress);
				const connections = await resolveConnections(setProgress);

				if (connections.length === 0) {
					throw new Error(
						"No connections found. Navigate to your LinkedIn connections page first.",
					);
				}

				// 3. Build and send request
				setProgress(
					`Qualifying ${String(connections.length)} connections (${config.mode} mode)...`,
				);
				const requestBody = buildRequestBody(profile, connections, config);

				setProgress("AI is analyzing your connections...");
				const response = await fetch(`${authSession.appUrl}/api/qualify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authSession.accessToken}`,
					},
					body: JSON.stringify(requestBody),
				});

				if (!response.ok) {
					const errorBody = await response.text().catch(() => "Unknown error");
					throw new Error(
						`Qualification failed (${String(response.status)}): ${errorBody}`,
					);
				}

				// 4. Read streaming response and parse
				setProgress("Receiving AI results...");
				const fullText = await readStream(response);

				setProgress("Processing results...");
				let parsed: { leads: ApiLead[]; summary: string };
				try {
					parsed = JSON.parse(fullText);
				} catch {
					throw new Error("Failed to parse qualification results.");
				}

				if (!Array.isArray(parsed.leads) || parsed.leads.length === 0) {
					await chrome.storage.local.set({ qualifiedLeads: [] });
					setIsQualifying(false);
					setProgress("");
					onCompleteRef.current?.([]);
					return;
				}

				// 5. Map, save locally, and persist to Supabase
				const qualifiedLeads = mapApiLeads(parsed.leads, connections);
				await chrome.storage.local.set({ qualifiedLeads });

				// Fire-and-forget: persist leads to Supabase
				void persistLeadsToSupabase(authSession, parsed.leads);

				setIsQualifying(false);
				setProgress("");
				onCompleteRef.current?.(qualifiedLeads);
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : "An unexpected error occurred.";
				setError(message);
				setIsQualifying(false);
				setProgress("");
			}
		})();
	}, []);

	return { isQualifying, progress, error, startQualification };
}
