import clsx from "clsx";
import { ArrowLeft, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { QualificationConfig } from "../types";

interface CustomQualFormProps {
	onSubmit: (config: QualificationConfig) => void;
	onBack: () => void;
	initialConfig?: Partial<QualificationConfig>;
}

interface TagInputProps {
	label: string;
	placeholder: string;
	tags: string[];
	onTagsChange: (tags: string[]) => void;
}

function TagInput({ label, placeholder, tags, onTagsChange }: TagInputProps) {
	const [inputValue, setInputValue] = useState("");

	const addTags = useCallback(
		(raw: string) => {
			const newTags = raw
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t.length > 0 && !tags.includes(t));
			if (newTags.length > 0) {
				onTagsChange([...tags, ...newTags]);
			}
		},
		[tags, onTagsChange],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputValue.trim()) {
				addTags(inputValue);
				setInputValue("");
			}
		} else if (e.key === "," && inputValue.trim()) {
			e.preventDefault();
			addTags(inputValue);
			setInputValue("");
		} else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
			onTagsChange(tags.slice(0, -1));
		}
	};

	const handleBlur = () => {
		if (inputValue.trim()) {
			addTags(inputValue);
			setInputValue("");
		}
	};

	const removeTag = (index: number) => {
		onTagsChange(tags.filter((_, i) => i !== index));
	};

	return (
		<label className="block">
			<span className="block text-sm text-zinc-400 mb-2">{label}</span>
			<div
				className={clsx(
					"flex flex-wrap gap-1.5 min-h-[46px] p-2",
					"bg-white/5 border border-white/10 rounded-xl",
					"focus-within:border-white/30 transition-colors duration-200",
				)}
			>
				{tags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 bg-white/10 text-white text-xs rounded-full px-3 py-1 shrink-0"
					>
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tags.indexOf(tag))}
							className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
							aria-label={`Remove ${tag}`}
						>
							<X className="size-3" />
						</button>
					</span>
				))}
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					placeholder={tags.length === 0 ? placeholder : ""}
					className="flex-1 min-w-[100px] bg-transparent text-white text-sm placeholder:text-zinc-600 outline-none py-1 px-1"
				/>
			</div>
		</label>
	);
}

export function CustomQualForm({
	onSubmit,
	onBack,
	initialConfig,
}: CustomQualFormProps) {
	const [keywords, setKeywords] = useState<string[]>(
		initialConfig?.keywords ?? [],
	);
	const [companyUrls, setCompanyUrls] = useState(
		initialConfig?.companyUrls?.join("\n") ?? "",
	);
	const [icpNotes, setIcpNotes] = useState(initialConfig?.icpNotes ?? "");
	const [industries, setIndustries] = useState<string[]>(
		initialConfig?.industries ?? [],
	);

	const canSubmit =
		keywords.length > 0 ||
		companyUrls.trim().length > 0 ||
		icpNotes.trim().length > 0 ||
		industries.length > 0;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;

		const parsedUrls = companyUrls
			.split(/[,\n]/)
			.map((u) => u.trim())
			.filter((u) => u.length > 0);

		onSubmit({
			mode: "custom",
			keywords,
			companyUrls: parsedUrls,
			icpNotes: icpNotes.trim(),
			industries,
		});
	};

	const inputClasses = clsx(
		"w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm",
		"placeholder:text-zinc-600 px-4 py-3",
		"focus:border-white/30 focus:outline-none transition-colors duration-200",
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col min-h-full px-6 py-6 animate-fade-in"
		>
			{/* Back button */}
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-200 mb-6 -ml-1 self-start cursor-pointer"
			>
				<ArrowLeft className="size-4" />
				<span className="text-sm">Back</span>
			</button>

			{/* Header */}
			<h1 className="text-xl font-bold text-white tracking-tight mb-1">
				Custom Criteria
			</h1>
			<p className="text-sm text-zinc-400 leading-relaxed mb-6">
				Tell us what makes a great lead for you. Fill in at least one field.
			</p>

			{/* Scrollable form body */}
			<div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-5 mb-6">
				{/* Keywords */}
				<TagInput
					label="Keywords"
					placeholder="VP Engineering, Series B, AI/ML..."
					tags={keywords}
					onTagsChange={setKeywords}
				/>

				{/* Industries */}
				<TagInput
					label="Industries"
					placeholder="Fintech, SaaS, Healthcare..."
					tags={industries}
					onTagsChange={setIndustries}
				/>

				{/* Company URLs */}
				<div>
					<label className="block text-sm text-zinc-400 mb-2">
						Target Companies
					</label>
					<textarea
						value={companyUrls}
						onChange={(e) => setCompanyUrls(e.target.value)}
						placeholder={"linkedin.com/company/acme\nlinkedin.com/company/globex"}
						rows={3}
						className={clsx(inputClasses, "resize-none")}
					/>
					<p className="text-xs text-zinc-600 mt-1">
						LinkedIn company URLs, one per line
					</p>
				</div>

				{/* ICP Notes */}
				<div>
					<label className="block text-sm text-zinc-400 mb-2">
						Ideal Customer Profile
					</label>
					<textarea
						value={icpNotes}
						onChange={(e) => setIcpNotes(e.target.value)}
						placeholder="Describe your ideal prospect. What role, seniority, company stage, or buying signals matter most?"
						rows={4}
						className={clsx(inputClasses, "resize-none")}
					/>
				</div>
			</div>

			{/* Submit */}
			<button
				type="submit"
				disabled={!canSubmit}
				className={clsx(
					"w-full font-semibold rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer",
					canSubmit
						? "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300"
						: "bg-white/10 text-zinc-500 cursor-not-allowed",
				)}
			>
				Find Leads
			</button>
		</form>
	);
}
