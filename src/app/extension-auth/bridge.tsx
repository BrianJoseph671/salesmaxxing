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
		return "/";
	}

	return next;
}

async function sendSessionToExtension(
	extensionId: string,
	payload: ExtensionSessionPayload,
) {
	if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
		throw new Error(
			"Chrome couldn't find the SalesMAXXing extension in this tab. Reopen the extension and try again.",
		);
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
							response?.error ||
								"SalesMAXXing couldn't finish connecting the extension.",
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
				message:
					"We couldn't find the extension handoff. Reopen the popup and try again.",
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
					throw new Error("We couldn't verify your current sign-in session.");
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
						: "We couldn't connect your extension. Please reopen the popup and try again.";
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
					Chrome Extension
				</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-tight">
					{syncState.status === "success"
						? "You're signed in"
						: syncState.status === "error"
							? "We couldn't finish setup"
							: "Connecting your extension"}
				</h1>
				<p className="mt-4 text-base leading-7 text-zinc-400">
					{syncState.status === "success"
						? `Signed in as ${syncState.name}. You can return to LinkedIn and open the SalesMAXXing popup.`
						: syncState.status === "error"
							? syncState.message
							: "Finishing the connection between your browser session and the SalesMAXXing extension."}
				</p>
				<div className="mt-8 flex flex-wrap gap-3">
					<Link
						className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
						href="/dashboard"
					>
						Open Dashboard
					</Link>
					<a
						className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
						href="https://www.linkedin.com/mynetwork/invite-connect/connections/"
						target="_blank"
						rel="noreferrer"
					>
						Open LinkedIn Connections
					</a>
					<Link
						className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
						href="/sign-in"
					>
						Try Again
					</Link>
				</div>
			</div>
		</main>
	);
}
