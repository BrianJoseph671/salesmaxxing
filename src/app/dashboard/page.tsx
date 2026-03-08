import { Download, ExternalLink, Linkedin } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/src/lib/supabase/auth";
import { getCurrentUserProfile } from "@/src/lib/supabase/user-profiles";

const EXTENSION_DOWNLOAD_URL = "/downloads/salesmaxxing-extension.zip";
const LINKEDIN_URL =
	"https://www.linkedin.com/mynetwork/invite-connect/connections/";

function formatDate(dateValue: string | null | undefined) {
	if (!dateValue) {
		return "Recently";
	}

	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		return "Recently";
	}

	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

export default async function DashboardPage() {
	const user = await getUser();
	const profile = await getCurrentUserProfile();

	if (!user) {
		redirect("/sign-in?next=/dashboard");
	}

	const name =
		typeof user.user_metadata?.full_name === "string"
			? user.user_metadata.full_name
			: user.email || "LinkedIn user";
	const linkedInStatus =
		typeof profile?.provider === "string"
			? "Connected and ready to use"
			: "Finish signing in to connect LinkedIn";
	const lastSignInAt =
		typeof profile?.last_sign_in_at === "string"
			? profile.last_sign_in_at
			: user.last_sign_in_at;

	return (
		<main className="min-h-screen bg-black px-6 py-16 text-white">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
				<section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-black/30">
					<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
						Dashboard
					</p>
					<h1 className="mt-4 text-4xl font-semibold tracking-tight">{name}</h1>
					<p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
						Your account is ready. Download the extension, open LinkedIn, and
						start qualifying the strongest opportunities already inside your
						network.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<a
							className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
							href={EXTENSION_DOWNLOAD_URL}
							download
						>
							Download Extension ZIP
							<Download className="h-4 w-4" />
						</a>
						<a
							className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
							href={LINKEDIN_URL}
							target="_blank"
							rel="noreferrer"
						>
							Open LinkedIn Connections
							<Linkedin className="h-4 w-4" />
						</a>
						<a
							className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
							href="/privacy"
						>
							Privacy Policy
						</a>
						<a
							className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
							href="/auth/sign-out"
						>
							Sign out
						</a>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
						<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
							Next Steps
						</p>
						<div className="mt-8 space-y-6">
							<div className="flex gap-4">
								<span className="text-sm font-medium text-zinc-600">01</span>
								<div>
									<h2 className="text-base font-semibold text-white">
										Download the extension
									</h2>
									<p className="mt-1 text-sm leading-6 text-zinc-400">
										Grab the latest ZIP, unzip it, and keep the extracted{" "}
										<code>salesmaxxing-extension</code> folder handy.
									</p>
								</div>
							</div>
							<div className="flex gap-4">
								<span className="text-sm font-medium text-zinc-600">02</span>
								<div>
									<h2 className="text-base font-semibold text-white">
										Load it in Chrome
									</h2>
									<p className="mt-1 text-sm leading-6 text-zinc-400">
										Open <code>chrome://extensions</code>, enable Developer
										Mode, then click <code>Load unpacked</code> and select the
										extracted folder.
									</p>
								</div>
							</div>
							<div className="flex gap-4">
								<span className="text-sm font-medium text-zinc-600">03</span>
								<div>
									<h2 className="text-base font-semibold text-white">
										Start qualifying on LinkedIn
									</h2>
									<p className="mt-1 text-sm leading-6 text-zinc-400">
										Open LinkedIn Connections, launch the extension popup, and
										use SalesMAXXing to rank leads and draft outreach.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
						<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
							Account
						</p>
						<div className="mt-6 space-y-5">
							<div>
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
									Name
								</p>
								<p className="mt-2 text-base font-semibold text-white">
									{name}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
									Email
								</p>
								<p className="mt-2 text-sm text-zinc-300">
									{user.email ?? "Connected with LinkedIn"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
									LinkedIn
								</p>
								<p className="mt-2 text-sm text-zinc-300">{linkedInStatus}</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
									Last sign-in
								</p>
								<p className="mt-2 text-sm text-zinc-300">
									{formatDate(lastSignInAt)}
								</p>
							</div>
						</div>

						<div className="mt-8 rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5">
							<p className="text-xs uppercase tracking-[0.24em] text-zinc-600">
								Need the extension?
							</p>
							<a
								className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-zinc-300"
								href={EXTENSION_DOWNLOAD_URL}
								download
							>
								Download the latest build
								<ExternalLink className="h-4 w-4" />
							</a>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
