import { useCallback, useEffect, useState } from "react";
import type { QualificationConfig, QualifiedLead, UserInfo } from "./types";

// ── Auth ────────────────────────────────────────────────────────────────────

interface AuthState {
	user: UserInfo | null;
	isLoading: boolean;
}

interface StoredSession {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		user_metadata: {
			full_name?: string;
			avatar_url?: string;
			email?: string;
		};
	};
}

function isStoredSession(value: unknown): value is StoredSession {
	if (!value || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	if (typeof v.accessToken !== "string") return false;
	if (!v.user || typeof v.user !== "object") return false;
	const user = v.user as Record<string, unknown>;
	return typeof user.id === "string";
}

function sessionToUserInfo(session: StoredSession): UserInfo {
	const meta = session.user.user_metadata;
	return {
		id: session.user.id,
		name: meta.full_name ?? "LinkedIn User",
		avatarUrl: meta.avatar_url ?? "",
		email: meta.email ?? "",
	};
}

export function useAuth(): AuthState {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function checkAuth() {
			try {
				const result = await chrome.storage.local.get("authSession");
				if (cancelled) return;

				if (isStoredSession(result.authSession)) {
					setUser(sessionToUserInfo(result.authSession));
				} else {
					setUser(null);
				}
			} catch {
				if (!cancelled) setUser(null);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void checkAuth();

		return () => {
			cancelled = true;
		};
	}, []);

	return { user, isLoading };
}

// ── Leads ───────────────────────────────────────────────────────────────────

interface LeadsState {
	leads: QualifiedLead[];
	isLoading: boolean;
	refresh: () => void;
}

export function useLeads(): LeadsState {
	const [leads] = useState<QualifiedLead[]>([]);
	const [isLoading] = useState(false);

	const refresh = useCallback(() => {
		// Will connect to /api/qualify in Milestone 4
	}, []);

	return { leads, isLoading, refresh };
}

// ── Qualification ───────────────────────────────────────────────────────────

interface QualificationState {
	isQualifying: boolean;
	progress: string;
	startQualification: (config: QualificationConfig) => void;
}

export function useQualification(): QualificationState {
	const [isQualifying, setIsQualifying] = useState(false);
	const [progress, setProgress] = useState("");

	const startQualification = useCallback((config: QualificationConfig) => {
		setIsQualifying(true);
		setProgress("Analyzing your connections...");

		// Simulated progress — will be replaced with real API calls
		const steps = [
			{ delay: 800, message: "Reading connection profiles..." },
			{
				delay: 1600,
				message: `Qualifying leads (${config.mode} mode)...`,
			},
			{ delay: 2400, message: "Ranking by relevance..." },
			{ delay: 3200, message: "Generating insights..." },
		];

		for (const step of steps) {
			setTimeout(() => {
				setProgress(step.message);
			}, step.delay);
		}

		setTimeout(() => {
			setIsQualifying(false);
			setProgress("");
		}, 4000);
	}, []);

	return { isQualifying, progress, startQualification };
}
