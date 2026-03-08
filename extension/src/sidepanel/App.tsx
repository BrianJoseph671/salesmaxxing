import { useCallback, useEffect, useState } from "react";
import { CustomQualForm } from "./components/CustomQualForm";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { InMailComposer } from "./components/InMailComposer";
import { LeadList } from "./components/LeadList";
import { LoadingState } from "./components/LoadingState";
import { ModeSelector } from "./components/ModeSelector";
import { ProfileSkeleton } from "./components/Skeletons";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useAuth, useLeads, useQualification } from "./hooks";
import type {
	QualificationConfig,
	QualifiedLead,
	SidePanelView,
} from "./types";

const HAS_COMPLETED_ONBOARDING_KEY = "salesmaxxing_onboarded";
const SIGN_IN_URL = "https://salesmaxxing.vercel.app/sign-in?next=/";

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
	const {
		leads,
		isLoading: leadsLoading,
		refresh: refreshLeads,
		updateLeadStatus,
	} = useLeads();

	const [view, setView] = useState<SidePanelView>("loading");
	const [composerLead, setComposerLead] = useState<QualifiedLead | null>(null);
	const [qualError, setQualError] = useState<string | null>(null);
	const errorType = !user
		? "auth-expired"
		: qualError?.toLowerCase().includes("qualification failed") ||
				qualError?.toLowerCase().includes("ai provider")
			? "api-error"
			: "extraction-failed";

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

	useEffect(() => {
		if (authLoading) {
			setView("loading");
			return;
		}

		if (!user) {
			setView("error");
			return;
		}

		if (leadsLoading && readOnboardingFlag()) {
			setView("loading");
			return;
		}

		setView((currentView) => {
			if (currentView === "custom-form" || currentView === "composer") {
				return currentView;
			}

			if (currentView === "qualifying" && !qualificationError) {
				return currentView;
			}

			if (!readOnboardingFlag()) {
				return "welcome";
			}

			return leads.length > 0 ? "leads" : "empty";
		});
	}, [authLoading, leads.length, leadsLoading, qualificationError, user]);

	useEffect(() => {
		if (!qualificationError) {
			return;
		}

		setQualError(qualificationError);
		setView("error");
	}, [qualificationError]);

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

	function handleSignIn() {
		chrome.tabs.create({ url: SIGN_IN_URL });
	}

	// ── Render ──────────────────────────────────────────────────────────────

	function renderView() {
		switch (view) {
			case "loading":
				return <ProfileSkeleton />;

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
						onUpdateStatus={updateLeadStatus}
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
						message={qualError ?? "Sign in to SalesMAXXing to get started."}
						type={errorType}
						onSignIn={user ? undefined : handleSignIn}
						onRetry={handleRetry}
					/>
				);

			default:
				return null;
		}
	}

	return <div className="min-h-screen bg-black text-white">{renderView()}</div>;
}
