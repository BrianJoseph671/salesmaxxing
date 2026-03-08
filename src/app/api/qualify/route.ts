import { anthropic } from "@ai-sdk/anthropic";
import { Output, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	getAutomaticQualificationPrompt,
	getCustomQualificationPrompt,
} from "@/src/lib/ai/prompts";
import type { QualifyRequest } from "@/src/lib/ai/schemas";
import {
	qualifyRequestSchema,
	qualifyResponseSchema,
} from "@/src/lib/ai/schemas";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUser } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatConnectionsList(request: QualifyRequest): string {
	const connectionsBlock = request.connections
		.map(
			(c, i) =>
				`${i + 1}. ${c.name} | ${c.headline ?? "No headline"} | ${c.profileUrl}`,
		)
		.join("\n");

	return `## Connections to Qualify (${request.connections.length} total)

${connectionsBlock}

Qualify and rank these connections now.`;
}

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request, "POST,OPTIONS");
}

export async function POST(request: NextRequest) {
	try {
		const user = await getUser();
		if (!user) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{ error: "Authentication required" },
					{ status: 401 },
				),
				"POST,OPTIONS",
			);
		}

		const body: unknown = await request.json();
		const parsed = qualifyRequestSchema.safeParse(body);

		if (!parsed.success) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{
						error: "Invalid request body",
						issues: parsed.error.issues.map((i) => i.message),
					},
					{ status: 400 },
				),
				"POST,OPTIONS",
			);
		}

		const data = parsed.data;

		const systemPrompt =
			data.mode === "automatic"
				? getAutomaticQualificationPrompt(data.userProfile)
				: getCustomQualificationPrompt(
						data.userProfile,
						data.customConfig ?? {},
					);

		const userMessage = formatConnectionsList(data);

		const result = streamText({
			model: anthropic("claude-sonnet-4-20250514"),
			system: systemPrompt,
			prompt: userMessage,
			output: Output.object({ schema: qualifyResponseSchema }),
			temperature: 0.3,
		});

		const streamResponse = result.toTextStreamResponse();

		return applyExtensionCors(
			request,
			new NextResponse(streamResponse.body, {
				status: streamResponse.status,
				headers: streamResponse.headers,
			}),
			"POST,OPTIONS",
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json(
				{ error: "Failed to qualify connections" },
				{ status: 500 },
			),
			"POST,OPTIONS",
		);
	}
}
