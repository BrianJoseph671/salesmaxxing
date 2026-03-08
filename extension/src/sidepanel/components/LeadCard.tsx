import clsx from "clsx";
import {
	ChevronDown,
	ExternalLink,
	Mail,
	MapPin,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { LeadStatus, QualifiedLead } from "../types";

interface LeadCardProps {
	lead: QualifiedLead;
	rank: number;
	expanded: boolean;
	onToggle: () => void;
	onViewProfile: (url: string) => void;
	onDraftInMail: (lead: QualifiedLead) => void;
	onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
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
			accent: "#34d399",
			badge: "bg-emerald-500/18 text-emerald-300 border border-emerald-500/30",
			glow: "shadow-[0_18px_36px_rgba(16,185,129,0.18)]",
			label: "Strong fit",
		};
	}
	if (score >= 60) {
		return {
			accent: "#f59e0b",
			badge: "bg-amber-500/18 text-amber-300 border border-amber-500/30",
			glow: "shadow-[0_18px_36px_rgba(245,158,11,0.16)]",
			label: "Worth a look",
		};
	}
	return {
		accent: "#94a3b8",
		badge: "bg-slate-500/18 text-slate-300 border border-slate-500/30",
		glow: "shadow-[0_18px_36px_rgba(148,163,184,0.14)]",
		label: "Low priority",
	};
}

function degreeColor(degree: string): string {
	if (degree === "1st")
		return "bg-blue-500/15 text-blue-400 border-blue-500/25";
	if (degree === "2nd")
		return "bg-violet-500/15 text-violet-400 border-violet-500/25";
	return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
}

const STATUS_CONFIG: Record<
	LeadStatus,
	{ label: string; color: string; dotColor: string }
> = {
	new: {
		label: "New",
		color: "text-zinc-400 bg-zinc-500/15 border-zinc-500/25",
		dotColor: "bg-zinc-400",
	},
	contacted: {
		label: "Contacted",
		color: "text-blue-400 bg-blue-500/15 border-blue-500/25",
		dotColor: "bg-blue-400",
	},
	replied: {
		label: "Replied",
		color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25",
		dotColor: "bg-emerald-400",
	},
	qualified: {
		label: "Qualified",
		color: "text-amber-400 bg-amber-500/15 border-amber-500/25",
		dotColor: "bg-amber-400",
	},
	disqualified: {
		label: "Disqualified",
		color: "text-red-400 bg-red-500/15 border-red-500/25",
		dotColor: "bg-red-400",
	},
};

const ALL_STATUSES: LeadStatus[] = [
	"new",
	"contacted",
	"replied",
	"qualified",
	"disqualified",
];

function openProfile(url: string) {
	chrome.tabs.create({ url });
}

function ScoreRing({ score }: { score: number }) {
	const { accent, badge, glow, label } = scoreColor(score);
	const radius = 15.915;
	const circumference = 2 * Math.PI * radius;
	const normalizedScore = Math.max(0, Math.min(score, 100));
	const filled = (normalizedScore / 100) * circumference;

	return (
		<div className={clsx("flex flex-col items-center gap-2", glow)}>
			<svg
				className="size-[4.4rem] shrink-0"
				viewBox="0 0 36 36"
				role="img"
				aria-label={`Lead score ${String(normalizedScore)}`}
			>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke="rgba(255,255,255,0.12)"
					strokeWidth="2.8"
				/>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke={accent}
					strokeWidth="2.8"
					strokeDasharray={`${filled} ${circumference - filled}`}
					strokeLinecap="round"
					transform="rotate(-90 18 18)"
				/>
				<text
					x="18"
					y="13.2"
					textAnchor="middle"
					fill="rgba(255,255,255,0.45)"
					fontSize="4.1"
					fontWeight="600"
					letterSpacing="1.4"
				>
					FIT
				</text>
				<text
					x="18"
					y="22.8"
					textAnchor="middle"
					fill={accent}
					fontSize="10"
					fontWeight="700"
				>
					{normalizedScore}
				</text>
			</svg>
			<span
				className={clsx(
					"rounded-full px-2.5 py-1 text-[0.625rem] font-medium",
					badge,
				)}
			>
				{label}
			</span>
		</div>
	);
}

function DetailSection({
	icon,
	title,
	children,
}: {
	icon: ReactNode;
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-[1.15rem] border border-white/8 bg-black/20 p-3.5">
			<div className="mb-2 flex items-center gap-1.5">
				{icon}
				<h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
					{title}
				</h4>
			</div>
			{children}
		</div>
	);
}

