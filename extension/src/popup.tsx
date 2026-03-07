import { createRoot } from "react-dom/client";

function Popup() {
	return (
		<div
			style={{
				width: 320,
				padding: 24,
				fontFamily: "system-ui, -apple-system, sans-serif",
				background: "#000",
				color: "#fff",
			}}
		>
			<h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SalesMAXXing</h1>
			<p style={{ fontSize: 14, color: "#a1a1aa", marginTop: 8 }}>
				AI-powered lead qualification from your LinkedIn network.
			</p>
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<Popup />);
}
