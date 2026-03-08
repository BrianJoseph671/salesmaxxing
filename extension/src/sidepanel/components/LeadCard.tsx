import { useState } from "react";
import {
	ChevronDown,
	ExternalLink,
	Mail,
	MapPin,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import clsx from "clsx";
import type { QualifiedLead } from "../types";

interface LeadCardProps {
	lead: QualifiedLead;
	rank: number;
	expanded: boolean;
	onToggle: () => void;
	onViewProfile: (url: string) => void;
	onDraftInMail: (lead: QualifiedLead) => void;
}

function getInitials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
	const first = parts[0]?.[0] ?? "";
	const last = parts[parts.length - 1]?.[0] ?? "";
	return (first + last).toUpperCase();
}

function scoreColor(score: number) {
	if (score >= 80) {
		return {
			badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
			glow: "shadow-emerald-500/10",
		};
	}
	if (score >= 60) {
		return {
			badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
			glow: "shadow-amber-500/10",
		};
	}
	return {
		badge: "bg-red-500/20 text-red-400 border border-red-500/30",
		glow: "shadow-red-500/10",
	};
}

function degreeColor(degree: string): string {
	if (degree === "1st") return "bg-blue-500/15 text-blue-400 border-blue-500/25";
	if (degree === "2nd")
		return "bg-violet-500/15 text-violet-400 border-violet-500/25";
	return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
}

function openProfile(url: string) {
	chrome.tabs.create({ url });
}

export function LeadCard({
	lead,
	rank,
	expanded,
	onToggle,
	onViewProfile,
	onDraftInMail,
}: LeadCardProps) {
	const [avatarError, setAvatarError] = useState(false);
	const initials = getInitials(lead.name);
	const colors = scoreColor(lead.score);

	return (
		<div
			className={clsx(
				"rounded-2xl overflow-hidden transition-all duration-300 ease-out",
				expanded
					? "bg-white/[0.07] border border-white/20"
					: "bg-white/5 border border-white/10 hover:border-white/15 hover:bg-white/[0.06]",
			)}
		>
			{/* Collapsed header — always visible */}
			<button
				type="button"
				onClick={onToggle}
				className="w-full text-left px-4 py-3.5 cursor-pointer"
			>
				<div className="flex items-center gap-3">
					{/* Rank */}
					<span className="flex-shrink-0 text-xs font-medium text-zinc-600 w-4 text-center tabular-nums">
						{rank}
					</span>

					{/* Avatar */}
					<div className="relative flex-shrink-0 size-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center ring-1 ring-white/10">
						{lead.avatarUrl && !avatarError ? (
							<img
								src={lead.avatarUrl}
								alt={lead.name}
								className="size-full object-cover"
								onError={() => setAvatarError(true)}
							/>
						) : (
							<span className="text-xs font-semibold text-white/70 select-none">
								{initials}
							</span>
						)}
					</div>

					{/* Name + title */}
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-white truncate leading-tight">
							{lead.name}
						</p>
						<p className="text-xs text-zinc-400 truncate leading-tight mt-0.5">
							{lead.title}
							{lead.company ? ` @ ${lead.company}` : ""}
						</p>
					</div>

					{/* Right side: badges + chevron */}
					<div className="flex items-center gap-2 flex-shrink-0">
						{/* Connection degree */}
						<span
							className={clsx(
								"text-[10px] font-medium px-1.5 py-0.5 rounded-md border",
								degreeColor(lead.connectionDegree),
							)}
						>
							{lead.connectionDegree}
						</span>

						{/* Score badge */}
						<div
							className={clsx(
								"size-9 rounded-full flex items-center justify-center font-bold text-sm tabular-nums",
								colors.badge,
							)}
						>
							{lead.score}
						</div>

						{/* Chevron */}
						<ChevronDown
							className={clsx(
								"size-4 text-zinc-500 transition-transform duration-300",
								expanded && "rotate-180",
							)}
						/>
					</div>
				</div>

				{/* Location — below main row */}
				{lead.location && (
					<div className="flex items-center gap-1 mt-1.5 ml-[52px]">
						<MapPin className="size-3 text-zinc-600 flex-shrink-0" />
						<span className="text-[11px] text-zinc-500 truncate">
							{lead.location}
						</span>
					</div>
				)}
			</button>

			{/* Expanded details */}
			<div
				className={clsx(
					"grid transition-all duration-300 ease-out",
					expanded
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<div className="px-4 pb-4">
						{/* Why this lead */}
						<div className="border-t border-white/5 pt-3.5 mt-0.5">
							<div className="flex items-center gap-1.5 mb-2">
								<Sparkles className="size-3.5 text-amber-400/80" />
								<h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
									Why this lead
								</h4>
							</div>
							<p className="text-sm text-zinc-300 leading-relaxed">
								{lead.justification}
							</p>
						</div>

						{/* Key signals */}
						{lead.keySignals.length > 0 && (
							<div className="border-t border-white/5 pt-3.5 mt-3.5">
								<div className="flex items-center gap-1.5 mb-2">
									<Zap className="size-3.5 text-blue-400/80" />
									<h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
										Key Signals
									</h4>
								</div>
								<ul className="space-y-1.5">
									{lead.keySignals.map((signal) => (
										<li
											key={signal}
											className="flex items-start gap-2 text-sm text-zinc-400"
										>
											<span className="text-zinc-600 mt-1.5 flex-shrink-0 size-1 rounded-full bg-zinc-500" />
											{signal}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Profile highlights */}
						{lead.profileHighlights.length > 0 && (
							<div className="border-t border-white/5 pt-3.5 mt-3.5">
								<div className="flex items-center gap-1.5 mb-2">
									<Users className="size-3.5 text-violet-400/80" />
									<h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
										Highlights
									</h4>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{lead.profileHighlights.map((highlight) => (
										<span
											key={highlight}
											className="text-xs bg-white/[0.08] text-zinc-300 px-2.5 py-1 rounded-lg border border-white/[0.06]"
										>
											{highlight}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Talking points */}
						{lead.talkingPoints.length > 0 && (
							<div className="border-t border-white/5 pt-3.5 mt-3.5">
								<div className="flex items-center gap-1.5 mb-2">
									<Mail className="size-3.5 text-emerald-400/80" />
									<h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
										Talking Points
									</h4>
								</div>
								<ol className="space-y-1.5">
									{lead.talkingPoints.map((point, idx) => (
										<li
											key={point}
											className="flex items-start gap-2 text-sm text-zinc-400"
										>
											<span className="text-zinc-600 font-medium text-xs mt-px flex-shrink-0 tabular-nums">
												{idx + 1}.
											</span>
											{point}
										</li>
									))}
								</ol>
							</div>
						)}

						{/* Action buttons */}
						<div className="flex gap-2 mt-4 pt-3.5 border-t border-white/5">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onViewProfile(lead.profileUrl);
									openProfile(lead.profileUrl);
								}}
								className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 text-white text-sm font-medium rounded-xl px-3 py-2.5 hover:bg-white/20 active:bg-white/25 transition-all duration-200 cursor-pointer"
							>
								<ExternalLink className="size-3.5" />
								View Profile
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDraftInMail(lead);
								}}
								className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black text-sm font-semibold rounded-xl px-3 py-2.5 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
							>
								<Mail className="size-3.5" />
								Draft InMail
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
