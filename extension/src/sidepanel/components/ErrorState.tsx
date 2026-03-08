export function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
			<div className="mb-4 text-4xl text-red-400">!</div>
			<h2 className="text-base font-semibold text-white">
				Something went wrong
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-zinc-500">{message}</p>
			<button
				type="button"
				onClick={onRetry}
				className="mt-6 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
			>
				Try Again
			</button>
		</div>
	);
}
