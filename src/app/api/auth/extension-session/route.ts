import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { createRlsServerClient } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request);
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await createRlsServerClient();
		const [
			{
				data: { session },
			},
			{
				data: { user },
			},
		] = await Promise.all([
			supabase.auth.getSession(),
			supabase.auth.getUser(),
		]);

		if (!session || !user) {
			const response = NextResponse.json(
				{ error: "No active session" },
				{ status: 401 },
			);
			response.headers.set("Cache-Control", "no-store");
			return applyExtensionCors(request, response);
		}

		const response = NextResponse.json({
			session: {
				accessToken: session.access_token,
				expiresAt: session.expires_at ?? null,
				expiresIn: session.expires_in ?? null,
				refreshToken: session.refresh_token,
				tokenType: session.token_type,
			},
			user: {
				email: user.email ?? null,
				id: user.id,
				name:
					typeof user.user_metadata?.full_name === "string"
						? user.user_metadata.full_name
						: null,
			},
		});

		response.headers.set("Cache-Control", "no-store");
		return applyExtensionCors(request, response);
	} catch {
		const response = NextResponse.json(
			{ error: "Could not load extension session" },
			{ status: 500 },
		);
		response.headers.set("Cache-Control", "no-store");
		return applyExtensionCors(request, response);
	}
}
