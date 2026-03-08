import {
	type CookieOptions,
	createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizeConfiguredValue } from "@/src/lib/env";

const supabaseUrl = normalizeConfiguredValue(
	process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
);
const supabaseAnonKey = normalizeConfiguredValue(
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
);
const appUrl = normalizeConfiguredValue(process.env.NEXT_PUBLIC_APP_URL);

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables for auth");
}

const verifiedSupabaseUrl: string = supabaseUrl;
const verifiedSupabaseAnonKey: string = supabaseAnonKey;
const chromeExtensionIdPattern = /^[a-p]{32}$/;

export function getSafeRedirectPath(
	redirectTo: string | null | undefined,
	fallback = "/",
) {
	if (
		!redirectTo ||
		!redirectTo.startsWith("/") ||
		redirectTo.startsWith("//")
	) {
		return fallback;
	}

	return redirectTo;
}

export function getAppUrl(requestUrl?: string) {
	if (appUrl) {
		return appUrl;
	}

	if (requestUrl) {
		return new URL(requestUrl).origin;
	}

	return "https://salesmaxxing.vercel.app";
}

export function getSafeExtensionId(extensionId: string | null | undefined) {
	if (!extensionId) {
		return null;
	}

	const trimmedExtensionId = extensionId.trim();
	return chromeExtensionIdPattern.test(trimmedExtensionId)
		? trimmedExtensionId
		: null;
}

export async function createRlsServerClient() {
	const cookieStore = await cookies();

	return createSupabaseServerClient(
		verifiedSupabaseUrl,
		verifiedSupabaseAnonKey,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: {
						name: string;
						value: string;
						options?: CookieOptions;
					}[],
				) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Ignore server component write attempts. Route handlers and proxy can persist cookies.
					}
				},
			},
		},
	);
}

export async function getUser() {
	const supabase = await createRlsServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return null;
	}

	return user;
}

/**
 * Get the authenticated user from either cookies (web app) or a Bearer token
 * (Chrome extension). Call this from API routes that serve both contexts.
 */
export async function getUserFromRequest(request: Request) {
	// Try Bearer token first (Chrome extension sends this)
	const authHeader = request.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7);
		const supabase = createSupabaseServerClient(
			verifiedSupabaseUrl,
			verifiedSupabaseAnonKey,
			{
				cookies: {
					getAll() {
						return [];
					},
					setAll() {
						// no-op for token-based auth
					},
				},
				global: {
					headers: { Authorization: `Bearer ${token}` },
				},
			},
		);
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);
		if (!error && user) return user;
	}

	// Fall back to cookie-based auth (web app)
	return getUser();
}
