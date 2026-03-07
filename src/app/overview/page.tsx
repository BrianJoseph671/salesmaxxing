import { redirect } from "next/navigation";
import { getUser } from "@/src/lib/supabase/auth";

export default async function OverviewPage() {
	const user = await getUser();

	if (!user) {
		redirect("/sign-in?next=/overview");
	}

	const name =
		typeof user.user_metadata?.full_name === "string"
			? user.user_metadata.full_name
			: user.email || "LinkedIn user";

	return (
		<main className="min-h-screen bg-black px-6 py-16 text-white">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-8">
					<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
						Authenticated
					</p>
					<h1 className="mt-4 text-4xl font-semibold tracking-tight">{name}</h1>
					<p className="mt-3 max-w-2xl text-base text-zinc-400">
						LinkedIn OAuth is working through the reused Supabase project. This
						is the staging point before we connect the extension popup and side
						panel to the real session state.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<a
							className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
							href="/auth/sign-out"
						>
							Sign out
						</a>
						<a
							className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
							href="/api/auth/status"
						>
							View auth status JSON
						</a>
					</div>
				</div>
				<div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
					<h2 className="text-lg font-semibold text-white">Session snapshot</h2>
					<pre className="mt-4 overflow-x-auto text-sm leading-6 text-zinc-300">
						{JSON.stringify(
							{
								appMetadata: user.app_metadata,
								email: user.email,
								id: user.id,
								userMetadata: user.user_metadata,
							},
							null,
							2,
						)}
					</pre>
				</div>
			</div>
		</main>
	);
}
