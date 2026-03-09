import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const extensionDir = resolve(repoRoot, "extension");
const distDir = resolve(extensionDir, "dist");
const publicDownloadsDir = resolve(repoRoot, "public/downloads");
const zipOutputPath = resolve(publicDownloadsDir, "salesmaxxing-extension.zip");

async function runCommand(command: string[], cwd: string) {
	const proc = Bun.spawn(command, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(stderr || `Command failed: ${command.join(" ")}`);
	}
}

function copyReleaseFiles(sourceDir: string, destinationDir: string) {
	mkdirSync(destinationDir, { recursive: true });

	for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
		if (entry.name.endsWith(".map")) {
			continue;
		}

		const sourcePath = join(sourceDir, entry.name);
		const destinationPath = join(destinationDir, entry.name);

		if (entry.isDirectory()) {
			copyReleaseFiles(sourcePath, destinationPath);
			continue;
		}

		cpSync(sourcePath, destinationPath);
	}
}

async function packageExtension() {
	await runCommand(["bun", "run", "scripts/build-extension.ts"], repoRoot);

	if (!existsSync(distDir)) {
		throw new Error(
			"Missing extension/dist. Extension build did not complete.",
		);
	}

	mkdirSync(publicDownloadsDir, { recursive: true });
	rmSync(zipOutputPath, { force: true });

	const stagingRoot = mkdtempSync(join(tmpdir(), "salesmaxxing-extension-"));
	const releaseDir = join(stagingRoot, "salesmaxxing-extension");

	try {
		copyReleaseFiles(distDir, releaseDir);
		await runCommand(
			["zip", "-rq", zipOutputPath, "salesmaxxing-extension"],
			stagingRoot,
		);
		// biome-ignore lint/suspicious/noConsole: packaging script status output
		console.log(
			`[SalesMAXXing] Extension package created → public/downloads/salesmaxxing-extension.zip`,
		);
	} finally {
		rmSync(stagingRoot, { force: true, recursive: true });
	}
}

await packageExtension();
