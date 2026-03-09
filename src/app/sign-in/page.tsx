type SignInPageProps = {
	searchParams?: Promise<{
		error?: string;
		extensionId?: string;
		next?: string;
	}>;
};

function getErrorCopy(error?: string) {
	if (error === "auth_callback_failed") {
		return "We couldn't complete your LinkedIn sign-in. Please try again.";
	}

	if (error === "linkedin_oauth_failed") {
		return "We couldn't start LinkedIn sign-in right now.";
	}

	if (error === "missing_supabase_config") {
		return "Sign-in is temporarily unavailable.";
	}

	if (error === "profile_sync_failed") {
		return "You signed in, but we couldn't finish setting up your account.";
	}

	return null;
}

function getReturnLabel(next: string) {
	return next === "/dashboard" ? "your dashboard" : "SalesMAXXing";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
	const params = searchParams ? await searchParams : undefined;
	const next = params?.next || "/";
	const error = getErrorCopy(params?.error);
	const extensionId =
		typeof params?.extensionId === "string" ? params.extensionId : undefined;
	const authSearchParams = new URLSearchParams({
		next,
	});

	if (extensionId) {
		authSearchParams.set("extensionId", extensionId);
	}

	const authHref = `/auth/linkedin?${authSearchParams.toString()}`;

	return (
		<main className="flex min-h-screen items-center bg-black px-6 py-16 text-white">
			<div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
				<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
					LinkedIn Sign-In
				</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-tight">
					Sign in to SalesMAXXing
				</h1>
				<p className="mt-4 text-base leading-7 text-zinc-400">
					Sign in with LinkedIn to connect your account, unlock the Chrome
					extension, and start ranking the strongest leads in your network.
				</p>
				{extensionId ? (
					<p className="mt-4 text-sm leading-6 text-zinc-500">
						After LinkedIn returns, SalesMAXXing will connect your browser
						session to the extension automatically.
					</p>
				) : null}
				{error ? (
					<p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
						{error}
					</p>
				) : null}
				<div className="mt-8 flex flex-wrap gap-3">
					<a
						className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						href={authHref}
					>
						Sign in with LinkedIn
					</a>
					<a
						className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
						href="/"
					>
						Back home
					</a>
				</div>
				<p className="mt-6 text-sm text-zinc-500">
					After sign-in, you'll return to {getReturnLabel(next)}.
				</p>
			</div>
		</main>
	);
}
