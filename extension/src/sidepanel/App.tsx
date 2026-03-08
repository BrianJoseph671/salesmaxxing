import { useCallback, useState } from "react";
import { CustomQualForm } from "./components/CustomQualForm";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { InMailComposer } from "./components/InMailComposer";
import { LeadList } from "./components/LeadList";
import { LoadingState } from "./components/LoadingState";
import { ModeSelector } from "./components/ModeSelector";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useAuth, useLeads, useQualification } from "./hooks";
import type {
	QualificationConfig,
	QualifiedLead,
	SidePanelView,
} from "./types";

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

	const [view, setView] = useState<SidePanelView>("loading");
	const [hasResolved, setHasResolved] = useState(false);
	const [composerLead, setComposerLead] = useState<QualifiedLead | null>(null);
	const [qualError, setQualError] = useState<string | null>(null);

	const handleQualificationComplete = useCallback(
		(newLeads: QualifiedLead[]) => {
			refreshLeads();
			setView(newLeads.length > 0 ? "leads" : "empty");
		},
		[refreshLeads],
	);

	const {
		progress,
		error: qualificationError,
		startQualification,
	} = useQualification({ onComplete: handleQualificationComplete });

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

	// If qualification fails, show error
	if (qualificationError && view === "qualifying") {
		setQualError(qualificationError);
		setView("error");
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
		setQualError(null);
		setView(user ? "mode-select" : "error");
	}

	function handleRequalify() {
		setView("mode-select");
	}

	function handleDraftInMail(lead: QualifiedLead) {
		setComposerLead(lead);
		setView("composer");
	}

	function handleBackFromComposer() {
		setComposerLead(null);
		setView("leads");
	}

	// ── Render ──────────────────────────────────────────────────────────────

	function renderView() {
		switch (view) {
			case "loading":
				return <LoadingState message="Checking your session..." />;

			case "welcome":
				if (!user) return null;
				return <WelcomeScreen user={user} onContinue={handleWelcomeContinue} />;

			case "mode-select":
				return (
					<ModeSelector
						onSelectAutomatic={() => handleModeSelected("automatic")}
						onSelectCustom={() => handleModeSelected("custom")}
						onBack={() => setView("welcome")}
					/>
				);

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
						onDraftInMail={handleDraftInMail}
					/>
				);

			case "composer":
				if (!composerLead) return null;
				return (
					<InMailComposer lead={composerLead} onBack={handleBackFromComposer} />
				);

			case "empty":
				return <EmptyState onRequalify={handleRequalify} />;

			case "error":
				return (
					<ErrorState
						message={
							qualError ??
							"Sign in to SalesMAXXing from the extension popup to get started."
						}
						onRetry={handleRetry}
					/>
				);

			default:
				return null;
		}
	}

	return <div className="min-h-screen bg-black text-white">{renderView()}</div>;
}
