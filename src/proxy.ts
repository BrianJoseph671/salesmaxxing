import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/overview"];
const publicAuthPaths = ["/sign-in"];

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function proxy(request: NextRequest) {
	if (!supabaseUrl || !supabaseAnonKey) {
		return NextResponse.next({ request });
	}

	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}

				supabaseResponse = NextResponse.next({ request });

				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const pathname = request.nextUrl.pathname;
	const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

	if (isProtected && !user) {
		const url = request.nextUrl.clone();
		url.pathname = "/sign-in";
		url.searchParams.set("next", pathname);
		return NextResponse.redirect(url);
	}

	const isPublicAuthPath = publicAuthPaths.some((path) =>
		pathname.startsWith(path),
	);

	if (isPublicAuthPath && user) {
		const url = request.nextUrl.clone();
		const extensionId = request.nextUrl.searchParams.get("extensionId");
		const next = request.nextUrl.searchParams.get("next");

		if (extensionId) {
			url.pathname = "/extension-auth";
			url.search = "";
			url.searchParams.set("extensionId", extensionId);

			if (next) {
				url.searchParams.set("next", next);
			}
		} else {
			url.pathname = "/dashboard";
			url.search = "";
		}

		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
