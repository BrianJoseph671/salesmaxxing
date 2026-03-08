import { type NextRequest, NextResponse } from "next/server";
import {
	createRlsServerClient,
	getAppUrl,
	getSafeExtensionId,
	getSafeRedirectPath,
	OAUTH_FLOW_COOKIE_NAME,
	serializePendingOAuthState,
} from "@/src/lib/supabase/auth";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const next = getSafeRedirectPath(searchParams.get("next"));
	const extensionId = getSafeExtensionId(searchParams.get("extensionId"));
	const supabase = await createRlsServerClient();
	const redirectUrl = new URL("/auth/callback", getAppUrl(request.url));

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "linkedin_oidc",
		options: {
			redirectTo: redirectUrl.toString(),
		},
	});

	if (error || !data.url) {
		const errorUrl = new URL("/sign-in", request.url);
		errorUrl.searchParams.set("error", "linkedin_oauth_failed");
		errorUrl.searchParams.set("next", next);
		if (extensionId) {
			errorUrl.searchParams.set("extensionId", extensionId);
		}
		return NextResponse.redirect(errorUrl);
	}

	const response = NextResponse.redirect(data.url);
	response.cookies.set({
		httpOnly: true,
		maxAge: 60 * 10,
		name: OAUTH_FLOW_COOKIE_NAME,
		path: "/",
		sameSite: "lax",
		secure: redirectUrl.protocol === "https:",
		value: serializePendingOAuthState({
			extensionId,
			next,
		}),
	});

	return response;
}
