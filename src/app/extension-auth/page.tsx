import { Suspense } from "react";
import ExtensionAuthBridge from "./bridge";

export const dynamic = "force-dynamic";

function LoadingState() {
	return (
		<main className="flex min-h-screen items-center bg-black px-6 py-16 text-white">
			<div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
				<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
					Chrome Extension
				</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-tight">
					Connecting your extension
				</h1>
				<p className="mt-4 text-base leading-7 text-zinc-400">
					Preparing your sign-in.
				</p>
			</div>
		</main>
	);
}

export default function ExtensionAuthPage() {
	return (
		<Suspense fallback={<LoadingState />}>
			<ExtensionAuthBridge />
		</Suspense>
	);
}
