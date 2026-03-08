import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import {
	createRlsServerClient,
	getUserFromRequest,
} from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = "POST,OPTIONS";

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request, ALLOWED_METHODS);
}

/** POST /api/intros — Save a generated intro message. */
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
				ALLOWED_METHODS,
			);
		}

		const body = (await request.json()) as {
			leadName?: string;
			leadProfileUrl?: string;
			message?: string;
			tone?: string;
		};

		if (!body.message || typeof body.message !== "string") {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "message is required" }, { status: 400 }),
				ALLOWED_METHODS,
			);
		}

		if (!body.tone || typeof body.tone !== "string") {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "tone is required" }, { status: 400 }),
				ALLOWED_METHODS,
			);
		}

		if (!body.leadName || typeof body.leadName !== "string") {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "leadName is required" }, { status: 400 }),
				ALLOWED_METHODS,
			);
		}

		const supabase = await createRlsServerClient();

		const { data, error } = await supabase
			.from("intros")
			.insert({
				auth_user_id: user.id,
				lead_name: body.leadName,
				lead_profile_url: body.leadProfileUrl ?? null,
				tone: body.tone,
				message_body: body.message,
			})
			.select()
			.single();

		if (error) {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "Failed to save intro" }, { status: 500 }),
				ALLOWED_METHODS,
			);
		}

		return applyExtensionCors(
			request,
			NextResponse.json({ intro: data }, { status: 201 }),
			ALLOWED_METHODS,
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
			ALLOWED_METHODS,
		);
	}
}
