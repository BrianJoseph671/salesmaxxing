import { type NextRequest, NextResponse } from "next/server";

const allowedExtensionOrigins = new Set(
	(process.env.ALLOWED_EXTENSION_ORIGINS ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean),
);

function isAllowedExtensionOrigin(origin: string) {
	if (!origin.startsWith("chrome-extension://")) {
		return false;
	}

	if (process.env.NODE_ENV === "development") {
		return true;
	}

	return allowedExtensionOrigins.has(origin);
}

export function applyExtensionCors(
	request: NextRequest,
	response: NextResponse,
	allowedMethods = "GET,OPTIONS",
) {
	const origin = request.headers.get("origin");

	if (!origin || !isAllowedExtensionOrigin(origin)) {
		return response;
	}

	response.headers.set("Access-Control-Allow-Credentials", "true");
	response.headers.set(
		"Access-Control-Allow-Headers",
		request.headers.get("access-control-request-headers") || "Content-Type",
	);
	response.headers.set("Access-Control-Allow-Methods", allowedMethods);
	response.headers.set("Access-Control-Allow-Origin", origin);
	response.headers.set("Vary", "Origin");

	return response;
}

export function createExtensionPreflightResponse(
	request: NextRequest,
	allowedMethods = "GET,OPTIONS",
) {
	return applyExtensionCors(
		request,
		new NextResponse(null, { status: 204 }),
		allowedMethods,
	);
}
