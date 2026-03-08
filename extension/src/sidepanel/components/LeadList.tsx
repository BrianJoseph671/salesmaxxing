import clsx from "clsx";
import { RefreshCw, Search, SlidersHorizontal, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { LeadStatus, QualifiedLead } from "../types";
import { LeadCard } from "./LeadCard";
import { LeadListSkeleton } from "./Skeletons";

interface LeadListProps {
	leads: QualifiedLead[];
	onRefresh: () => void;
	onRequalify: () => void;
	onDraftInMail?: (lead: QualifiedLead) => void;
	onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
	isRefreshing?: boolean;
	isLoading?: boolean;
}

type ScoreFilter = "all" | "cold" | "hot" | "warm";

const FILTER_OPTIONS: Array<{
	id: ScoreFilter;
	label: string;
}> = [
	{ id: "all", label: "All" },
	{ id: "hot", label: "Hot" },
	{ id: "warm", label: "Warm" },
	{ id: "cold", label: "Cold" },
];

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
	isLoading = false,
}: LeadListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [localRefreshing, setLocalRefreshing] = useState(false);
	const [query, setQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<ScoreFilter>("all");

	const isSpinning = isRefreshing || localRefreshing;

	const sortedLeads = useMemo(
		() => [...leads].sort((a, b) => b.score - a.score),
		[leads],
	);

	const filterCounts = useMemo(
		() => ({
			all: leads.length,
			hot: leads.filter((lead) => lead.score >= 80).length,
			warm: leads.filter((lead) => lead.score >= 60 && lead.score < 80).length,
			cold: leads.filter((lead) => lead.score < 60).length,
		}),
		[leads],
	);

	const averageScore = useMemo(() => {
		if (leads.length === 0) {
			return 0;
		}

		const totalScore = leads.reduce((sum, lead) => sum + lead.score, 0);
		return Math.round(totalScore / leads.length);
	}, [leads]);

	const outreachReadyCount = useMemo(
		() => leads.filter((lead) => lead.talkingPoints.length > 0).length,
		[leads],
	);

	const visibleLeads = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return sortedLeads.filter((lead) => {
			const matchesQuery =
				normalizedQuery.length === 0 ||
				lead.name.toLowerCase().includes(normalizedQuery) ||
				lead.title.toLowerCase().includes(normalizedQuery) ||
				lead.company.toLowerCase().includes(normalizedQuery);

			const matchesFilter =
				activeFilter === "all" ||
				(activeFilter === "hot" && lead.score >= 80) ||
				(activeFilter === "warm" && lead.score >= 60 && lead.score < 80) ||
				(activeFilter === "cold" && lead.score < 60);

			return matchesQuery && matchesFilter;
		});
	}, [activeFilter, query, sortedLeads]);

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

	if (isLoading) {
		return <LeadListSkeleton />;
	}

	return (
		<div className="flex flex-col min-h-full animate-fade-in">
			<div className="sticky top-0 z-10 border-b border-white/5 bg-black/80 backdrop-blur-xl">
				<div className="px-3 pb-3 pt-3">
					<div className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">
									<Trophy className="size-3.5 text-amber-400" />
									Lead Queue
								</div>
								<div className="mt-2 flex items-end gap-2.5">
									<h1 className="text-lg font-semibold tracking-tight text-white">
										Top Leads
									</h1>
									<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[0.68rem] font-medium tabular-nums text-zinc-400">
										{leads.length} total
									</span>
								</div>
								<p className="mt-1 text-sm leading-6 text-zinc-400">
									Ranked against your current qualification brief, with search
									and score filters ready to work inside LinkedIn.
								</p>
							</div>

							<div className="flex shrink-0 items-center gap-1">
								<button
									type="button"
									onClick={onRequalify}
									className="cursor-pointer rounded-xl p-2 text-zinc-500 transition-all duration-200 hover:bg-white/10 hover:text-white"
									title="Change qualification criteria"
								>
									<SlidersHorizontal className="size-4" />
								</button>

								<button
									type="button"
									onClick={handleRefresh}
									disabled={isSpinning}
									className={clsx(
										"cursor-pointer rounded-xl p-2 transition-all duration-200",
										isSpinning
											? "cursor-not-allowed text-zinc-600"
											: "text-zinc-500 hover:bg-white/10 hover:text-white",
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

						<div className="mt-4 grid grid-cols-2 gap-2">
							<div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
								<p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
									Avg Score
								</p>
								<p className="mt-1 text-lg font-semibold tabular-nums text-white">
									{averageScore}
								</p>
							</div>
							<div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
								<p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
									Strong Fit
								</p>
								<p className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">
									{filterCounts.hot}
								</p>
							</div>
							<div className="col-span-2 rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
								<p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
									Outreach Ready
								</p>
								<p className="mt-1 text-lg font-semibold tabular-nums text-white">
									{outreachReadyCount}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
						<div className="flex items-center gap-2 text-zinc-500">
							<Search className="size-4 shrink-0" />
							<input
								id="lead-search"
								name="lead-search"
								type="text"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search leads by name, title, or company"
								className="h-6 w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									className="cursor-pointer rounded-full p-1 text-zinc-500 transition-colors hover:text-white"
									title="Clear search"
								>
									<X className="size-3.5" />
								</button>
							)}
						</div>
					</div>

					<div className="mt-3 flex flex-wrap gap-2">
						{FILTER_OPTIONS.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setActiveFilter(option.id)}
								aria-pressed={activeFilter === option.id}
								className={clsx(
									"cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
									activeFilter === option.id
										? "border-white bg-white text-black"
										: "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white",
								)}
							>
								<span>{option.label}</span>
								<span className="ml-1 tabular-nums opacity-70">
									{filterCounts[option.id]}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Lead cards */}
			<div className="flex-1 overflow-y-auto px-3 py-3">
				<div className="mb-3 flex items-center justify-between px-1">
					<p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
						Browse
					</p>
					<p className="text-xs text-zinc-500">
						{visibleLeads.length} of {leads.length}
					</p>
				</div>

				{visibleLeads.length === 0 ? (
					<div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-5 py-8 text-center">
						<p className="text-base font-semibold text-white">
							No matching leads
						</p>
						<p className="mt-2 text-sm leading-6 text-zinc-400">
							Adjust your search or change the hot, warm, and cold filters to
							explore a different slice of the ranked list.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-3 pb-4">
						{visibleLeads.map((lead, idx) => (
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
				)}
			</div>
		</div>
	);
}
