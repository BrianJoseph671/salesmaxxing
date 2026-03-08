import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUser } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type QualifyMode = "automatic" | "custom";

type UserProfile = {
	name: string;
	headline: string | null;
	about: string | null;
	experience: Array<{
		title: string;
		company: string;
		description: string | null;
	}>;
	skills: string[];
};

type Connection = {
	name: string;
	headline: string | null;
	profileUrl: string;
	avatarUrl: string | null;
};

type CustomCriteria = {
	keywords: string[];
	companyUrls: string[];
	icpNotes: string;
	industryFilters: string[];
};

type QualifyRequest = {
	mode: QualifyMode;
	userProfile: UserProfile;
	connections: Connection[];
	customCriteria?: CustomCriteria;
};

const automaticSystemPrompt = `You are an elite B2B sales qualification engine. Your job is to analyze a sales rep's LinkedIn profile, infer what they sell and who their ideal customer is, then score and rank their LinkedIn connections by fit.

## Your Process

1. **Infer the rep's offering**: From their headline, about section, experience, and skills, determine what product/service/solution they sell, their target market, and their ideal customer profile (ICP).
2. **Score each connection**: For every connection, evaluate how well they match the inferred ICP based on their headline (role, seniority, industry signals).
3. **Rank and return**: Return connections sorted by score (highest first).

## Scoring Criteria (0-100)

- **90-100**: Perfect ICP match. Decision-maker at a target company/industry. Clear budget authority signals.
- **70-89**: Strong fit. Right role or industry, likely has influence over purchasing decisions.
- **50-69**: Moderate fit. Adjacent role or industry. Could be a champion or internal referral.
- **30-49**: Weak fit. Tangential relevance. Might know the right person.
- **0-29**: Poor fit. No meaningful signals for this rep's offering.

## Output Rules

- Output ONLY valid JSON. No markdown, no code fences, no commentary.
- Use this exact schema:

{"leads":[{"name":"string","profileUrl":"string","avatarUrl":"string|null","score":0,"justification":"string","keySignals":["string"],"talkingPoints":["string"]}]}

- Sort leads by score descending.
- justification: 1-2 sentences explaining WHY this score.
- keySignals: 2-4 bullet points about what in their profile indicates fit (role, seniority, industry, company size signals).
- talkingPoints: 2-3 specific conversation starters the rep could use based on the lead's background.
- Be ruthlessly honest in scoring. Most connections will score low. That is fine.`;

const customSystemPrompt = `You are an elite B2B sales qualification engine. You have been given explicit criteria for what makes an ideal customer. Use these criteria to score and rank LinkedIn connections.

## Scoring Criteria (0-100)

Apply the provided custom criteria (keywords, company targets, ICP notes, industry filters) to evaluate each connection:

- **90-100**: Matches multiple criteria strongly. Headline/role contains target keywords, works at or signals target industry, matches ICP notes closely.
- **70-89**: Matches most criteria. Strong keyword or industry match with relevant seniority signals.
- **50-69**: Partial match. Hits some criteria but missing others. Could be adjacent.
- **30-49**: Weak match. Only tangential keyword or industry overlap.
- **0-29**: Does not meaningfully match any provided criteria.

## Output Rules

- Output ONLY valid JSON. No markdown, no code fences, no commentary.
- Use this exact schema:

{"leads":[{"name":"string","profileUrl":"string","avatarUrl":"string|null","score":0,"justification":"string","keySignals":["string"],"talkingPoints":["string"]}]}

- Sort leads by score descending.
- justification: 1-2 sentences explaining WHY this score, referencing which criteria matched.
- keySignals: 2-4 bullet points about what criteria this connection matches.
- talkingPoints: 2-3 specific conversation starters the rep could use.
- Be ruthlessly honest in scoring. If criteria do not match, score low.`;

