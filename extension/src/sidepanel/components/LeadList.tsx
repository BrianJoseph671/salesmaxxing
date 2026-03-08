import type { QualifiedLead } from "../types";

export function LeadList({
	leads,
	onRefresh,
	onRequalify,
}: {
	leads: QualifiedLead[];
	onRefresh: () => void;
	onRequalify: () => void;
}) {
	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-5 py-4">
				<div>
					<h1 className="text-lg font-bold text-white">Your Leads</h1>
					<p className="text-xs text-zinc-400">
						{leads.length} qualified lead{leads.length !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onRefresh}
						className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
					>
						Refresh
					</button>
					<button
						type="button"
						onClick={onRequalify}
						className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
					>
						Requalify
					</button>
				</div>
			</div>

			<div className="flex flex-col gap-2 px-4 pb-6">
				{leads.map((lead) => (
					<div
						key={lead.id}
						className="rounded-2xl border border-white/10 bg-white/5 p-4"
					>
						<div className="flex items-start justify-between">
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold text-white">
									{lead.name}
								</p>
								<p className="mt-0.5 truncate text-xs text-zinc-400">
									{lead.title}
									{lead.company ? ` @ ${lead.company}` : ""}
								</p>
							</div>
							<span className="ml-2 shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-500">
								{lead.score}
							</span>
						</div>
						<p className="mt-2 text-xs leading-relaxed text-zinc-500">
							{lead.justification}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
