export function LoadingState({ message }: { message: string }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
			<div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
			<p className="text-sm text-zinc-400">{message}</p>
		</div>
	);
}
