import clsx from "clsx";
import {
	ArrowLeft,
	Check,
	ClipboardCopy,
	Loader2,
	RefreshCw,
	Send,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QualifiedLead, Tone } from "../types";

interface InMailComposerProps {
	lead: QualifiedLead;
	onBack: () => void;
}

interface StoredSession {
	accessToken: string;
	appUrl: string;
	user: { id: string; name: string | null };
}

interface RepProfile {
	name: string;
	headline: string | null;
	company: string | null;
	about: string | null;
	experience: Array<{
		title: string;
		company: string;
		description: string | null;
	}>;
}

const toneOptions: { value: Tone; label: string; description: string }[] = [
	{
		value: "professional",
		label: "Professional",
		description: "Polished and direct",
	},
	{
		value: "casual",
		label: "Casual",
		description: "Warm and conversational",
	},
	{
		value: "mutual_connection",
		label: "Mutual",
		description: "Shared connections",
	},
];

async function getSession(): Promise<StoredSession | null> {
	try {
		const result = await chrome.storage.local.get("authSession");
		const s = result.authSession;
		if (s && typeof s === "object" && typeof s.accessToken === "string") {
			return s as StoredSession;
		}
	} catch {
		// storage unavailable
	}
	return null;
}

async function getRepProfile(): Promise<RepProfile> {
	try {
		const result = await chrome.storage.local.get("ownProfile");
		if (result.ownProfile && typeof result.ownProfile === "object") {
			const p = result.ownProfile as Record<string, unknown>;
			return {
				name: typeof p.name === "string" ? p.name : "Sales Rep",
				headline: typeof p.headline === "string" ? p.headline : null,
				company: null,
				about: typeof p.about === "string" ? p.about : null,
				experience: Array.isArray(p.experience)
					? (p.experience as RepProfile["experience"])
					: [],
			};
		}
	} catch {
		// fallback
	}
	return {
		name: "Sales Rep",
		headline: null,
		company: null,
		about: null,
		experience: [],
	};
}

