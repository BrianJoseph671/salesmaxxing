// Profile data extracted from LinkedIn DOM
export type LinkedInProfile = {
	name: string | null;
	headline: string | null;
	location: string | null;
	about: string | null;
	profileUrl: string | null;
	avatarUrl: string | null;
	connectionDegree: string | null; // "1st", "2nd", "3rd"
	experience: Array<{
		title: string;
		company: string;
		duration: string | null;
		location: string | null;
		description: string | null;
	}>;
	education: Array<{
		school: string;
		degree: string | null;
		field: string | null;
		years: string | null;
	}>;
	skills: string[];
	extractedAt: string; // ISO timestamp
};

// Connection card from connections page
export type LinkedInConnection = {
	name: string;
	headline: string | null;
	profileUrl: string;
	avatarUrl: string | null;
	extractedAt: string;
};

// Messages between content script <-> background worker
export type ExtractProfileMessage = { type: "extract-profile" };
export type GetOwnProfileUrlMessage = { type: "get-own-profile-url" };
export type ProfileExtractedMessage = {
	type: "profile-extracted";
	profile: LinkedInProfile;
};
export type ExtractConnectionsMessage = { type: "extract-connections" };
export type ConnectionsProgressMessage = {
	type: "connections-progress";
	count: number;
	total: number | null;
};
export type ConnectionsExtractedMessage = {
	type: "connections-extracted";
	connections: LinkedInConnection[];
};

export type ContentScriptMessage =
	| ProfileExtractedMessage
	| ConnectionsProgressMessage
	| ConnectionsExtractedMessage;

export type BackgroundMessage =
	| GetOwnProfileUrlMessage
	| ExtractProfileMessage
	| ExtractConnectionsMessage;
