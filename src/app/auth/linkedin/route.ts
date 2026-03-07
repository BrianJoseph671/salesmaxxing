import { type NextRequest, NextResponse } from "next/server";
import {
	createRlsServerClient,
	getAppUrl,
	getSafeRedirectPath,
} from "@/src/lib/supabase/auth";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const next = getSafeRedirectPath(searchParams.get("next"));
	const supabase = await createRlsServerClient();
	const redirectTo = `${getAppUrl(request.url)}/auth/callback?next=${encodeURIComponent(next)}`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "linkedin_oidc",
		options: {
			redirectTo,
		},
	});

	if (error || !data.url) {
		const errorUrl = new URL("/sign-in", request.url);
		errorUrl.searchParams.set("error", "linkedin_oauth_failed");
		errorUrl.searchParams.set("next", next);
		return NextResponse.redirect(errorUrl);
	}

	return NextResponse.redirect(data.url);
}
