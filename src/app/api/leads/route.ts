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

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request, "GET,POST,PATCH,OPTIONS");
}

/** GET /api/leads — Fetch the authenticated user's leads, sorted by score. */
export async function GET(request: NextRequest) {
	try {
		const user = await getUserFromRequest(request);
		if (!user) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{ error: "Authentication required" },
					{ status: 401 },
				),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const supabase = await createRlsServerClient();
		const status = request.nextUrl.searchParams.get("status");

		let query = supabase
			.from("leads")
			.select("*")
			.eq("auth_user_id", user.id)
			.order("score", { ascending: false });

		if (status) {
			query = query.eq("status", status);
		}

		const { data, error } = await query;

		if (error) {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 }),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		return applyExtensionCors(
			request,
			NextResponse.json({ leads: data }),
			"GET,POST,PATCH,OPTIONS",
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
			"GET,POST,PATCH,OPTIONS",
		);
	}
}

/** POST /api/leads — Save qualified leads after AI qualification. */
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
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const body = (await request.json()) as {
			leads?: Array<{
				linkedinUrl: string;
				name: string;
				headline: string;
				company?: string;
				score: number;
				justification: string;
				keySignals?: string[];
				talkingPoints?: string[];
				profileData?: Record<string, unknown>;
			}>;
		};

		if (!Array.isArray(body.leads) || body.leads.length === 0) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{ error: "leads array is required and must not be empty" },
					{ status: 400 },
				),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		if (body.leads.length > 50) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{ error: "Maximum 50 leads per request" },
					{ status: 400 },
				),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const supabase = await createRlsServerClient();

		const rows = body.leads.map((lead) => ({
			auth_user_id: user.id,
			linkedin_url: lead.linkedinUrl,
			name: lead.name,
			headline: lead.headline,
			company: lead.company ?? null,
			score: lead.score,
			justification: lead.justification,
			key_signals: lead.keySignals ?? [],
			talking_points: lead.talkingPoints ?? [],
			profile_data: lead.profileData ?? {},
			status: "new",
		}));

		const { data, error } = await supabase.from("leads").insert(rows).select();

		if (error) {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "Failed to save leads" }, { status: 500 }),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		return applyExtensionCors(
			request,
			NextResponse.json({ leads: data }, { status: 201 }),
			"GET,POST,PATCH,OPTIONS",
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
			"GET,POST,PATCH,OPTIONS",
		);
	}
}

/** PATCH /api/leads — Update a lead's status. */
export async function PATCH(request: NextRequest) {
	try {
		const user = await getUserFromRequest(request);
		if (!user) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{ error: "Authentication required" },
					{ status: 401 },
				),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const body = (await request.json()) as {
			id?: string;
			status?: string;
		};

		if (!body.id || typeof body.id !== "string") {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "lead id is required" }, { status: 400 }),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const validStatuses = [
			"new",
			"contacted",
			"replied",
			"qualified",
			"disqualified",
		];
		if (!body.status || !validStatuses.includes(body.status)) {
			return applyExtensionCors(
				request,
				NextResponse.json(
					{
						error: `status must be one of: ${validStatuses.join(", ")}`,
					},
					{ status: 400 },
				),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		const supabase = await createRlsServerClient();

		const { data, error } = await supabase
			.from("leads")
			.update({ status: body.status })
			.eq("id", body.id)
			.eq("auth_user_id", user.id)
			.select()
			.single();

		if (error) {
			return applyExtensionCors(
				request,
				NextResponse.json({ error: "Failed to update lead" }, { status: 500 }),
				"GET,POST,PATCH,OPTIONS",
			);
		}

		return applyExtensionCors(
			request,
			NextResponse.json({ lead: data }),
			"GET,POST,PATCH,OPTIONS",
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
			"GET,POST,PATCH,OPTIONS",
		);
	}
}
