import { NextResponse } from "next/server";
import { createRlsServerClient } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
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
			return response;
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
		return response;
	} catch {
		const response = NextResponse.json(
			{ error: "Could not load extension session" },
			{ status: 500 },
		);
		response.headers.set("Cache-Control", "no-store");
		return response;
	}
}