function buildUserPrompt(req: QualifyRequest): string {
	const repExperience = req.userProfile.experience
		.slice(0, 5)
		.map(
			(e) =>
				`  - ${e.title} at ${e.company}${e.description ? `: ${e.description}` : ""}`,
		)
		.join("\n");

	const repSkills =
		req.userProfile.skills.length > 0
			? `Skills: ${req.userProfile.skills.slice(0, 15).join(", ")}`
			: "";

	const connectionsBlock = req.connections
		.map(
			(c, i) =>
				`${i + 1}. ${c.name} | ${c.headline ?? "No headline"} | ${c.profileUrl} | avatar:${c.avatarUrl ?? "null"}`,
		)
		.join("\n");

	let prompt = `## Sales Rep Profile
Name: ${req.userProfile.name}
Headline: ${req.userProfile.headline ?? "N/A"}
About: ${req.userProfile.about ?? "N/A"}
Experience:
${repExperience || "  N/A"}
${repSkills}

## Connections to Qualify (${req.connections.length} total)
${connectionsBlock}`;

	if (req.mode === "custom" && req.customCriteria) {
		const criteria = req.customCriteria;
		prompt += `

## Custom Qualification Criteria
Keywords: ${criteria.keywords.length > 0 ? criteria.keywords.join(", ") : "None specified"}
Target company URLs: ${criteria.companyUrls.length > 0 ? criteria.companyUrls.join(", ") : "None specified"}
ICP notes: ${criteria.icpNotes || "None specified"}
Industry filters: ${criteria.industryFilters.length > 0 ? criteria.industryFilters.join(", ") : "None specified"}`;
	}

	prompt +=
		"\n\nQualify and score all connections now. Output only the JSON object.";

	return prompt;
}

function isValidMode(mode: unknown): mode is QualifyMode {
	return mode === "automatic" || mode === "custom";
}

function isValidUserProfile(profile: unknown): profile is UserProfile {
	if (!profile || typeof profile !== "object") return false;
	const p = profile as Record<string, unknown>;
	if (typeof p.name !== "string" || p.name.trim().length === 0) return false;
	if (!Array.isArray(p.experience)) return false;
	if (!Array.isArray(p.skills)) return false;
	return true;
}

function isValidConnection(conn: unknown): conn is Connection {
	if (!conn || typeof conn !== "object") return false;
	const c = conn as Record<string, unknown>;
	if (typeof c.name !== "string" || c.name.trim().length === 0) return false;
	if (typeof c.profileUrl !== "string" || c.profileUrl.trim().length === 0)
		return false;
	return true;
}

function isValidCustomCriteria(
	criteria: unknown,
): criteria is CustomCriteria {
	if (!criteria || typeof criteria !== "object") return false;
	const c = criteria as Record<string, unknown>;
	if (!Array.isArray(c.keywords)) return false;
	if (!Array.isArray(c.companyUrls)) return false;
	if (typeof c.icpNotes !== "string") return false;
	if (!Array.isArray(c.industryFilters)) return false;
	return true;
}

function isValidRequest(body: unknown): body is QualifyRequest {
	if (!body || typeof body !== "object") return false;
	const b = body as Record<string, unknown>;

	if (!isValidMode(b.mode)) return false;
	if (!isValidUserProfile(b.userProfile)) return false;

	if (!Array.isArray(b.connections) || b.connections.length === 0)
		return false;
	for (const conn of b.connections) {
		if (!isValidConnection(conn)) return false;
	}

	if (b.mode === "custom") {
		if (!b.customCriteria || !isValidCustomCriteria(b.customCriteria))
			return false;
	}

	return true;
}

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request, "POST,OPTIONS");
}

export async function POST(request: NextRequest) {
	try {
		const user = await getUser();
		if (!user) {
			const response = NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
			return applyExtensionCors(request, response, "POST,OPTIONS");
		}

		const body: unknown = await request.json();
		if (!isValidRequest(body)) {
			const response = NextResponse.json(
				{
					error:
						"Invalid request. Required: mode (automatic|custom), userProfile (name, experience, skills), connections (non-empty array with name and profileUrl). Custom mode also requires customCriteria.",
				},
				{ status: 400 },
			);
			return applyExtensionCors(request, response, "POST,OPTIONS");
		}

		const systemPrompt =
			body.mode === "automatic" ? automaticSystemPrompt : customSystemPrompt;

		const result = streamText({
			model: anthropic("claude-sonnet-4-20250514"),
			system: systemPrompt,
			messages: [
				{
					role: "user",
					content: buildUserPrompt(body),
				},
			],
			maxOutputTokens: 4096,
			temperature: 0.3,
		});

		const response = result.toTextStreamResponse();
		return applyExtensionCors(
			request,
			new NextResponse(response.body, {
				status: response.status,
				headers: response.headers,
			}),
			"POST,OPTIONS",
		);
	} catch {
		const response = NextResponse.json(
			{ error: "Failed to qualify connections" },
			{ status: 500 },
		);
		return applyExtensionCors(request, response, "POST,OPTIONS");
	}
}
