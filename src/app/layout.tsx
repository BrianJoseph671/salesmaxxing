import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "SalesMAXXing Agent",
	description:
		"AI-powered lead qualification from your LinkedIn network. Any rep can qualify with confidence.",
	openGraph: {
		title: "SalesMAXXing Agent",
		description: "AI-powered lead qualification from your LinkedIn network.",
		images: [{ url: "/logo.png", width: 1080, height: 1080 }],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth">
			<body className="bg-zinc-950 antialiased">{children}</body>
		</html>
	);
}
