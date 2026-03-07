import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const APP_URL_CANDIDATES = [
	"http://localhost:3000",
	"https://salesmaxxing.vercel.app",
];

type ActiveTabState = {
	id?: number;
	isLinkedIn: boolean;
	url?: string;
};

type AuthStatus = {
	appUrl: string;
	isAuthenticated: boolean;
	user: {
		email: string | null;
		id: string;
		name: string | null;
	} | null;
};

async function fetchJsonWithTimeout(input: string, timeoutMs: number) {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(input, {
			cache: "no-store",
			credentials: "include",
			signal: controller.signal,
		});
	} finally {
		window.clearTimeout(timeoutId);
	}
}

async function probeAuthStatus(appUrl: string): Promise<AuthStatus | null> {
	try {
		const response = await fetchJsonWithTimeout(
			`${appUrl}/api/auth/status`,
			appUrl.startsWith("http://localhost") ? 800 : 1500,
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
			user: payload.user ?? null,
		};
	} catch {
		return null;
	}
}

function Popup() {
	const [activeTab, setActiveTab] = useState<ActiveTabState>({
		isLinkedIn: false,
	});
	const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isOpening, setIsOpening] = useState(false);

	useEffect(() => {
		const loadPopupState = async () => {
			try {
				const [tabs, authCandidates] = await Promise.all([
					chrome.tabs.query({
						active: true,
						currentWindow: true,
					}),
					Promise.all(APP_URL_CANDIDATES.map(probeAuthStatus)),
				]);
				const tab = tabs[0];
				const url = tab?.url;
				const authResult =
					authCandidates.find((candidate) => candidate?.isAuthenticated) ??
					authCandidates.find((candidate) => candidate) ??
					null;

				setActiveTab({
					id: tab?.id,
					isLinkedIn: typeof url === "string" && url.includes("linkedin.com"),
					url,
				});

				setAuthStatus(authResult);
			} catch {
				setError("Could not read the active tab.");
			} finally {
				setIsAuthLoading(false);
			}
		};

		void loadPopupState();
	}, []);

	const handlePrimaryAction = async () => {
		setError(null);

		if (!authStatus?.isAuthenticated) {
			const authUrl = `${authStatus?.appUrl ?? "https://salesmaxxing.vercel.app"}/sign-in?next=%2Foverview`;
			await chrome.tabs.create({ url: authUrl });
			window.close();
			return;
		}

		if (!activeTab.isLinkedIn) {
			await chrome.tabs.create({ url: "https://www.linkedin.com/feed/" });
			window.close();
			return;
		}

		if (!activeTab.id) {
			setError("No active LinkedIn tab was found.");
			return;
		}

		setIsOpening(true);

		try {
			await chrome.sidePanel.open({ tabId: activeTab.id });
			window.close();
		} catch {
			setError(
				"Could not open the side panel. Reload the extension and try again.",
			);
			setIsOpening(false);
		}
	};

	const isAuthenticated = authStatus?.isAuthenticated === true;
	const displayName =
		authStatus?.user?.name ?? authStatus?.user?.email ?? "LinkedIn user";
	const buttonLabel = isAuthLoading
		? "Checking session..."
		: !isAuthenticated
			? "Sign in with LinkedIn"
			: isOpening
				? "Opening..."
				: activeTab.isLinkedIn
					? "Open Lead Panel"
					: "Open LinkedIn";
	const buttonDisabled = isAuthLoading || isOpening;

	return (
		<div
			style={{
				width: 320,
				padding: 24,
				fontFamily: "system-ui, -apple-system, sans-serif",
				background: "#000",
				color: "#fff",
			}}
		>
			<h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SalesMAXXing</h1>
			<p
				style={{
					fontSize: 14,
					color: "#a1a1aa",
					marginTop: 8,
					lineHeight: 1.4,
				}}
			>
				{isAuthLoading
					? "Checking your SalesMAXXing session..."
					: isAuthenticated
						? `Signed in as ${displayName}.`
						: "Sign in once on the web app, then open the LinkedIn side panel here."}
			</p>
			<button
				onClick={() => void handlePrimaryAction()}
				style={{
					width: "100%",
					marginTop: 20,
					border: 0,
					borderRadius: 10,
					padding: "12px 14px",
					background: buttonDisabled ? "#3f3f46" : "#fff",
					color: buttonDisabled ? "#a1a1aa" : "#000",
					fontSize: 14,
					fontWeight: 700,
					cursor: buttonDisabled ? "default" : "pointer",
				}}
				disabled={buttonDisabled}
				type="button"
			>
				{buttonLabel}
			</button>
			<p
				style={{
					fontSize: 12,
					color: "#71717a",
					marginTop: 12,
					lineHeight: 1.5,
				}}
			>
				{isAuthLoading
					? "Waiting for the web app to report your current auth state."
					: isAuthenticated
						? activeTab.isLinkedIn
							? "Open the side panel on your current LinkedIn tab."
							: "You are signed in. Switch to LinkedIn and reopen the panel."
						: "This opens the web app sign-in flow. When you come back, the popup will detect the session automatically."}
			</p>
			{error ? (
				<p
					style={{
						fontSize: 12,
						color: "#f87171",
						marginTop: 12,
						lineHeight: 1.5,
					}}
				>
					{error}
				</p>
			) : null}
			{authStatus?.appUrl ? (
				<p
					style={{
						fontSize: 11,
						color: "#52525b",
						marginTop: 12,
						lineHeight: 1.5,
						wordBreak: "break-all",
					}}
				>
					Auth origin: {authStatus.appUrl}
				</p>
			) : null}
			{activeTab.url ? (
				<p
					style={{
						fontSize: 11,
						color: "#52525b",
						marginTop: 12,
						lineHeight: 1.5,
						wordBreak: "break-all",
					}}
				>
					Active tab: {activeTab.url}
				</p>
			) : null}
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<Popup />);
}
