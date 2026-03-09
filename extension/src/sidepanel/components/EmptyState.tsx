import { Globe, SearchX, SlidersHorizontal } from "lucide-react";

interface EmptyStateProps {
	onRequalify: () => void;
}

function handleOpenLinkedIn() {
	chrome.tabs.create({
		url: "https://www.linkedin.com/mynetwork/invite-connect/connections/",
	});
}

export function EmptyState({ onRequalify }: EmptyStateProps) {
	return (
		<div className="flex min-h-full flex-col items-center justify-center px-5 py-10 animate-fade-in">
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
			<p className="mb-8 max-w-[22rem] text-center text-sm leading-relaxed text-zinc-400">
				Open your LinkedIn connections page and run qualification to surface
				your best-fit leads.
			</p>

			{/* Actions */}
			<div className="flex w-full flex-col gap-2.5">
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
					Open Connections
				</button>
			</div>
		</div>
	);
}
