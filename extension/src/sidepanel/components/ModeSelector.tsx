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
	onClick: () => void;
	accent?: boolean;
}

function ModeCard({
	icon,
	title,
	description,
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
					<h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
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
			<h1 className="text-xl font-bold text-white tracking-tight mb-2">
				How should we find your leads?
			</h1>
			<p className="text-sm text-zinc-400 leading-relaxed mb-8">
				Choose a qualification strategy for your LinkedIn connections.
			</p>

			{/* Mode cards */}
			<div className="flex flex-col gap-3">
				<ModeCard
					icon={<Sparkles className="size-5 text-white/80" />}
					title="Automatic"
					description="AI reviews your profile and finds the best matches from your network."
					onClick={onSelectAutomatic}
					accent
				/>
				<ModeCard
					icon={<SlidersHorizontal className="size-5 text-white/80" />}
					title="Custom Criteria"
					description="Define keywords, target companies, and your ideal customer profile."
					onClick={onSelectCustom}
				/>
			</div>
		</div>
	);
}
