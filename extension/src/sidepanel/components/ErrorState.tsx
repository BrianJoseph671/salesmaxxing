import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";

interface ErrorStateProps {
	message: string;
	onRetry: () => void;
	type?: "auth-expired" | "api-error" | "extraction-failed" | "unknown";
	onSignIn?: () => void;
}

function resolveContent(
	type: ErrorStateProps["type"],
	message: string,
): { title: string; description: string } {
	switch (type) {
		case "auth-expired":
			return {
				title: "Session expired",
				description:
					message || "Your session has expired. Please sign in again.",
			};
		case "api-error":
			return {
				title: "Qualification failed",
				description: message || "Failed to qualify leads. Please try again.",
			};
		case "extraction-failed":
			return {
				title: "Extraction error",
				description:
					message ||
					"Could not extract LinkedIn data. Make sure you're on LinkedIn.",
			};
		default:
			return {
				title: "Something went wrong",
				description: message || "An unexpected error occurred.",
			};
	}
}

export function ErrorState({
	message,
	onRetry,
	type = "unknown",
	onSignIn,
}: ErrorStateProps) {
	const content = resolveContent(type, message);
	const showSignIn = type === "auth-expired" && onSignIn;
	const showOpenConnections =
		type === "extraction-failed" ||
		message.toLowerCase().includes("connection") ||
		message.toLowerCase().includes("linkedin");

	function handleOpenConnections() {
		chrome.tabs.create({
			url: "https://www.linkedin.com/mynetwork/invite-connect/connections/",
		});
	}

	return (
		<div className="flex min-h-full flex-col items-center justify-center px-5 py-10 animate-fade-in">
			{/* Icon */}
			<div className="relative mb-6">
				<div className="absolute -inset-3 rounded-2xl bg-red-500/[0.04] blur-lg" />
				<div className="relative size-14 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center">
					<AlertTriangle className="size-6 text-red-400/80" />
				</div>
			</div>

			{/* Text */}
			<h2 className="text-base font-semibold text-white text-center mb-2">
				{content.title}
			</h2>
			<p className="mb-8 max-w-[22rem] text-center text-sm leading-relaxed text-zinc-400">
				{content.description}
			</p>

			{/* Actions */}
			<div className="flex w-full flex-col gap-2.5">
				{showSignIn ? (
					<button
						type="button"
						onClick={onSignIn}
						className="flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl px-5 py-3 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
					>
						<LogIn className="size-4" />
						Sign In
					</button>
				) : (
					<button
						type="button"
						onClick={onRetry}
						className="flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl px-5 py-3 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
					>
						<RefreshCw className="size-4" />
						Try Again
					</button>
				)}
				{showOpenConnections ? (
					<button
						type="button"
						onClick={handleOpenConnections}
						className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition-all duration-200 hover:bg-white/10 active:bg-white/[0.12] cursor-pointer"
					>
						Open Connections
					</button>
				) : null}
			</div>
		</div>
	);
}
