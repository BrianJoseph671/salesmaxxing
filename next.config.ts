import type { NextConfig } from "next";

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
};

export default nextConfig;
