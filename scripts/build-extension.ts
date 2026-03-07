import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { type BuildConfig, build } from "bun";

const isWatch = process.argv.includes("--watch");
const extensionDir = resolve(import.meta.dir, "../extension");
const outDir = resolve(extensionDir, "dist");

// Ensure output dir exists
mkdirSync(outDir, { recursive: true });

const sharedConfig: Partial<BuildConfig> = {
	outdir: outDir,
	target: "browser",
	format: "esm",
	minify: !isWatch,
	sourcemap: isWatch ? "linked" : "none",
};

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
