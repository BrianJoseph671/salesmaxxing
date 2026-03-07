import { type NextRequest, NextResponse } from "next/server";
import { createRlsServerClient } from "@/src/lib/supabase/auth";

async function handleSignOut(request: NextRequest) {
	const supabase = await createRlsServerClient();

	await supabase.auth.signOut();

	return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: NextRequest) {
	return handleSignOut(request);
}

export async function POST(request: NextRequest) {
	return handleSignOut(request);
}
