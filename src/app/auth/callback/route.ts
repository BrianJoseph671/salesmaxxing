import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/src/lib/supabase/auth";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function handleCallback(request: NextRequest, code: string | null) {
	const requestUrl = new URL(request.url);
	const origin = requestUrl.origin;
	const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

	if (!supabaseUrl || !supabaseAnonKey) {
		return NextResponse.redirect(
			`${origin}/sign-in?error=missing_supabase_config`,
		);
	}

	if (code) {
		const cookieStore = await cookies();

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
			const forwardedHost = request.headers.get("x-forwarded-host");
			const isLocalEnv = process.env.NODE_ENV === "development";

			if (isLocalEnv) {
				return NextResponse.redirect(`${origin}${next}`);
			}

			if (forwardedHost) {
				return NextResponse.redirect(`https://${forwardedHost}${next}`);
			}

			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
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
