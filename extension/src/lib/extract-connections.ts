import type { LinkedInConnection } from "./types";

const CONNECTIONS_PATH = "/mynetwork/invite-connect/connections/";
const MAX_CONNECTIONS = 1000;
const MAX_STALE_SCROLLS = 3;
const SCROLL_DELAY_MIN = 1500;
const SCROLL_DELAY_MAX = 3000;

function safeQueryAll(
	target: Document | Element,
	selector: string,
): HTMLElement[] {
	try {
		return Array.from(target.querySelectorAll<HTMLElement>(selector));
	} catch {
		return [];
	}
}

function safeQuery(
	target: Element,
	selector: string,
): Element | null {
	try {
		return target.querySelector(selector);
	} catch {
		return null;
	}
}

/**
 * Detects whether the current page is the LinkedIn connections page.
 */
export function isConnectionsPage(): boolean {
	return window.location.pathname.startsWith(CONNECTIONS_PATH);
}

/**
 * Finds connection card elements using multiple selector strategies,
 * falling back through each until cards are found.
 */
function findConnectionCards(): HTMLElement[] {
	const selectors = [
		"li.mn-connection-card",
		".mn-connection-card",
		'[data-view-name*="connection"]',
		".reusable-search__result-container",
		".scaffold-finite-scroll__content li",
	];

	for (const selector of selectors) {
		const cards = safeQueryAll(document, selector);
		if (cards.length > 0) {
			return cards;
		}
	}

	return [];
}

/**
 * Extracts a profile URL from a card element, normalizing it to a full URL.
 */
function extractProfileUrl(card: HTMLElement): string | null {
	const linkSelectors = [
		'a[data-control-name="connection_profile"]',
		"a[href*='/in/']",
	];

	for (const selector of linkSelectors) {
		const link = safeQuery(card, selector) as HTMLAnchorElement | null;
		if (link?.href) {
			return normalizeProfileUrl(link.href);
		}
	}

	return null;
}

/**
 * Normalizes a LinkedIn profile URL to its canonical form.
 */
function normalizeProfileUrl(href: string): string {
	try {
		const url = new URL(href, window.location.origin);
		// Strip query params and trailing slash for dedup consistency
		const cleanPath = url.pathname.replace(/\/+$/, "");
		return `https://www.linkedin.com${cleanPath}`;
	} catch {
		return href;
	}
}

/**
 * Extracts connection name from a card element.
 */
function extractName(card: HTMLElement): string | null {
	const nameSelectors = [
		'a[data-control-name="connection_profile"]',
		".mn-connection-card__name",
		'[aria-label] span[dir="ltr"]',
	];

	for (const selector of nameSelectors) {
		const el = safeQuery(card, selector);
		const text = el?.textContent?.trim();
		if (text) {
			return text;
		}
	}

	// Fallback: first link with /in/ path likely contains the name
	const profileLink = safeQuery(card, "a[href*='/in/']") as
		| HTMLAnchorElement
		| null;
	const linkText = profileLink?.textContent?.trim();
	if (linkText) {
		return linkText;
	}

	return null;
}

/**
 * Extracts the headline/occupation from a card element.
 */
function extractHeadline(card: HTMLElement): string | null {
	const headlineSelectors = [
		".mn-connection-card__occupation",
		'[class*="member-insights"]',
		"p.t-14",
		"span.t-14.t-normal",
	];

	for (const selector of headlineSelectors) {
		const el = safeQuery(card, selector);
		const text = el?.textContent?.trim();
		if (text) {
			return text;
		}
	}

	return null;
}

/**
 * Extracts the avatar URL from a card element.
 */
function extractAvatarUrl(card: HTMLElement): string | null {
	const img = safeQuery(card, "img") as HTMLImageElement | null;
	if (img?.src && !img.src.includes("data:image")) {
		return img.src;
	}
	return null;
}

/**
 * Parses a single connection card element into a LinkedInConnection object.
 * Returns null if required fields (name, profileUrl) are missing.
 */
function parseConnectionCard(card: HTMLElement): LinkedInConnection | null {
	const profileUrl = extractProfileUrl(card);
	if (!profileUrl) {
		return null;
	}

	const name = extractName(card);
	if (!name) {
		return null;
	}

	return {
		name,
		headline: extractHeadline(card),
		profileUrl,
		avatarUrl: extractAvatarUrl(card),
		extractedAt: new Date().toISOString(),
	};
}

/**
 * Extracts all currently visible connection cards from the DOM.
 * Does not scroll — only reads what is rendered right now.
 */
export function extractVisibleConnections(): LinkedInConnection[] {
	const cards = findConnectionCards();
	const connections: LinkedInConnection[] = [];

	for (const card of cards) {
		const connection = parseConnectionCard(card);
		if (connection) {
			connections.push(connection);
		}
	}

	return connections;
}

/**
 * Returns a random delay between min and max milliseconds.
 */
function randomDelay(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Waits for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Scrolls the page and extracts all connections, deduplicating by profile URL.
 *
 * Uses virtual-scroll-aware strategy: LinkedIn only keeps ~40 cards in the DOM
 * at a time, so we scroll at human speed and capture as we go.
 *
 * Stops when:
 * - No new connections appear after MAX_STALE_SCROLLS consecutive scroll attempts
 * - MAX_CONNECTIONS cap is reached
 *
 * @param onProgress - Optional callback invoked with the current unique count after each scroll
 * @returns All unique connections found
 */
export async function scrollAndExtractConnections(
	onProgress?: (count: number, total: number | null) => void,
): Promise<LinkedInConnection[]> {
	const seen = new Set<string>();
	const connections = new Map<string, LinkedInConnection>();
	let staleScrolls = 0;

	// Capture initial visible connections before scrolling
	captureVisible(connections, seen);
	onProgress?.(connections.size, null);

	while (
		staleScrolls < MAX_STALE_SCROLLS &&
		connections.size < MAX_CONNECTIONS
	) {
		const previousSize = connections.size;

		// Scroll down by roughly one viewport height
		window.scrollBy({
			top: window.innerHeight,
			behavior: "smooth",
		});

		// Wait for LinkedIn's virtual scroll to render new cards
		const delay = randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX);
		await sleep(delay);

		// Capture whatever is now visible
		captureVisible(connections, seen);
		onProgress?.(connections.size, null);

		if (connections.size === previousSize) {
			staleScrolls++;
			// biome-ignore lint/suspicious/noConsole: extraction progress logging
			console.log(
				`[SalesMAXXing] No new connections after scroll (${staleScrolls}/${MAX_STALE_SCROLLS})`,
			);
		} else {
			staleScrolls = 0;
		}
	}

	// biome-ignore lint/suspicious/noConsole: extraction summary logging
	console.log(
		`[SalesMAXXing] Extraction complete: ${connections.size} unique connections`,
	);

	return Array.from(connections.values());
}

/**
 * Reads currently visible cards and merges new ones into the accumulator.
 */
function captureVisible(
	connections: Map<string, LinkedInConnection>,
	seen: Set<string>,
): void {
	const visible = extractVisibleConnections();

	for (const connection of visible) {
		if (!seen.has(connection.profileUrl)) {
			seen.add(connection.profileUrl);
			connections.set(connection.profileUrl, connection);
		}
	}
}
