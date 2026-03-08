import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUser } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Tone = "professional" | "casual" | "mutual_connection";

type GenerateIntroRequest = {
	repProfile: {
		name: string;
		headline: string | null;
		company: string | null;
		about: string | null;
		experience: Array<{
			title: string;
			company: string;
			description: string | null;
		}>;
	};
	leadProfile: {
		name: string;
		headline: string | null;
		company: string | null;
		about: string | null;
		location: string | null;
		connectionDegree: string | null;
		experience: Array<{
			title: string;
			company: string;
			description: string | null;
		}>;
		skills: string[];
	};
	qualificationContext: {
		score: number;
		justification: string;
		talkingPoints: string[];
	};
	tone: Tone;
};

const toneInstructions: Record<Tone, string> = {
	professional: `Write in a professional, polished tone. Lead with a specific business reason for reaching out. Be direct about the value proposition while remaining respectful of their time. Use proper salutations.`,
	casual: `Write in a warm, conversational tone as if reaching out to a peer. Keep it friendly and authentic. Avoid corporate jargon. Use a natural, approachable voice that feels like a real person wrote it.`,
	mutual_connection: `Frame the message around shared connections, shared experiences, or common ground. Reference specific mutual interests, overlapping networks, or similar career paths. Make it feel like a natural extension of an existing relationship.`,
};

const systemPrompt = `You are an expert sales copywriter who drafts personalized LinkedIn InMail messages. Your messages get high response rates because they are:

1. **Personal** — Reference specific details from the recipient's profile (role, company, experience, interests). Never use generic templates.
2. **Concise** — 3-5 sentences max. Busy professionals skim messages. Every sentence must earn its place.
3. **Warm** — Sound like a real human, not a sales bot. No "I hope this message finds you well" or "I came across your profile."
4. **Value-first** — Lead with what's relevant to THEM, not what you're selling. Show you understand their world.
5. **Clear CTA** — End with a single, low-friction ask (quick call, coffee chat, sharing a resource). Never ask for multiple things.

Things to AVOID:
- Generic openers ("I noticed your impressive background...")
- Flattery that feels hollow or automated
- Long paragraphs or walls of text
- Mentioning your product/service in the first sentence
- Pushy or aggressive sales language
- Exclamation marks overuse
- Subject lines longer than 6 words

Output ONLY the InMail message. Start with a short subject line on the first line prefixed with "Subject: ", then a blank line, then the message body. Do not include any explanation or meta-commentary.`;

function buildUserPrompt(req: GenerateIntroRequest): string {
	const repExperience = req.repProfile.experience
		.slice(0, 3)
		.map((e) => `  - ${e.title} at ${e.company}`)
		.join("\n");

	const leadExperience = req.leadProfile.experience
		.slice(0, 3)
		.map((e) => `  - ${e.title} at ${e.company}`)
		.join("\n");

	const leadSkills =
		req.leadProfile.skills.length > 0
			? `Skills: ${req.leadProfile.skills.slice(0, 10).join(", ")}`
			: "";

	return `## Sender (the person writing the InMail)
Name: ${req.repProfile.name}
Headline: ${req.repProfile.headline ?? "N/A"}
Company: ${req.repProfile.company ?? "N/A"}
About: ${req.repProfile.about ?? "N/A"}
Recent experience:
${repExperience || "  N/A"}

## Recipient (the lead receiving the InMail)
Name: ${req.leadProfile.name}
Headline: ${req.leadProfile.headline ?? "N/A"}
Company: ${req.leadProfile.company ?? "N/A"}
Location: ${req.leadProfile.location ?? "N/A"}
Connection degree: ${req.leadProfile.connectionDegree ?? "N/A"}
About: ${req.leadProfile.about ?? "N/A"}
Recent experience:
${leadExperience || "  N/A"}
${leadSkills}

## Why this lead was qualified (AI analysis)
Score: ${req.qualificationContext.score}/100
Justification: ${req.qualificationContext.justification}
Talking points:
${req.qualificationContext.talkingPoints.map((tp) => `  - ${tp}`).join("\n")}

## Tone
${toneInstructions[req.tone]}

Write the InMail now.`;
}

function isValidTone(tone: unknown): tone is Tone {
	return (
		tone === "professional" || tone === "casual" || tone === "mutual_connection"
	);
}

function isValidRequest(body: unknown): body is GenerateIntroRequest {
	if (!body || typeof body !== "object") return false;
	const b = body as Record<string, unknown>;
	if (!b.repProfile || typeof b.repProfile !== "object") return false;
	if (!b.leadProfile || typeof b.leadProfile !== "object") return false;
	if (!b.qualificationContext || typeof b.qualificationContext !== "object")
		return false;
	if (!isValidTone(b.tone)) return false;

	const rep = b.repProfile as Record<string, unknown>;
	const lead = b.leadProfile as Record<string, unknown>;
	if (typeof rep.name !== "string" || typeof lead.name !== "string")
		return false;

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
						"Invalid request. Required: repProfile, leadProfile, qualificationContext, tone.",
				},
				{ status: 400 },
			);
			return applyExtensionCors(request, response, "POST,OPTIONS");
		}

		const result = streamText({
			model: anthropic("claude-sonnet-4-20250514"),
			system: systemPrompt,
			messages: [
				{
					role: "user",
					content: buildUserPrompt(body),
				},
			],
			maxOutputTokens: 512,
			temperature: 0.7,
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
			{ error: "Failed to generate intro" },
			{ status: 500 },
		);
		return applyExtensionCors(request, response, "POST,OPTIONS");
	}
}
