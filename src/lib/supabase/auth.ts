import {
	type CookieOptions,
	createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables for auth");
}

const verifiedSupabaseUrl: string = supabaseUrl;
const verifiedSupabaseAnonKey: string = supabaseAnonKey;
const chromeExtensionIdPattern = /^[a-p]{32}$/;

export function getSafeRedirectPath(
	redirectTo: string | null | undefined,
	fallback = "/overview",
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
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}

	if (requestUrl) {
		return new URL(requestUrl).origin;
	}

	return "http://localhost:3000";
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
