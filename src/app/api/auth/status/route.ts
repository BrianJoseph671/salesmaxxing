import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUser } from "@/src/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request);
}

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();
		const response = NextResponse.json({
			isAuthenticated: !!user,
			user: user
				? {
						email: user.email ?? null,
						id: user.id,
						name:
							typeof user.user_metadata?.full_name === "string"
								? user.user_metadata.full_name
								: null,
					}
				: null,
		});

		response.headers.set("Cache-Control", "no-store");
		return applyExtensionCors(request, response);
	} catch {
		const response = NextResponse.json(
			{
				error: "Auth check failed",
				isAuthenticated: false,
			},
			{ status: 500 },
		);

		response.headers.set("Cache-Control", "no-store");
		return applyExtensionCors(request, response);
	}
}
