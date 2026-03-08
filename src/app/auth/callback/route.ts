import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
	getSafeExtensionId,
	getSafeRedirectPath,
	OAUTH_FLOW_COOKIE_NAME,
	parsePendingOAuthState,
} from "@/src/lib/supabase/auth";
import { upsertUserProfile } from "@/src/lib/supabase/user-profiles";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function handleCallback(request: NextRequest, code: string | null) {
	const requestUrl = new URL(request.url);
	const origin = requestUrl.origin;
	const cookieStore = await cookies();
	const pendingOAuthState = parsePendingOAuthState(
		cookieStore.get(OAUTH_FLOW_COOKIE_NAME)?.value,
	);
	const next = getSafeRedirectPath(
		requestUrl.searchParams.get("next") ?? pendingOAuthState?.next,
	);
	const extensionId = getSafeExtensionId(
		requestUrl.searchParams.get("extensionId") ??
			pendingOAuthState?.extensionId,
	);
	const forwardedHost = request.headers.get("x-forwarded-host");
	const isLocalEnv = process.env.NODE_ENV === "development";
	const baseUrl =
		!isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;
	const signInUrl = new URL("/sign-in", baseUrl);
	signInUrl.searchParams.set("next", next);

	if (extensionId) {
		signInUrl.searchParams.set("extensionId", extensionId);
	}

	if (!supabaseUrl || !supabaseAnonKey) {
		signInUrl.searchParams.set("error", "missing_supabase_config");
		return buildRedirectResponse(signInUrl);
	}

	if (code) {
		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Proxy handles refreshes outside route handlers.
					}
				},
			},
		});

		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				signInUrl.searchParams.set("error", "profile_sync_failed");
				return buildRedirectResponse(signInUrl);
			}

			try {
				await upsertUserProfile(supabase, user);
			} catch {
				signInUrl.searchParams.set("error", "profile_sync_failed");
				return buildRedirectResponse(signInUrl);
			}

			if (extensionId) {
				const extensionBridgeUrl = new URL("/extension-auth", baseUrl);
				extensionBridgeUrl.searchParams.set("extensionId", extensionId);
				extensionBridgeUrl.searchParams.set("next", next);

				return buildRedirectResponse(extensionBridgeUrl);
			}

			return buildRedirectResponse(`${baseUrl}${next}`);
		}
	}

	signInUrl.searchParams.set("error", "auth_callback_failed");
	return buildRedirectResponse(signInUrl);
}

function buildRedirectResponse(url: string | URL) {
	const response = NextResponse.redirect(url);
	response.cookies.delete(OAUTH_FLOW_COOKIE_NAME);
	return response;
}

export async function GET(request: NextRequest) {
	const code = new URL(request.url).searchParams.get("code");
	return handleCallback(request, code);
}

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const code = formData.get("code") as string | null;
	return handleCallback(request, code);
}
