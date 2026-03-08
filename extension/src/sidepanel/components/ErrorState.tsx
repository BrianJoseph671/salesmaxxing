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

	return (
		<div className="flex flex-col items-center justify-center min-h-full px-8 py-16 animate-fade-in">
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
			<p className="text-sm text-zinc-400 text-center leading-relaxed max-w-[280px] mb-8">
				{content.description}
			</p>

			{/* Actions */}
			<div className="flex flex-col gap-2.5 w-full max-w-[240px]">
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
			</div>
		</div>
	);
}
