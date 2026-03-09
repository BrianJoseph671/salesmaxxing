import clsx from "clsx";
import { Brain, Network, Sparkles, Target } from "lucide-react";

interface LoadingStateProps {
	message: string;
}

const STEPS = [
	{ label: "Extracting", icon: Network },
	{ label: "Analyzing", icon: Brain },
	{ label: "Qualifying", icon: Target },
	{ label: "Ranking", icon: Sparkles },
] as const;

function resolveActiveStep(message: string): number {
	const lower = message.toLowerCase();
	if (lower.includes("rank") || lower.includes("insight")) return 3;
	if (lower.includes("qualif")) return 2;
	if (lower.includes("analyz") || lower.includes("read")) return 1;
	return 0;
}

export function LoadingState({ message }: LoadingStateProps) {
	const activeStep = resolveActiveStep(message);

	return (
		<div className="flex min-h-full flex-col items-center justify-center px-5 py-10 animate-fade-in">
			{/* Pulsing orb */}
			<div className="relative mb-10">
				<div className="absolute -inset-6 rounded-full bg-white/[0.02] animate-ping-slow" />
				<div className="absolute -inset-3 rounded-full bg-white/[0.04] animate-pulse" />

				{/* Core spinner */}
				<div className="relative size-14 rounded-full border-2 border-white/10 flex items-center justify-center">
					<svg
						className="absolute inset-0 size-14 animate-spin"
						viewBox="0 0 56 56"
						fill="none"
						role="img"
						aria-label="Loading spinner"
						style={{ animationDuration: "2s" }}
					>
						<circle
							cx="28"
							cy="28"
							r="26"
							stroke="url(#loading-gradient)"
							strokeWidth="2"
							strokeLinecap="round"
							strokeDasharray="120 50"
						/>
						<defs>
							<linearGradient
								id="loading-gradient"
								x1="0"
								y1="0"
								x2="56"
								y2="56"
							>
								<stop stopColor="white" stopOpacity="0.8" />
								<stop offset="1" stopColor="white" stopOpacity="0" />
							</linearGradient>
						</defs>
					</svg>

					<Brain className="size-5 text-white/60" />
				</div>
			</div>

			{/* Progress steps */}
			<div className="mb-8 flex w-full flex-wrap items-center justify-center gap-2">
				{STEPS.map((step, idx) => {
					const StepIcon = step.icon;
					const isActive = idx === activeStep;
					const isPast = idx < activeStep;

					return (
						<div key={step.label} className="flex items-center gap-2">
							<div
								className={clsx(
									"flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-500",
									isActive && "bg-white/10 border border-white/10",
									isPast && "opacity-50",
									!isActive && !isPast && "opacity-25",
								)}
							>
								<StepIcon
									className={clsx(
										"size-3",
										isActive ? "text-white" : "text-zinc-400",
									)}
								/>
								<span
									className={clsx(
										"text-[10px] font-medium",
										isActive ? "text-white" : "text-zinc-500",
									)}
								>
									{step.label}
								</span>
							</div>

							{idx < STEPS.length - 1 && (
								<div
									className={clsx(
										"size-0.5 rounded-full",
										isPast ? "bg-white/30" : "bg-white/10",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Current status message */}
			<p className="max-w-[22rem] text-center text-sm leading-relaxed text-zinc-400">
				{message}
			</p>

			{/* Animated dots */}
			<div className="flex items-center gap-1.5 mt-4">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="size-1 rounded-full bg-zinc-500 animate-bounce"
						style={{
							animationDelay: `${i * 150}ms`,
							animationDuration: "1s",
						}}
					/>
				))}
			</div>
		</div>
	);
}
