export function EmptyState({
	onRequalify,
}: {
	onRequalify: () => void;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
			<div className="mb-4 text-4xl text-zinc-600">&#9672;</div>
			<h2 className="text-base font-semibold text-white">No leads yet</h2>
			<p className="mt-2 text-sm leading-relaxed text-zinc-500">
				Navigate to LinkedIn and run qualification to surface your top leads.
			</p>
			<button
				type="button"
				onClick={onRequalify}
				className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
			>
				Start Qualifying
			</button>
		</div>
	);
}
