import { getUser } from "@/src/lib/supabase/auth";

export default async function Home() {
	const user = await getUser();
	const name =
		typeof user?.user_metadata?.full_name === "string"
			? user.user_metadata.full_name
			: user?.email || null;

	return (
		<main className="min-h-screen bg-black px-6 py-16 text-white">
			<div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col justify-center gap-12">
				<div className="max-w-3xl">
					<p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
						Chrome Extension + Web App
					</p>
					<h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-7xl">
						SalesMAXXing
					</h1>
					<p className="mt-6 text-lg leading-8 text-zinc-400 sm:text-xl">
						AI-powered lead qualification from your LinkedIn network.
						Authenticate with LinkedIn first, then the extension can attach to
						the same session.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					{user ? (
						<>
							<a
								className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
								href="/overview"
							>
								Open overview
							</a>
							<a
								className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
								href="/auth/sign-out"
							>
								Sign out
							</a>
						</>
					) : (
						<a
							className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
							href="/auth/linkedin?next=/overview"
						>
							Sign in with LinkedIn
						</a>
					)}
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
						<p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
							Status
						</p>
						<p className="mt-3 text-2xl font-semibold">
							{user ? "Authenticated" : "Not signed in"}
						</p>
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							{user
								? `Current session: ${name}`
								: "OAuth wiring is now in place. The remaining non-code step is adding SalesMAXXing callback URLs to the reused Supabase project."}
						</p>
					</div>
					<div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
						<p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
							Auth endpoint
						</p>
						<p className="mt-3 text-2xl font-semibold">/api/auth/status</p>
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							Use this to confirm the current Supabase session while we wire the
							extension popup and side panel to real auth state.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
