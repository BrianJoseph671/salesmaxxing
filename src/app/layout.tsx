import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "SalesMAXXing Agent",
	description:
		"AI-powered lead qualification from your LinkedIn network. Any rep can qualify with confidence.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">{children}</body>
		</html>
	);
}
