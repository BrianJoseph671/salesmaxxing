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
		<div className="flex flex-col items-center justify-center min-h-full px-8 py-12 animate-fade-in">
			{/* Avatar */}
			<div className="relative mb-6">
				<div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/20 via-white/5 to-transparent blur-sm" />
				<div className="relative size-16 rounded-full ring-2 ring-white/15 overflow-hidden bg-white/10 flex items-center justify-center">
					{user.avatarUrl ? (
						<div
							className="size-full bg-cover bg-center"
							style={{ backgroundImage: `url(${user.avatarUrl})` }}
							role="img"
							aria-label={user.name}
						/>
					) : (
						<span className="text-lg font-semibold text-white/80 select-none">
							{initials}
						</span>
					)}
				</div>
			</div>

			{/* Greeting */}
			<h1 className="text-2xl font-bold text-white tracking-tight text-center mb-1">
				Welcome back,
			</h1>
			<h2 className="text-2xl font-bold text-white tracking-tight text-center mb-3">
				{firstName}
			</h2>

			{/* Subtitle */}
			<p className="text-sm text-zinc-400 text-center max-w-[280px] leading-relaxed mb-10 truncate w-full">
				{subtitle}
			</p>

			{/* Value prop */}
			<p className="text-base text-zinc-300 text-center mb-10">
				Let&apos;s find your best leads
			</p>

			{/* CTA */}
			<button
				type="button"
				onClick={onContinue}
				className="group flex items-center gap-2.5 bg-white text-black font-semibold rounded-xl px-6 py-3 hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-200 cursor-pointer"
			>
				Get Started
				<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
			</button>
		</div>
	);
}
