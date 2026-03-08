import type { NextConfig } from "next";
import { normalizeConfiguredValue } from "./src/lib/env";

const isDev = process.env.NODE_ENV === "development";
const appUrl = normalizeConfiguredValue(process.env.NEXT_PUBLIC_APP_URL);
const supabaseUrl = normalizeConfiguredValue(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
);

const appOrigin = appUrl ? new URL(appUrl).origin : "";
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";

const scriptSources = [
	"'self'",
	"'unsafe-inline'",
	...(isDev ? ["'unsafe-eval'"] : []),
];
const connectSources = [
	"'self'",
	appOrigin,
	supabaseOrigin,
	"https://*.supabase.co",
	"https://vitals.vercel-insights.com",
	"https://vitals.vercel-analytics.com",
].filter(Boolean);

const csp = [
	"default-src 'self'",
	`script-src ${scriptSources.join(" ")}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https:",
	`connect-src ${connectSources.join(" ")}`,
	"font-src 'self' data:",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self' https://www.linkedin.com https://*.supabase.co",
	"frame-ancestors 'none'",
	...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
	reactStrictMode: true,
	compress: true,
	poweredByHeader: false,
	productionBrowserSourceMaps: false,
	images: {
		formats: ["image/avif", "image/webp"],
	},
	experimental: {
		optimizePackageImports: ["@vercel/analytics", "@vercel/speed-insights"],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value: csp,
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-DNS-Prefetch-Control",
						value: "off",
					},
					{
						key: "Permissions-Policy",
						value:
							"accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
				],
			},
		];
	},
};

export default nextConfig;
