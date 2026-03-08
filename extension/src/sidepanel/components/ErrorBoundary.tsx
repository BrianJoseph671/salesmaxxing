import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

function sanitizeErrorMessage(error: Error | null): string {
	if (!error) {
		return "An unexpected error occurred.";
	}

	const raw = error.message || "";

	// Strip file paths, stack frames, and overly technical internals
	if (raw.length === 0 || raw.includes("\n") || raw.length > 200) {
		return "An unexpected error occurred.";
	}

	return raw;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		// biome-ignore lint/suspicious/noConsole: intentional error logging for debugging
		console.error("[ErrorBoundary]", error, info.componentStack);
	}

	handleReload = () => {
		this.setState({ hasError: false, error: null });
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			const message = sanitizeErrorMessage(this.state.error);

			return (
				<div className="flex flex-col items-center justify-center min-h-screen bg-black px-8 py-16 text-white">
					{/* Icon */}
					<div className="relative mb-6">
						<div className="absolute -inset-3 rounded-2xl bg-red-500/[0.04] blur-lg" />
						<div className="relative size-14 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center">
							<AlertTriangle className="size-6 text-red-400/80" />
						</div>
					</div>

					{/* Text */}
					<h2 className="text-base font-semibold text-white text-center mb-2">
						Something went wrong
					</h2>
					<p className="text-sm text-zinc-400 text-center leading-relaxed max-w-[280px] mb-1.5">
						{message}
					</p>
					<p className="text-xs text-zinc-500 text-center leading-relaxed max-w-[280px] mb-8">
						Reload the panel to try again.
					</p>

					{/* Actions */}
					<div className="flex flex-col items-center gap-3 w-full max-w-[240px]">
						<button
							type="button"
							onClick={this.handleReload}
							className="flex items-center justify-center gap-2 w-full bg-white text-black font-semibold rounded-xl px-5 py-3 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
						>
							<RefreshCw className="size-4" />
							Reload Extension
						</button>

						<a
							href="https://github.com/salesmaxxing/extension/issues"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
						>
							<ExternalLink className="size-3" />
							Report Issue
						</a>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
