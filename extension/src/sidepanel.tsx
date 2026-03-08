import { createRoot } from "react-dom/client";
import { App } from "./sidepanel/App";

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(<App />);
}