export function InMailComposer({ lead, onBack }: InMailComposerProps) {
	const [tone, setTone] = useState<Tone>("professional");
	const [draft, setDraft] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const generateDraft = useCallback(
		async (selectedTone: Tone) => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			setIsGenerating(true);
			setError(null);
			setDraft("");

			try {
				const [session, repProfile] = await Promise.all([
					getSession(),
					getRepProfile(),
				]);

				if (!session) {
					setError("Not authenticated. Please sign in from the popup.");
					setIsGenerating(false);
					return;
				}

				const response = await fetch(`${session.appUrl}/api/generate-intro`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.accessToken}`,
					},
					body: JSON.stringify({
						repProfile,
						leadProfile: {
							name: lead.name,
							headline: lead.title,
							company: lead.company,
							about: null,
							location: lead.location,
							connectionDegree: lead.connectionDegree,
							experience: [],
							skills: [],
						},
						qualificationContext: {
							score: lead.score,
							justification: lead.justification,
							talkingPoints: lead.talkingPoints,
						},
						tone: selectedTone,
					}),
					signal: controller.signal,
				});

				if (!response.ok) {
					const text = await response.text();
					throw new Error(text || `HTTP ${String(response.status)}`);
				}

				const reader = response.body?.getReader();
				if (!reader) throw new Error("No response stream");

				const decoder = new TextDecoder();
				let accumulated = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					accumulated += decoder.decode(value, { stream: true });
					setDraft(accumulated);
				}

				// Fire-and-forget: persist the generated intro to Supabase
				if (accumulated) {
					fetch(`${session.appUrl}/api/intros`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session.accessToken}`,
						},
						body: JSON.stringify({
							leadName: lead.name,
							leadProfileUrl: lead.profileUrl,
							message: accumulated,
							tone: selectedTone,
						}),
					}).catch(() => {
						// Silently ignore persistence failures
					});
				}
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") return;
				setError(
					err instanceof Error ? err.message : "Failed to generate draft",
				);
			} finally {
				setIsGenerating(false);
			}
		},
		[lead],
	);

	const hasGeneratedRef = useRef(false);

	useEffect(() => {
		if (hasGeneratedRef.current) return;
		hasGeneratedRef.current = true;
		void generateDraft(tone);
		return () => {
			abortRef.current?.abort();
		};
	}, [generateDraft, tone]);

	const handleRegenerate = () => {
		void generateDraft(tone);
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(draft);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for extension context
			const textarea = document.createElement("textarea");
			textarea.value = draft;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleOpenInMail = () => {
		// Open the lead's profile where they can click the InMail button
		chrome.tabs.create({ url: lead.profileUrl });
	};

	// Auto-resize textarea when draft content changes
	const draftLength = draft.length;
	useEffect(() => {
		const ta = textareaRef.current;
		if (!ta || draftLength === 0) return;
		ta.style.height = "auto";
		ta.style.height = `${String(ta.scrollHeight)}px`;
	}, [draftLength]);

	return (
		<div className="flex flex-col min-h-full animate-fade-in">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 px-5 py-4">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-200 mb-3 -ml-1 cursor-pointer"
				>
					<ArrowLeft className="size-4" />
					<span className="text-sm">Back to leads</span>
				</button>

				{/* Lead info */}
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10">
						<span className="text-sm font-semibold text-white/70">
							{lead.name
								.split(" ")
								.map((p) => p[0])
								.join("")
								.slice(0, 2)
								.toUpperCase()}
						</span>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-white truncate">
							{lead.name}
						</p>
						<p className="text-xs text-zinc-400 truncate">
							{lead.title}
							{lead.company ? ` @ ${lead.company}` : ""}
						</p>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
				{/* Tone selector */}
				<div>
					<span className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
						Tone
					</span>
					<div className="flex gap-2">
						{toneOptions.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => setTone(opt.value)}
								className={clsx(
									"flex-1 text-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border",
									tone === opt.value
										? "bg-white text-black border-white"
										: "bg-white/5 text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-300",
								)}
							>
								{opt.label}
							</button>
						))}
					</div>
				</div>

				{/* Draft area */}
				<div>
					<span className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
						Draft
					</span>

					{error ? (
						<div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
							<p className="text-sm text-red-400">{error}</p>
							<button
								type="button"
								onClick={handleRegenerate}
								className="mt-2 text-xs text-red-300 hover:text-white transition-colors cursor-pointer underline"
							>
								Try again
							</button>
						</div>
					) : (
						<div className="relative">
							<textarea
								id="inmail-draft"
								name="inmail-draft"
								ref={textareaRef}
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								placeholder={
									isGenerating
										? "Generating your InMail..."
										: "Your draft will appear here"
								}
								rows={8}
								className={clsx(
									"w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm",
									"placeholder:text-zinc-600 px-4 py-3 resize-none",
									"focus:border-white/30 focus:outline-none transition-colors duration-200",
									"min-h-[200px]",
								)}
							/>
							{isGenerating && (
								<div className="absolute top-3 right-3">
									<Loader2 className="size-4 text-zinc-400 animate-spin" />
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Action bar */}
			<div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/5 px-5 py-4 space-y-2">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleRegenerate}
						disabled={isGenerating}
						className={clsx(
							"flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
							isGenerating
								? "bg-white/5 text-zinc-600 cursor-not-allowed"
								: "bg-white/10 text-white hover:bg-white/20",
						)}
					>
						<RefreshCw
							className={clsx("size-3.5", isGenerating && "animate-spin")}
						/>
						Regenerate
					</button>

					<button
						type="button"
						onClick={() => void handleCopy()}
						disabled={!draft || isGenerating}
						className={clsx(
							"flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
							!draft || isGenerating
								? "bg-white/5 text-zinc-600 cursor-not-allowed"
								: copied
									? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
									: "bg-white/10 text-white hover:bg-white/20",
						)}
					>
						{copied ? (
							<>
								<Check className="size-3.5" />
								Copied
							</>
						) : (
							<>
								<ClipboardCopy className="size-3.5" />
								Copy
							</>
						)}
					</button>

					<button
						type="button"
						onClick={handleOpenInMail}
						disabled={!draft || isGenerating}
						className={clsx(
							"flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer",
							!draft || isGenerating
								? "bg-white/10 text-zinc-500 cursor-not-allowed"
								: "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300",
						)}
					>
						<Send className="size-3.5" />
						Open Profile
					</button>
				</div>
			</div>
		</div>
	);
}
