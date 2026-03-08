import clsx from "clsx";
import { RefreshCw, SlidersHorizontal, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { LeadStatus, QualifiedLead } from "../types";
import { LeadCard } from "./LeadCard";

interface LeadListProps {
	leads: QualifiedLead[];
	onRefresh: () => void;
	onRequalify: () => void;
	onDraftInMail?: (lead: QualifiedLead) => void;
	onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
	isRefreshing?: boolean;
}

function openProfile(url: string) {
	chrome.tabs.create({ url });
}

export function LeadList({
	leads,
	onRefresh,
	onRequalify,
	onDraftInMail,
	onUpdateStatus,
	isRefreshing = false,
}: LeadListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [localRefreshing, setLocalRefreshing] = useState(false);

	const isSpinning = isRefreshing || localRefreshing;

	const sortedLeads = useMemo(
		() => [...leads].sort((a, b) => b.score - a.score),
		[leads],
	);

	function handleRefresh() {
		setLocalRefreshing(true);
		onRefresh();
		setTimeout(() => setLocalRefreshing(false), 2000);
	}

	function handleToggle(id: string) {
		setExpandedId((prev) => (prev === id ? null : id));
	}

	function handleViewProfile(url: string) {
		openProfile(url);
	}

	function handleDraftInMail(lead: QualifiedLead) {
		onDraftInMail?.(lead);
	}

	return (
		<div className="flex flex-col min-h-full animate-fade-in">
			{/* Sticky header */}
			<div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
				<div className="flex items-center justify-between px-5 py-4">
					<div className="flex items-center gap-2.5">
						<Trophy className="size-4 text-amber-400" />
						<h1 className="text-base font-bold text-white tracking-tight">
							Your Top Leads
						</h1>
						<span className="text-xs font-medium text-zinc-500 bg-white/[0.06] px-2 py-0.5 rounded-md tabular-nums">
							{leads.length}
						</span>
					</div>

					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={onRequalify}
							className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer"
							title="Change qualification criteria"
						>
							<SlidersHorizontal className="size-4" />
						</button>

						<button
							type="button"
							onClick={handleRefresh}
							disabled={isSpinning}
							className={clsx(
								"p-2 rounded-lg transition-all duration-200 cursor-pointer",
								isSpinning
									? "text-zinc-600 cursor-not-allowed"
									: "text-zinc-500 hover:text-white hover:bg-white/10",
							)}
							title="Refresh leads"
						>
							<RefreshCw
								className={clsx(
									"size-4 transition-transform",
									isSpinning && "animate-spin",
								)}
							/>
						</button>
					</div>
				</div>
			</div>

			{/* Lead cards */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				<div className="flex flex-col gap-3 pb-4">
					{sortedLeads.map((lead, idx) => (
						<LeadCard
							key={lead.id}
							lead={lead}
							rank={idx + 1}
							expanded={expandedId === lead.id}
							onToggle={() => handleToggle(lead.id)}
							onViewProfile={handleViewProfile}
							onDraftInMail={handleDraftInMail}
							onUpdateStatus={onUpdateStatus}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
