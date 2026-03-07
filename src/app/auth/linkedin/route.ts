import { type NextRequest, NextResponse } from "next/server";
import {
	createRlsServerClient,
	getAppUrl,
	getSafeExtensionId,
	getSafeRedirectPath,
} from "@/src/lib/supabase/auth";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const next = getSafeRedirectPath(searchParams.get("next"));
	const extensionId = getSafeExtensionId(searchParams.get("extensionId"));
	const supabase = await createRlsServerClient();
	const redirectUrl = new URL("/auth/callback", getAppUrl(request.url));
	redirectUrl.searchParams.set("next", next);

	if (extensionId) {
		redirectUrl.searchParams.set("extensionId", extensionId);
	}

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

	return NextResponse.redirect(data.url);
}
