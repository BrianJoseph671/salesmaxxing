import { Globe, SearchX, SlidersHorizontal } from "lucide-react";

interface EmptyStateProps {
	onRequalify: () => void;
}

function handleOpenLinkedIn() {
	chrome.tabs.create({ url: "https://www.linkedin.com/mynetwork/" });
}

export function EmptyState({ onRequalify }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-full px-8 py-16 animate-fade-in">
			{/* Icon */}
			<div className="relative mb-6">
				<div className="absolute -inset-3 rounded-2xl bg-white/[0.03] blur-lg" />
				<div className="relative size-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
					<SearchX className="size-6 text-zinc-500" />
				</div>
			</div>

			{/* Text */}
			<h2 className="text-base font-semibold text-white text-center mb-2">
				No leads yet
			</h2>
			<p className="text-sm text-zinc-400 text-center leading-relaxed max-w-[260px] mb-8">
				Navigate to LinkedIn and run qualification to surface your top leads
				from your network.
			</p>

			{/* Actions */}
			<div className="flex flex-col gap-2.5 w-full max-w-[240px]">
				<button
					type="button"
					onClick={onRequalify}
					className="flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl px-5 py-3 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
				>
					<SlidersHorizontal className="size-4" />
					Start Qualifying
				</button>
				<button
					type="button"
					onClick={handleOpenLinkedIn}
					className="flex items-center justify-center gap-2 bg-white/10 text-white font-medium rounded-xl px-5 py-3 hover:bg-white/20 active:bg-white/25 transition-all duration-200 cursor-pointer"
				>
					<Globe className="size-4" />
					Open LinkedIn
				</button>
			</div>
		</div>
	);
}
