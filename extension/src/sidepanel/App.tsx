import { useState } from "react";
import type { QualificationConfig, SidePanelView } from "./types";
import { useAuth, useLeads, useQualification } from "./hooks";

// Components created by other agents — imports will resolve after they finish
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ModeSelector } from "./components/ModeSelector";
import { CustomQualForm } from "./components/CustomQualForm";
import { LeadList } from "./components/LeadList";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";

const HAS_COMPLETED_ONBOARDING_KEY = "salesmaxxing_onboarded";

function readOnboardingFlag(): boolean {
	try {
		return localStorage.getItem(HAS_COMPLETED_ONBOARDING_KEY) === "true";
	} catch {
		return false;
	}
}

function writeOnboardingFlag() {
	try {
		localStorage.setItem(HAS_COMPLETED_ONBOARDING_KEY, "true");
	} catch {
		// storage unavailable — ignore
	}
}

export function App() {
	const { user, isLoading: authLoading } = useAuth();
	const { leads, refresh: refreshLeads } = useLeads();
	const { isQualifying, progress, startQualification } = useQualification();

	const initialView: SidePanelView = "loading";
	const [view, setView] = useState<SidePanelView>(initialView);
	const [hasResolved, setHasResolved] = useState(false);

	// Resolve initial view once auth check completes
	if (!hasResolved && !authLoading) {
		setHasResolved(true);

		if (!user) {
			setView("error");
		} else if (readOnboardingFlag()) {
			setView(leads.length > 0 ? "leads" : "empty");
		} else {
			setView("welcome");
		}
	}

	// ── Navigation callbacks ────────────────────────────────────────────────

	function handleWelcomeContinue() {
		setView("mode-select");
	}

	function handleModeSelected(mode: "automatic" | "custom") {
		if (mode === "automatic") {
			writeOnboardingFlag();
			startQualification({
				mode: "automatic",
				keywords: [],
				companyUrls: [],
				icpNotes: "",
				industries: [],
			});
			setView("qualifying");
		} else {
			setView("custom-form");
		}
	}

	function handleCustomFormSubmit(config: QualificationConfig) {
		writeOnboardingFlag();
		startQualification(config);
		setView("qualifying");
	}

	function handleBackToModeSelect() {
		setView("mode-select");
	}

	function handleRetry() {
		setView(user ? "mode-select" : "error");
	}

	function handleRequalify() {
		setView("mode-select");
	}

	// ── Render ──────────────────────────────────────────────────────────────

	function renderView() {
		switch (view) {
			case "loading":
				return <LoadingState message="Checking your session..." />;

			case "welcome":
				return (
					<WelcomeScreen
						user={user}
						onContinue={handleWelcomeContinue}
					/>
				);

			case "mode-select":
				return <ModeSelector onSelect={handleModeSelected} />;

			case "custom-form":
				return (
					<CustomQualForm
						onSubmit={handleCustomFormSubmit}
						onBack={handleBackToModeSelect}
					/>
				);

			case "qualifying":
				return <LoadingState message={progress || "Qualifying..."} />;

			case "leads":
				return (
					<LeadList
						leads={leads}
						onRefresh={refreshLeads}
						onRequalify={handleRequalify}
					/>
				);

			case "empty":
				return (
					<EmptyState
						onRequalify={handleRequalify}
					/>
				);

			case "error":
				return (
					<ErrorState
						message="Sign in to SalesMAXXing from the extension popup to get started."
						onRetry={handleRetry}
					/>
				);

			default:
				return null;
		}
	}

	return (
		<div className="min-h-screen bg-black text-white">
			{renderView()}
		</div>
	);
}
