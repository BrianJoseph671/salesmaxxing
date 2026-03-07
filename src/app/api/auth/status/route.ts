import { type NextRequest, NextResponse } from "next/server";
import {
	applyExtensionCors,
	createExtensionPreflightResponse,
} from "@/src/lib/http/cors";
import { getUser } from "@/src/lib/supabase/auth";

export async function OPTIONS(request: NextRequest) {
	return createExtensionPreflightResponse(request);
}

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();

		return applyExtensionCors(
			request,
			NextResponse.json({
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
			}),
		);
	} catch {
		return applyExtensionCors(
			request,
			NextResponse.json(
				{
					error: "Auth check failed",
					isAuthenticated: false,
				},
				{ status: 500 },
			),
		);
	}
}
