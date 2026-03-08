/**
 * Skeleton loading placeholders for all async UI states.
 * Uses animate-pulse with subtle white-on-black shimmer to match the dark premium design.
 */

const shimmer = "animate-pulse bg-white/[0.06] rounded";
const shimmerBright = "animate-pulse bg-white/[0.10] rounded";

const CARD_KEYS = ["skel-0", "skel-1", "skel-2", "skel-3", "skel-4"];
const TONE_KEYS = ["tone-0", "tone-1", "tone-2"];

// ── LeadCardSkeleton ────────────────────────────────────────────────────────

export function LeadCardSkeleton() {
	return (
		<div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
			<div className="px-4 py-3.5">
				<div className="flex items-center gap-3">
					{/* Rank */}
					<div className={`${shimmer} w-4 h-3 flex-shrink-0`} />

					{/* Avatar */}
					<div
						className={`${shimmerBright} flex-shrink-0 size-9 !rounded-full`}
					/>

					{/* Name + title */}
					<div className="min-w-0 flex-1 space-y-1.5">
						<div className={`${shimmerBright} h-3.5 w-3/4`} />
						<div className={`${shimmer} h-3 w-full`} />
					</div>

					{/* Right side: degree badge + score badge + chevron */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<div className={`${shimmer} h-5 w-8 rounded-md`} />
						<div className={`${shimmerBright} size-9 !rounded-full`} />
						<div className={`${shimmer} size-4`} />
					</div>
				</div>

				{/* Location line */}
				<div className="flex items-center gap-1 mt-1.5 ml-[52px]">
					<div className={`${shimmer} h-3 w-32`} />
				</div>
			</div>
		</div>
	);
}

// ── LeadListSkeleton ────────────────────────────────────────────────────────

export function LeadListSkeleton() {
	return (
		<div className="flex flex-col min-h-full">
			{/* Header skeleton matching LeadList sticky header */}
			<div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
				<div className="flex items-center justify-between px-5 py-4">
					<div className="flex items-center gap-2.5">
						<div className={`${shimmerBright} size-4 !rounded`} />
						<div className={`${shimmerBright} h-5 w-28`} />
						<div className={`${shimmer} h-5 w-8 rounded-md`} />
					</div>

					<div className="flex items-center gap-1">
						<div className={`${shimmer} size-8 !rounded-lg`} />
						<div className={`${shimmer} size-8 !rounded-lg`} />
					</div>
				</div>
			</div>

			{/* Card skeletons */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				<div className="flex flex-col gap-3 pb-4">
					{CARD_KEYS.map((k) => (
						<LeadCardSkeleton key={k} />
					))}
				</div>
			</div>
		</div>
	);
}

// ── ProfileSkeleton ─────────────────────────────────────────────────────────

export function ProfileSkeleton() {
	return (
		<div className="flex flex-col items-center justify-center min-h-full px-8 py-12">
			{/* Avatar */}
			<div className="relative mb-6">
				<div
					className={`${shimmerBright} size-16 !rounded-full ring-2 ring-white/10`}
				/>
			</div>

			{/* Name lines */}
			<div className={`${shimmerBright} h-7 w-44 mb-2`} />
			<div className={`${shimmerBright} h-7 w-28 mb-3`} />

			{/* Headline */}
			<div className={`${shimmer} h-4 w-52 mb-10`} />

			{/* Value prop */}
			<div className={`${shimmer} h-5 w-48 mb-10`} />

			{/* CTA placeholder */}
			<div className={`${shimmerBright} h-12 w-40 !rounded-xl`} />
		</div>
	);
}

// ── ComposerSkeleton ────────────────────────────────────────────────────────

export function ComposerSkeleton() {
	return (
		<div className="flex flex-col min-h-full">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 px-5 py-4">
				{/* Back button */}
				<div className="flex items-center gap-1.5 mb-3 -ml-1">
					<div className={`${shimmer} size-4`} />
					<div className={`${shimmer} h-4 w-24`} />
				</div>

				{/* Lead info: avatar + name/title */}
				<div className="flex items-center gap-3">
					<div className={`${shimmerBright} size-10 !rounded-full`} />
					<div className="min-w-0 flex-1 space-y-1.5">
						<div className={`${shimmerBright} h-3.5 w-36`} />
						<div className={`${shimmer} h-3 w-48`} />
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
				{/* Tone selector */}
				<div>
					<div className={`${shimmer} h-3 w-12 mb-2`} />
					<div className="flex gap-2">
						{TONE_KEYS.map((k) => (
							<div key={k} className={`${shimmer} flex-1 h-9 !rounded-xl`} />
						))}
					</div>
				</div>

				{/* Draft area */}
				<div>
					<div className={`${shimmer} h-3 w-12 mb-2`} />
					<div className={`${shimmer} w-full min-h-[200px] !rounded-xl`} />
				</div>
			</div>

			{/* Action bar */}
			<div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/5 px-5 py-4">
				<div className="flex gap-2">
					<div className={`${shimmer} h-10 w-28 !rounded-xl`} />
					<div className={`${shimmer} h-10 w-20 !rounded-xl`} />
					<div className={`${shimmerBright} flex-1 h-10 !rounded-xl`} />
				</div>
			</div>
		</div>
	);
}
