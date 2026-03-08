import {
	ArrowRight,
	BarChart3,
	BrainCircuit,
	CheckCircle2,
	ChevronDown,
	Download,
	Linkedin,
	MessageSquare,
	MonitorSmartphone,
	Shield,
	Sparkles,
	Target,
	Zap,
} from "lucide-react";
import { getUser } from "@/src/lib/supabase/auth";

const CHROME_STORE_URL = "#install";

function GlowOrb({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ""}`}
		/>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
			{children}
		</p>
	);
}

/* ---------- Hero ---------- */
function Hero({ signedIn }: { signedIn: boolean }) {
	return (
		<section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
			{/* Background glow effects */}
			<GlowOrb className="-top-32 left-1/2 h-96 w-96 -translate-x-1/2 bg-purple-600/20" />
			<GlowOrb className="-bottom-24 -right-24 h-72 w-72 bg-blue-600/10" />

			<div className="relative z-10 mx-auto max-w-4xl">
				<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400">
					<Sparkles className="h-3.5 w-3.5 text-purple-400" />
					<span>Powered by Claude AI</span>
				</div>

				<h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-7xl">
					Qualify leads from your{" "}
					<span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
						LinkedIn network
					</span>{" "}
					with AI
				</h1>

				<p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
					Stop guessing which connections to pursue. SalesMAXXing analyzes your
					LinkedIn network with Claude and surfaces ranked leads with
					personalized InMail drafts — in seconds.
				</p>

				<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					{signedIn ? (
						<a
							href="/overview"
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							Open Dashboard
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					) : (
						<a
							href={CHROME_STORE_URL}
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							<Download className="h-4 w-4" />
							Install Extension
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					)}
					<a
						href="#how-it-works"
						className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
					>
						Learn More
						<ChevronDown className="h-4 w-4" />
					</a>
				</div>

				{signedIn && (
					<p className="mt-6 text-sm font-medium text-emerald-400/80">
						You are signed in
					</p>
				)}
			</div>
		</section>
	);
}

/* ---------- How It Works ---------- */
const steps = [
	{
		num: "01",
		icon: Download,
		title: "Install & sign in",
		description:
			"Add the Chrome extension and sign in with your LinkedIn account. One click, zero configuration.",
	},
	{
		num: "02",
		icon: BrainCircuit,
		title: "AI analyzes your network",
		description:
			"Claude reviews your connections, profile, and engagement patterns to understand your ideal customer profile.",
	},
	{
		num: "03",
		icon: Target,
		title: "Get ranked leads & drafts",
		description:
			"Receive scored lead cards with qualification reasoning and one-click InMail drafts ready to send.",
	},
];

function HowItWorks() {
	return (
		<section id="how-it-works" className="relative px-6 py-28">
			<div className="mx-auto max-w-5xl">
				<div className="text-center">
					<SectionLabel>How It Works</SectionLabel>
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
						Three steps to qualified leads
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-zinc-400">
						From install to first outreach in under five minutes.
					</p>
				</div>

				<div className="mt-16 grid gap-8 sm:grid-cols-3">
					{steps.map((step) => (
						<div key={step.num} className="group relative">
							{/* Connector line (hidden on first card) */}
							<div className="absolute left-0 top-12 hidden h-px w-full bg-gradient-to-r from-white/10 to-transparent sm:block" />

							<div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]">
								<span className="text-xs font-semibold tracking-widest text-purple-400/70">
									{step.num}
								</span>
								<div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
									<step.icon className="h-6 w-6 text-white" />
								</div>
								<h3 className="mt-5 text-lg font-semibold text-white">
									{step.title}
								</h3>
								<p className="mt-2 text-sm leading-relaxed text-zinc-400">
									{step.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ---------- Features ---------- */
const features = [
	{
		icon: Sparkles,
		title: "AI-Powered Qualification",
		description:
			"Claude analyzes fit signals — role, company, engagement, mutual connections — and assigns a confidence score with clear reasoning.",
		accent: "text-purple-400",
	},
	{
		icon: MessageSquare,
		title: "One-Click InMail Drafts",
		description:
			"Personalized outreach generated from your shared context. Not templates — genuinely relevant conversation starters.",
		accent: "text-blue-400",
	},
	{
		icon: Linkedin,
		title: "Works Alongside LinkedIn",
		description:
			"A side panel that stays with you as you browse. No tab-switching, no context loss. Qualification happens where you work.",
		accent: "text-sky-400",
	},
	{
		icon: MonitorSmartphone,
		title: "Premium Dark Interface",
		description:
			"Designed to feel native on LinkedIn. Clean typography, smooth interactions, and a dark aesthetic that does not fight your workflow.",
		accent: "text-zinc-300",
	},
];

function Features() {
	return (
		<section id="features" className="relative px-6 py-28">
			<GlowOrb className="right-0 top-1/2 h-80 w-80 -translate-y-1/2 bg-purple-600/10" />

			<div className="relative z-10 mx-auto max-w-5xl">
				<div className="text-center">
					<SectionLabel>Features</SectionLabel>
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
						Everything you need to prospect smarter
					</h2>
				</div>

				<div className="mt-16 grid gap-6 sm:grid-cols-2">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]"
						>
							<div
								className={`flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 ${feature.accent}`}
							>
								<feature.icon className="h-5 w-5" />
							</div>
							<h3 className="mt-5 text-lg font-semibold text-white">
								{feature.title}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-zinc-400">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ---------- Modes ---------- */
const modes = [
	{
		icon: Zap,
		title: "Automatic Mode",
		description:
			"AI reviews your LinkedIn profile and infers your ICP. Zero setup — results in seconds.",
	},
	{
		icon: BarChart3,
		title: "Custom Mode",
		description:
			"Define your own criteria — industry, role, company size, signals — and let AI match against your network.",
	},
];

function Modes() {
	return (
		<section className="px-6 py-28">
			<div className="mx-auto max-w-5xl">
				<div className="text-center">
					<SectionLabel>Two Modes</SectionLabel>
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
						Your way, or the fast way
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-zinc-400">
						Whether you want full control or instant results, SalesMAXXing
						adapts to how you sell.
					</p>
				</div>

				<div className="mt-16 grid gap-6 sm:grid-cols-2">
					{modes.map((mode) => (
						<div
							key={mode.title}
							className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-10 text-center"
						>
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
								<mode.icon className="h-7 w-7 text-white" />
							</div>
							<h3 className="mt-6 text-xl font-semibold text-white">
								{mode.title}
							</h3>
							<p className="mt-3 text-sm leading-relaxed text-zinc-400">
								{mode.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ---------- Comparison ---------- */
const comparisons = [
	{ label: "AI-first qualification", us: true, them: false },
	{ label: "Personalized InMail drafts", us: true, them: false },
	{ label: "Works inside LinkedIn", us: true, them: false },
	{ label: "Understands your ICP context", us: true, them: false },
	{ label: "Contact data enrichment", us: false, them: true },
	{ label: "Mass email sequences", us: false, them: true },
];

function Comparison() {
	return (
		<section className="px-6 py-28">
			<div className="mx-auto max-w-3xl">
				<div className="text-center">
					<SectionLabel>Why SalesMAXXing</SectionLabel>
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
						AI-first, not just data enrichment
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-zinc-400">
						Apollo and Lusha give you contact data. SalesMAXXing tells you{" "}
						<span className="text-white">who to contact and why</span>.
					</p>
				</div>

				<div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.06]">
					{/* Header */}
					<div className="grid grid-cols-3 border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
						<span className="text-sm font-medium text-zinc-500" />
						<span className="text-center text-sm font-semibold text-white">
							SalesMAXXing
						</span>
						<span className="text-center text-sm font-medium text-zinc-500">
							Apollo / Lusha
						</span>
					</div>
					{/* Rows */}
					{comparisons.map((row, i) => (
						<div
							key={row.label}
							className={`grid grid-cols-3 items-center px-6 py-3.5 ${
								i < comparisons.length - 1 ? "border-b border-white/[0.04]" : ""
							}`}
						>
							<span className="text-sm text-zinc-300">{row.label}</span>
							<span className="text-center">
								{row.us ? (
									<CheckCircle2 className="mx-auto h-4.5 w-4.5 text-emerald-400" />
								) : (
									<span className="text-zinc-600">--</span>
								)}
							</span>
							<span className="text-center">
								{row.them ? (
									<CheckCircle2 className="mx-auto h-4.5 w-4.5 text-zinc-500" />
								) : (
									<span className="text-zinc-600">--</span>
								)}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ---------- Final CTA ---------- */
function FinalCTA({ signedIn }: { signedIn: boolean }) {
	return (
		<section className="relative px-6 py-28">
			<GlowOrb className="left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-purple-600/15" />

			<div className="relative z-10 mx-auto max-w-3xl text-center">
				<h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
					Start qualifying leads today
				</h2>
				<p className="mx-auto mt-4 max-w-xl text-zinc-400">
					Install the extension, sign in with LinkedIn, and let AI do the heavy
					lifting. Free during early access.
				</p>

				<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					{signedIn ? (
						<a
							href="/overview"
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							Open Dashboard
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					) : (
						<a
							href={CHROME_STORE_URL}
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							<Download className="h-4 w-4" />
							Install Extension
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					)}
				</div>
			</div>
		</section>
	);
}

/* ---------- Footer ---------- */
function Footer() {
	return (
		<footer className="border-t border-white/[0.06] px-6 py-10">
			<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
				<div className="flex items-center gap-2">
					<Shield className="h-4 w-4 text-zinc-500" />
					<span className="text-sm font-semibold tracking-wide text-zinc-400">
						SalesMAXXing
					</span>
				</div>
				<nav className="flex gap-6">
					<a
						href="/privacy"
						className="text-sm text-zinc-500 transition hover:text-zinc-300"
					>
						Privacy Policy
					</a>
					<a
						href={CHROME_STORE_URL}
						className="text-sm text-zinc-500 transition hover:text-zinc-300"
					>
						Chrome Web Store
					</a>
				</nav>
			</div>
		</footer>
	);
}

/* ---------- Page ---------- */
export default async function Home() {
	const user = await getUser();
	const signedIn = !!user;

	return (
		<main className="min-h-screen bg-zinc-950 text-white">
			<Hero signedIn={signedIn} />
			<HowItWorks />
			<Features />
			<Modes />
			<Comparison />
			<FinalCTA signedIn={signedIn} />
			<Footer />
		</main>
	);
}
