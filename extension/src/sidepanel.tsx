import { createRoot } from "react-dom/client";
import { App } from "./sidepanel/App";
import { ErrorBoundary } from "./sidepanel/components/ErrorBoundary";

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<ErrorBoundary>
			<App />
		</ErrorBoundary>,
	);
}
