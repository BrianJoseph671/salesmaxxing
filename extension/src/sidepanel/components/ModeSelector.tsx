import clsx from "clsx";
import { ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";

interface ModeSelectorProps {
	onSelectAutomatic: () => void;
	onSelectCustom: () => void;
	onBack: () => void;
}

interface ModeCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	badge?: string;
	onClick: () => void;
	accent?: boolean;
}

function ModeCard({
	icon,
	title,
	description,
	badge,
	onClick,
	accent,
}: ModeCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"w-full text-left bg-white/5 border border-white/10 rounded-2xl p-5",
				"hover:border-white/20 hover:bg-white/10 active:bg-white/[0.12]",
				"transition-all duration-200 cursor-pointer group",
				accent && "ring-1 ring-white/5",
			)}
		>
			<div className="flex items-start gap-4">
				<div
					className={clsx(
						"flex-shrink-0 size-10 rounded-xl flex items-center justify-center",
						"bg-white/10 group-hover:bg-white/15 transition-colors duration-200",
					)}
				>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex items-center gap-2">
						<h3 className="text-[15px] font-semibold text-white">{title}</h3>
						{badge ? (
							<span className="rounded-full border border-white/12 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300">
								{badge}
							</span>
						) : null}
					</div>
					<p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
				</div>
			</div>
		</button>
	);
}

export function ModeSelector({
	onSelectAutomatic,
	onSelectCustom,
	onBack,
}: ModeSelectorProps) {
	return (
		<div className="flex flex-col min-h-full px-6 py-6 animate-fade-in">
			{/* Back button */}
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-200 mb-8 -ml-1 self-start cursor-pointer"
			>
				<ArrowLeft className="size-4" />
				<span className="text-sm">Back</span>
			</button>

			{/* Header */}
			<p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
				Qualification Mode
			</p>
			<h1 className="mt-3 text-2xl font-bold text-white tracking-tight mb-2">
				How should we find your leads?
			</h1>
			<p className="text-sm text-zinc-400 leading-relaxed mb-8">
				Let AI decide automatically, or define your own ICP with explicit
				keywords, company targets, and filters.
			</p>

			{/* Mode cards */}
			<div className="flex flex-col gap-3">
				<ModeCard
					icon={<Sparkles className="size-5 text-white/80" />}
					title="Automatic"
					description="AI reviews your profile, infers your best-fit buyers, and ranks the strongest matches from your network."
					badge="Recommended"
					onClick={onSelectAutomatic}
					accent
				/>
				<ModeCard
					icon={<SlidersHorizontal className="size-5 text-white/80" />}
					title="Custom Criteria"
					description="Add your own keywords, target companies, and qualification questions to shape the scoring."
					onClick={onSelectCustom}
				/>
			</div>
		</div>
	);
}
