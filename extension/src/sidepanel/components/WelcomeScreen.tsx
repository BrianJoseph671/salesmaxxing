import { ArrowRight } from "lucide-react";
import type { UserInfo } from "../types";

interface WelcomeScreenProps {
	user: UserInfo;
	onContinue: () => void;
}

function getFirstName(fullName: string): string {
	const trimmed = fullName.trim();
	const spaceIndex = trimmed.indexOf(" ");
	return spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
}

function getInitials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
	const first = parts[0]?.[0] ?? "";
	const last = parts[parts.length - 1]?.[0] ?? "";
	return (first + last).toUpperCase();
}

export function WelcomeScreen({ user, onContinue }: WelcomeScreenProps) {
	const firstName = getFirstName(user.name);
	const initials = getInitials(user.name);
	const subtitle = user.headline ?? user.email;

	return (
		<div className="flex min-h-full flex-col px-6 py-6 animate-fade-in">
			<p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
				SalesMAXXing
			</p>
			<h1 className="mt-4 text-[28px] font-semibold tracking-tight text-white">
				Welcome, {firstName}
			</h1>
			<p className="mt-3 max-w-[320px] text-sm leading-6 text-zinc-400">
				Choose how SalesMAXXing should qualify your LinkedIn prospects. Start
				with our automatic scoring engine, or define your own criteria first.
			</p>

			<div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
				<div className="flex items-center gap-4">
					<div className="relative">
						<div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/20 via-white/5 to-transparent blur-sm" />
						<div className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/15">
							{user.avatarUrl ? (
								<div
									className="size-full bg-cover bg-center"
									style={{ backgroundImage: `url(${user.avatarUrl})` }}
									role="img"
									aria-label={user.name}
								/>
							) : (
								<span className="select-none text-lg font-semibold text-white/80">
									{initials}
								</span>
							)}
						</div>
					</div>

					<div className="min-w-0 flex-1">
						<p className="truncate text-lg font-semibold text-white">
							{user.name}
						</p>
						<p className="mt-1 truncate text-sm text-zinc-400">{subtitle}</p>
					</div>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-3">
					<div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
						<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-600">
							Mode
						</p>
						<p className="mt-2 text-sm font-medium text-white">
							Automatic or custom
						</p>
					</div>
					<div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
						<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-600">
							Output
						</p>
						<p className="mt-2 text-sm font-medium text-white">
							Ranked lead list
						</p>
					</div>
				</div>
			</div>

			<div className="mt-auto pt-8">
				<button
					type="button"
					onClick={onContinue}
					className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-zinc-200 active:bg-zinc-300 cursor-pointer"
				>
					Get Started
					<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
				</button>
			</div>
		</div>
	);
}
