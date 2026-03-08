import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { type BuildConfig, build } from "bun";

const isWatch = process.argv.includes("--watch");
const shouldMinify = process.argv.includes("--minify");
const extensionDir = resolve(import.meta.dir, "../extension");
const outDir = resolve(extensionDir, "dist");

// Ensure output dir exists
mkdirSync(outDir, { recursive: true });

const sharedConfig: Partial<BuildConfig> = {
	outdir: outDir,
	target: "browser",
	format: "esm",
	minify: shouldMinify,
	sourcemap: "linked",
};

// Compile Tailwind CSS for the side panel
async function buildTailwindCSS() {
	const inputCss = resolve(extensionDir, "src/sidepanel.css");
	const outputCss = resolve(outDir, "sidepanel.css");

	const args = ["@tailwindcss/cli", "-i", inputCss, "-o", outputCss];

	if (!isWatch) {
		args.push("--minify");
	}

	const proc = Bun.spawn(["bunx", ...args], {
		cwd: resolve(import.meta.dir, ".."),
		stdout: "pipe",
		stderr: "pipe",
	});

	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(`Tailwind CSS build failed:\n${stderr}`);
	}
}

// Build all extension entry points
async function buildExtension() {
	const results = await Promise.all([
		build({
			...sharedConfig,
			entrypoints: [resolve(extensionDir, "src/popup.tsx")],
			naming: "popup.js",
		}),
		build({
			...sharedConfig,
			entrypoints: [resolve(extensionDir, "src/sidepanel.tsx")],
			naming: "sidepanel.js",
		}),
		build({
			...sharedConfig,
			entrypoints: [resolve(extensionDir, "src/content.ts")],
			naming: "content.js",
		}),
		build({
			...sharedConfig,
			entrypoints: [resolve(extensionDir, "src/background.ts")],
			naming: "background.js",
		}),
	]);

	const allSuccess = results.every((r) => r.success);

	// Build Tailwind CSS for side panel
	await buildTailwindCSS();

	// Copy static files to dist
	cpSync(
		resolve(extensionDir, "manifest.json"),
		resolve(outDir, "manifest.json"),
	);
	cpSync(resolve(extensionDir, "popup.html"), resolve(outDir, "popup.html"));
	cpSync(
		resolve(extensionDir, "sidepanel.html"),
		resolve(outDir, "sidepanel.html"),
	);

	// Copy icons if they exist
	try {
		cpSync(resolve(extensionDir, "icons"), resolve(outDir, "icons"), {
			recursive: true,
		});
	} catch {
		// Icons dir doesn't exist yet, that's fine
	}

	if (allSuccess) {
		// biome-ignore lint/suspicious/noConsole: build script
		console.log(
			"[SalesMAXXing] Extension built successfully → extension/dist/",
		);
	} else {
		for (const result of results) {
			if (!result.success) {
				// biome-ignore lint/suspicious/noConsole: build script
				console.error("[SalesMAXXing] Build errors:", result.logs);
			}
		}
		process.exit(1);
	}
}

buildExtension();
