import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	APP_URL,
	type AuthStatus,
	probeAuthStatus,
	readStoredAuthStatus,
	syncExtensionSessionFromWeb,
} from "./lib/app-auth";
import { ErrorBoundary } from "./sidepanel/components/ErrorBoundary";

type ActiveTabState = {
	id?: number;
	isLinkedIn: boolean;
	url?: string;
};

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
				const [tabs, webAuthStatus, storedAuthStatus] = await Promise.all([
					chrome.tabs.query({
						active: true,
						currentWindow: true,
					}),
					probeAuthStatus(APP_URL),
					readStoredAuthStatus(),
				]);
				const tab = tabs[0];
				const url = tab?.url;
				let authResult = storedAuthStatus;
				let popupError: string | null = null;

				if (!authResult && webAuthStatus?.isAuthenticated) {
					authResult = await syncExtensionSessionFromWeb(webAuthStatus.appUrl);

					if (!authResult) {
						popupError =
							"SalesMAXXing is signed in on the web, but the extension session is still missing. Return to the SalesMAXXing sign-in tab and let it finish syncing.";
					}
				}

				setActiveTab({
					id: tab?.id,
					isLinkedIn: typeof url === "string" && url.includes("linkedin.com"),
					url,
				});

				setAuthStatus(authResult);
				setError(popupError);
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
			const signInUrl = new URL("/sign-in", authStatus?.appUrl ?? APP_URL);
			signInUrl.searchParams.set("next", "/");
			signInUrl.searchParams.set("extensionId", chrome.runtime.id);
			const authUrl = signInUrl.toString();
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
			if (authStatus.source === "web") {
				const syncedAuthStatus = await syncExtensionSessionFromWeb(
					authStatus.appUrl,
				);

				if (!syncedAuthStatus) {
					setError(
						"SalesMAXXing is signed in on the web, but the extension session has not synced yet. Finish the sign-in tab, then reopen the popup.",
					);
					setIsOpening(false);
					return;
				}

				setAuthStatus(syncedAuthStatus);
			}

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
	const authSourceCopy =
		authStatus?.source === "extension"
			? "Using the session stored in the extension."
			: "Using the current web app session.";
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
						: "This opens the web app sign-in flow. When the callback finishes, SalesMAXXing will sync the session into the extension automatically."}
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
			{isAuthenticated ? (
				<p
					style={{
						fontSize: 11,
						color: "#52525b",
						marginTop: 12,
						lineHeight: 1.5,
					}}
				>
					{authSourceCopy}
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
	createRoot(root).render(
		<ErrorBoundary>
			<Popup />
		</ErrorBoundary>,
	);
}
