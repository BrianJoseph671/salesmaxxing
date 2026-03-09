import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
	getAutomaticQualificationPrompt,
	getCustomQualificationPrompt,
} from "@/src/lib/ai/prompts";
import { getQualifyModel } from "@/src/lib/ai/provider";
import type { QualifyRequest } from "@/src/lib/ai/schemas";
import {
	qualifyRequestSchema,
	qualifyResponseSchema,
} from "@/src/lib/ai/schemas";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUserFromRequest } from "@/src/lib/supabase/auth";

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
		const user = await getUserFromRequest(request);
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

		const result = await generateObject({
			model: getQualifyModel(),
			system: systemPrompt,
			prompt: userMessage,
			schema: qualifyResponseSchema,
			temperature: 0.3,
		});

		return applyExtensionCors(
			request,
			NextResponse.json(result.object),
			"POST,OPTIONS",
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to qualify connections";
		const status = message.includes("AI provider is not configured")
			? 503
			: 500;

		return applyExtensionCors(
			request,
			NextResponse.json({ error: message }, { status }),
			"POST,OPTIONS",
		);
	}
}
