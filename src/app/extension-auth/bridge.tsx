"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type ExtensionSessionPayload = {
	session: {
		accessToken: string;
		expiresAt: number | null;
		expiresIn: number | null;
		refreshToken: string;
		tokenType: string;
	};
	user: {
		email: string | null;
		id: string;
		name: string | null;
	};
};

type SyncState =
	| { status: "syncing" }
	| { status: "success"; name: string }
	| { message: string; status: "error" };

function getSafeNextPath(next: string | null) {
	if (!next || !next.startsWith("/") || next.startsWith("//")) {
		return "/overview";
	}

	return next;
}

async function sendSessionToExtension(
	extensionId: string,
	payload: ExtensionSessionPayload,
) {
	if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
		throw new Error("Chrome extension messaging is unavailable in this tab.");
	}

	await new Promise<void>((resolve, reject) => {
		chrome.runtime.sendMessage(
			extensionId,
			{
				appUrl: window.location.origin,
				session: payload.session,
				type: "salesmaxxing:auth-session",
				user: payload.user,
			},
			(response?: { error?: string; ok?: boolean }) => {
				const runtimeError = chrome.runtime.lastError;

				if (runtimeError) {
					reject(new Error(runtimeError.message));
					return;
				}

				if (!response?.ok) {
					reject(
						new Error(
							response?.error || "The extension rejected the auth session.",
						),
					);
					return;
				}

				resolve();
			},
		);
	});
}

export default function ExtensionAuthBridge() {
	const searchParams = useSearchParams();
	const [syncState, setSyncState] = useState<SyncState>({ status: "syncing" });

	useEffect(() => {
		const extensionId = searchParams.get("extensionId");
		const nextPath = getSafeNextPath(searchParams.get("next"));

		if (!extensionId) {
			setSyncState({
				message: "Missing Chrome extension ID in the callback handoff.",
				status: "error",
			});
			return;
		}

		let isCancelled = false;

		const syncSession = async () => {
			try {
				const response = await fetch("/api/auth/extension-session", {
					cache: "no-store",
					credentials: "include",
				});

				if (!response.ok) {
					throw new Error("SalesMAXXing could not load the current session.");
				}

				const payload = (await response.json()) as ExtensionSessionPayload;

				await sendSessionToExtension(extensionId, payload);

				if (isCancelled) {
					return;
				}

				const name = payload.user.name ?? payload.user.email ?? "LinkedIn user";
				setSyncState({ name, status: "success" });

				window.setTimeout(() => {
					window.location.replace(nextPath);
				}, 900);
			} catch (error) {
				if (isCancelled) {
					return;
				}

				const message =
					error instanceof Error
						? error.message
						: "SalesMAXXing could not sync the session to the extension.";
				setSyncState({ message, status: "error" });
			}
		};

		void syncSession();

		return () => {
			isCancelled = true;
		};
	}, [searchParams]);

	return (
		<main className="flex min-h-screen items-center bg-black px-6 py-16 text-white">
			<div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
				<p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
					Extension Session Sync
				</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-tight">
					{syncState.status === "success"
						? "Extension connected"
						: syncState.status === "error"
							? "Could not connect the extension"
							: "Connecting your extension"}
				</h1>
				<p className="mt-4 text-base leading-7 text-zinc-400">
					{syncState.status === "success"
						? `Signed in as ${syncState.name}. You can reopen the SalesMAXXing popup now.`
						: syncState.status === "error"
							? syncState.message
							: "Passing your Supabase session from the web callback into chrome.storage so the extension can use it directly."}
				</p>
				<div className="mt-8 flex flex-wrap gap-3">
					<Link
						className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						href="/overview"
					>
						Open overview
					</Link>
					<Link
						className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
						href="/sign-in"
					>
						Restart sign-in
					</Link>
				</div>
			</div>
		</main>
	);
}