export function LeadCard({
	lead,
	rank,
	expanded,
	onToggle,
	onViewProfile,
	onDraftInMail,
	onUpdateStatus,
}: LeadCardProps) {
	const [avatarError, setAvatarError] = useState(false);
	const initials = getInitials(lead.name);
	const colors = scoreColor(lead.score);
	const currentStatus = lead.status ?? "new";
	const statusCfg = STATUS_CONFIG[currentStatus];
	const headerChips = [...lead.keySignals, ...lead.profileHighlights].slice(
		0,
		3,
	);

	return (
		<div
			className={clsx(
				"overflow-hidden rounded-[1.5rem] border transition-all duration-300 ease-out",
				expanded
					? "border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
					: "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))]",
			)}
		>
			<button
				type="button"
				onClick={onToggle}
				className="w-full cursor-pointer px-4 py-4 text-left"
			>
				<div className="flex items-start gap-3.5">
					<div className="flex shrink-0 flex-col items-center gap-3 pt-0.5">
						<span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-zinc-500">
							#{rank}
						</span>
						<div className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
							{lead.avatarUrl && !avatarError ? (
								// biome-ignore lint/performance/noImgElement: extension context, not Next.js
								<img
									src={lead.avatarUrl}
									alt={lead.name}
									className="size-full object-cover"
									onError={() => setAvatarError(true)}
								/>
							) : (
								<span className="select-none text-sm font-semibold text-white/75">
									{initials}
								</span>
							)}
						</div>
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-1.5">
							<span
								className={clsx(
									"rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.2em]",
									degreeColor(lead.connectionDegree),
								)}
							>
								{lead.connectionDegree}
							</span>
							{currentStatus !== "new" && (
								<span
									className={clsx(
										"inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em]",
										statusCfg.color,
									)}
								>
									<span
										className={clsx(
											"size-1.5 rounded-full",
											statusCfg.dotColor,
										)}
									/>
									{statusCfg.label}
								</span>
							)}
						</div>

						<div className="mt-3">
							<p className="truncate text-[1.02rem] font-semibold tracking-tight text-white">
								{lead.name}
							</p>
							<p className="mt-1 truncate text-sm font-medium text-zinc-200">
								{lead.title}
							</p>
							<p className="mt-1 truncate text-[0.8rem] text-zinc-500">
								{lead.company}
							</p>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-zinc-500">
							{lead.location && (
								<span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2.5 py-1">
									<MapPin className="size-3 shrink-0" />
									<span className="truncate">{lead.location}</span>
								</span>
							)}
							<span
								className={clsx(
									"inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
									colors.badge,
								)}
							>
								{colors.label}
							</span>
						</div>

						<p className="mt-3 overflow-hidden text-sm leading-6 text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
							{lead.justification}
						</p>

						{headerChips.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-1.5">
								{headerChips.map((chip) => (
									<span
										key={chip}
										className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.68rem] font-medium text-zinc-300"
									>
										{chip}
									</span>
								))}
							</div>
						)}
					</div>

					<div className="flex shrink-0 flex-col items-center gap-2.5 pt-0.5">
						<ScoreRing score={lead.score} />
						<ChevronDown
							className={clsx(
								"size-4 text-zinc-500 transition-transform duration-300",
								expanded && "rotate-180",
							)}
						/>
					</div>
				</div>
			</button>

			<div
				className={clsx(
					"grid transition-all duration-300 ease-out",
					expanded
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<div className="space-y-3 border-t border-white/8 px-4 pb-4 pt-4">
						<DetailSection
							icon={<Sparkles className="size-3.5 text-amber-400/80" />}
							title="Why this lead"
						>
							<p className="text-sm leading-relaxed text-zinc-300">
								{lead.justification}
							</p>
						</DetailSection>

						{lead.keySignals.length > 0 && (
							<DetailSection
								icon={<Zap className="size-3.5 text-blue-400/80" />}
								title="Key Signals"
							>
								<ul className="space-y-1.5">
									{lead.keySignals.map((signal) => (
										<li
											key={signal}
											className="flex items-start gap-2 text-sm text-zinc-400"
										>
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-zinc-500 text-zinc-600" />
											{signal}
										</li>
									))}
								</ul>
							</DetailSection>
						)}

						{lead.profileHighlights.length > 0 && (
							<DetailSection
								icon={<Users className="size-3.5 text-violet-400/80" />}
								title="Highlights"
							>
								<div className="flex flex-wrap gap-1.5">
									{lead.profileHighlights.map((highlight) => (
										<span
											key={highlight}
											className="rounded-lg border border-white/[0.06] bg-white/[0.08] px-2.5 py-1 text-xs text-zinc-300"
										>
											{highlight}
										</span>
									))}
								</div>
							</DetailSection>
						)}

						{lead.talkingPoints.length > 0 && (
							<DetailSection
								icon={<Mail className="size-3.5 text-emerald-400/80" />}
								title="Talking Points"
							>
								<ol className="space-y-1.5">
									{lead.talkingPoints.map((point, idx) => (
										<li
											key={point}
											className="flex items-start gap-2 text-sm text-zinc-400"
										>
											<span className="mt-px shrink-0 text-xs font-medium tabular-nums text-zinc-600">
												{idx + 1}.
											</span>
											{point}
										</li>
									))}
								</ol>
							</DetailSection>
						)}

						{onUpdateStatus && (
							<DetailSection
								icon={<Sparkles className="size-3.5 text-zinc-400" />}
								title="Status"
							>
								<div className="flex flex-wrap gap-1.5">
									{ALL_STATUSES.map((status) => {
										const config = STATUS_CONFIG[status];
										const isActive = currentStatus === status;
										return (
											<button
												key={status}
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													onUpdateStatus(lead.id, status);
												}}
												className={clsx(
													"flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
													isActive
														? config.color
														: "border-white/[0.06] bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300",
												)}
											>
												<span
													className={clsx(
														"size-1.5 shrink-0 rounded-full",
														isActive ? config.dotColor : "bg-zinc-600",
													)}
												/>
												{config.label}
											</button>
										);
									})}
								</div>
							</DetailSection>
						)}

						<div className="flex gap-2 pt-1">
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									onViewProfile(lead.profileUrl);
									openProfile(lead.profileUrl);
								}}
								className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:bg-white/25"
							>
								<ExternalLink className="size-3.5" />
								View Profile
							</button>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									onDraftInMail(lead);
								}}
								className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-zinc-200 active:bg-zinc-300"
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
