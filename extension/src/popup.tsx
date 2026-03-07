import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type ActiveTabState = {
	id?: number;
	isLinkedIn: boolean;
	url?: string;
};

function Popup() {
	const [activeTab, setActiveTab] = useState<ActiveTabState>({
		isLinkedIn: false,
	});
	const [error, setError] = useState<string | null>(null);
	const [isOpening, setIsOpening] = useState(false);

	useEffect(() => {
		const loadActiveTab = async () => {
			try {
				const [tab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				const url = tab?.url;

				setActiveTab({
					id: tab?.id,
					isLinkedIn: typeof url === "string" && url.includes("linkedin.com"),
					url,
				});
			} catch {
				setError("Could not read the active tab.");
			}
		};

		void loadActiveTab();
	}, []);

	const handlePrimaryAction = async () => {
		setError(null);

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
				AI-powered lead qualification from your LinkedIn network.
			</p>
			<button
				onClick={() => void handlePrimaryAction()}
				style={{
					width: "100%",
					marginTop: 20,
					border: 0,
					borderRadius: 10,
					padding: "12px 14px",
					background: "#fff",
					color: "#000",
					fontSize: 14,
					fontWeight: 700,
					cursor: "pointer",
				}}
				type="button"
			>
				{isOpening
					? "Opening..."
					: activeTab.isLinkedIn
						? "Open Lead Panel"
						: "Open LinkedIn First"}
			</button>
			<p
				style={{
					fontSize: 12,
					color: "#71717a",
					marginTop: 12,
					lineHeight: 1.5,
				}}
			>
				{activeTab.isLinkedIn
					? "Open the side panel on your current LinkedIn tab."
					: "Switch to a LinkedIn tab first. If you are not on LinkedIn, this will open it for you."}
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
