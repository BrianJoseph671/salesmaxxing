import { ArrowRight, Download } from "lucide-react";
import Image from "next/image";
import { getUser } from "@/src/lib/supabase/auth";

const EXTENSION_DOWNLOAD_URL = "/downloads/salesmaxxing-extension.zip";
const INSTALL_SECTION_ID = "install";

/* ---------- Nav ---------- */
function Nav({ signedIn }: { signedIn: boolean }) {
	return (
		<nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
				<a href="/" className="flex items-center gap-2.5">
					<Image
						src="/logo.png"
						alt="SalesMAXXing"
						width={28}
						height={28}
						className="rounded-lg"
					/>
					<span className="text-sm font-semibold tracking-wide text-white">
						SalesMAXXing
					</span>
				</a>

				<div className="flex items-center gap-3">
					{signedIn ? (
						<>
							<a
								href="/overview"
								className="text-sm text-zinc-400 transition hover:text-white"
							>
								Dashboard
							</a>
							<a
								href="/auth/sign-out"
								className="text-sm text-zinc-500 transition hover:text-zinc-300"
							>
								Sign out
							</a>
						</>
					) : (
						<>
							<a
								href="/sign-in"
								className="text-sm text-zinc-400 transition hover:text-white"
							>
								Sign in
							</a>
							<a
								href={EXTENSION_DOWNLOAD_URL}
								download
								className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:bg-zinc-200"
							>
								Download ZIP
								<Download className="h-3.5 w-3.5" />
							</a>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}

/* ---------- Hero ---------- */
function Hero({ signedIn }: { signedIn: boolean }) {
	return (
		<section className="flex min-h-[85vh] flex-col items-center justify-center px-6 pt-24 text-center">
			<div className="mx-auto max-w-3xl">
				<h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-7xl">
					Qualify leads
					<br />
					from your network
				</h1>

				<p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500">
					AI analyzes your LinkedIn connections and surfaces the best prospects
					— ranked, justified, with personalized outreach ready to send.
				</p>

				<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					{signedIn ? (
						<a
							href="/overview"
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							Open Dashboard
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					) : (
						<a
							href={EXTENSION_DOWNLOAD_URL}
							download
							className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							Download Extension ZIP
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					)}
					<a
						href={`#${INSTALL_SECTION_ID}`}
						className="inline-flex items-center gap-2 rounded-full border border-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.04]"
					>
						How To Install
					</a>
				</div>
			</div>
		</section>
	);
}

/* ---------- How It Works ---------- */
const steps = [
	{
		num: "01",
		title: "Install & sign in",
		description: "Add the Chrome extension. Sign in with LinkedIn. One click.",
	},
	{
		num: "02",
		title: "AI qualifies your network",
		description:
			"Claude reviews your connections against your ICP and ranks the best fits.",
	},
	{
		num: "03",
		title: "Reach out with confidence",
		description:
			"Get scored lead cards with reasoning and personalized InMail drafts.",
	},
];

function HowItWorks() {
	return (
		<section className="px-6 py-24">
			<div className="mx-auto max-w-3xl">
				<p className="text-xs uppercase tracking-[0.3em] text-zinc-600">
					How it works
				</p>

				<div className="mt-10 space-y-10">
					{steps.map((step) => (
						<div key={step.num} className="flex gap-6">
							<span className="mt-0.5 text-sm font-medium text-zinc-600">
								{step.num}
							</span>
							<div>
								<h3 className="text-base font-semibold text-white">
									{step.title}
								</h3>
								<p className="mt-1 text-sm leading-relaxed text-zinc-500">
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
		title: "AI-first qualification",
		description:
			"Claude scores connections by fit — role, company, engagement, mutual context — not just data enrichment.",
	},
	{
		title: "One-click InMail drafts",
		description:
			"Personalized outreach from shared context. Not templates. Genuine conversation starters.",
	},
	{
		title: "Lives inside LinkedIn",
		description:
			"A side panel that stays with you as you browse. No tab-switching, no context loss.",
	},
	{
		title: "Two modes",
		description:
			"Automatic: AI infers your ICP. Custom: you define keywords, industries, and criteria.",
	},
];

function Features() {
	return (
		<section className="border-t border-white/[0.04] px-6 py-24">
			<div className="mx-auto max-w-3xl">
				<p className="text-xs uppercase tracking-[0.3em] text-zinc-600">
					Features
				</p>

				<div className="mt-10 grid gap-8 sm:grid-cols-2">
					{features.map((f) => (
						<div key={f.title}>
							<h3 className="text-sm font-semibold text-white">{f.title}</h3>
							<p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
								{f.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function InstallSection() {
	return (
		<section
			id={INSTALL_SECTION_ID}
			className="border-t border-white/[0.04] px-6 py-24"
		>
			<div className="mx-auto max-w-3xl">
				<p className="text-xs uppercase tracking-[0.3em] text-zinc-600">
					Try the MVP
				</p>
				<div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
						<div className="max-w-xl">
							<h2 className="text-2xl font-semibold tracking-tight text-white">
								Download the latest Chrome extension ZIP
							</h2>
							<p className="mt-3 text-sm leading-7 text-zinc-400">
								SalesMAXXing is not in the Chrome Web Store yet. Download the
								current MVP build, unzip it, then load the extracted folder as
								an unpacked extension in Chrome.
							</p>
						</div>
						<a
							href={EXTENSION_DOWNLOAD_URL}
							download
							className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						>
							Download ZIP
							<Download className="h-4 w-4" />
						</a>
					</div>

					<div className="mt-8 grid gap-6 sm:grid-cols-3">
						<div>
							<p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-600">
								1. Download
							</p>
							<p className="mt-2 text-sm leading-6 text-zinc-400">
								Grab the ZIP and extract the <code>salesmaxxing-extension</code>{" "}
								folder anywhere on your machine.
							</p>
						</div>
						<div>
							<p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-600">
								2. Load Unpacked
							</p>
							<p className="mt-2 text-sm leading-6 text-zinc-400">
								Open <code>chrome://extensions</code>, enable Developer Mode,
								click <code>Load unpacked</code>, and select the extracted
								folder.
							</p>
						</div>
						<div>
							<p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-600">
								3. Start Qualifying
							</p>
							<p className="mt-2 text-sm leading-6 text-zinc-400">
								Open the extension popup, sign in with LinkedIn, and launch the
								side panel on LinkedIn to rank leads.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ---------- Footer ---------- */
function Footer({ signedIn }: { signedIn: boolean }) {
	return (
		<footer className="border-t border-white/[0.04] px-6 py-10">
			<div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
				<span className="text-sm text-zinc-600">SalesMAXXing</span>
				<nav className="flex gap-5">
					{signedIn && (
						<a
							href="/overview"
							className="text-sm text-zinc-500 transition hover:text-zinc-300"
						>
							Dashboard
						</a>
					)}
					<a
						href={EXTENSION_DOWNLOAD_URL}
						download
						className="text-sm text-zinc-500 transition hover:text-zinc-300"
					>
						Download
					</a>
					<a
						href="/privacy"
						className="text-sm text-zinc-500 transition hover:text-zinc-300"
					>
						Privacy
					</a>
					{!signedIn && (
						<a
							href="/sign-in"
							className="text-sm text-zinc-500 transition hover:text-zinc-300"
						>
							Sign in
						</a>
					)}
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
		<main className="min-h-screen bg-black text-white">
			<Nav signedIn={signedIn} />
			<Hero signedIn={signedIn} />
			<HowItWorks />
			<Features />
			<InstallSection />
			<Footer signedIn={signedIn} />
		</main>
	);
}
