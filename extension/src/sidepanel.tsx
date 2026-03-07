import { createRoot } from "react-dom/client";

function SidePanel() {
	return (
		<div
			style={{
				padding: 24,
				fontFamily: "system-ui, -apple-system, sans-serif",
				background: "#000",
				color: "#fff",
				minHeight: "100vh",
			}}
		>
			<h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>SalesMAXXing</h1>
			<p style={{ fontSize: 14, color: "#a1a1aa", marginTop: 8 }}>
				Your AI-qualified leads will appear here.
			</p>
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<SidePanel />);
}
