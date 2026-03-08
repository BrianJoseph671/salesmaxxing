export type Tone = "professional" | "casual" | "mutual_connection";

export type SidePanelView =
	| "loading" // Initial auth check
	| "welcome" // Onboarding: Welcome, [name]
	| "mode-select" // Onboarding: Automatic vs Custom
	| "custom-form" // Custom qualification form
	| "qualifying" // AI qualification in progress
	| "leads" // Lead results
	| "composer" // InMail draft composer
	| "empty" // No leads found
	| "error"; // Error state

export interface UserInfo {
	id: string;
	name: string;
	avatarUrl: string;
	email: string;
	headline?: string;
}

export interface QualifiedLead {
	id: string;
	name: string;
	title: string;
	company: string;
	score: number;
	connectionDegree: string;
	location: string;
	profileUrl: string;
	avatarUrl?: string;
	justification: string;
	keySignals: string[];
	talkingPoints: string[];
	profileHighlights: string[];
}

export interface QualificationConfig {
	mode: "automatic" | "custom";
	keywords: string[];
	companyUrls: string[];
	icpNotes: string;
	industries: string[];
}
