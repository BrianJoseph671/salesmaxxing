// SPA navigation detection for LinkedIn's Ember.js client-side routing

type PageChangeCallback = (url: string) => void;

/**
 * Detects LinkedIn SPA navigation by polling location.href and
 * intercepting History API calls. Returns a cleanup function.
 */
export function onPageChange(callback: PageChangeCallback): () => void {
	let currentUrl = window.location.href;

	// Poll location.href every 500ms — most reliable for Ember
	const intervalId = setInterval(() => {
		const newUrl = window.location.href;
		if (newUrl !== currentUrl) {
			currentUrl = newUrl;
			callback(newUrl);
		}
	}, 500);

	// Override history.pushState and history.replaceState as backup
	const originalPushState = history.pushState.bind(history);
	const originalReplaceState = history.replaceState.bind(history);

	history.pushState = (...args: Parameters<typeof history.pushState>) => {
		originalPushState(...args);
		const newUrl = window.location.href;
		if (newUrl !== currentUrl) {
			currentUrl = newUrl;
			callback(newUrl);
		}
	};

	history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
		originalReplaceState(...args);
		const newUrl = window.location.href;
		if (newUrl !== currentUrl) {
			currentUrl = newUrl;
			callback(newUrl);
		}
	};

	// Cleanup: restore originals and stop polling
	return () => {
		clearInterval(intervalId);
		history.pushState = originalPushState;
		history.replaceState = originalReplaceState;
	};
}

/**
 * Checks if the URL matches a LinkedIn profile page (/in/*)
 */
export function isProfilePage(url?: string): boolean {
	const pathname = new URL(url ?? window.location.href).pathname;
	return /^\/in\/[^/]+\/?$/.test(pathname);
}

/**
 * Checks if the URL matches the connections page
 */
export function isConnectionsPage(url?: string): boolean {
	const pathname = new URL(url ?? window.location.href).pathname;
	return pathname.startsWith("/mynetwork/invite-connect/connections/");
}

/**
 * Checks if the URL matches the people search results page
 */
export function isSearchPage(url?: string): boolean {
	const pathname = new URL(url ?? window.location.href).pathname;
	return pathname.startsWith("/search/results/people/");
}

/**
 * Extracts the authenticated user's profile URL from LinkedIn's nav bar.
 * Looks for the "Me" dropdown profile link.
 */
export function getOwnProfileUrl(): string | null {
	// The "Me" dropdown contains a link to the user's profile
	const meLink = document.querySelector<HTMLAnchorElement>(
		'.global-nav__me .global-nav__me-content a[href*="/in/"]',
	);
	if (meLink?.href) {
		return meLink.href;
	}

	// Fallback: profile photo link in the nav
	const navProfileLink = document.querySelector<HTMLAnchorElement>(
		'a.global-nav__primary-link[href*="/in/"]',
	);
	if (navProfileLink?.href) {
		return navProfileLink.href;
	}

	// Fallback: feed identity module on the homepage
	const feedIdentityLink = document.querySelector<HTMLAnchorElement>(
		'.feed-identity-module__actor-meta a[href*="/in/"]',
	);
	if (feedIdentityLink?.href) {
		return feedIdentityLink.href;
	}

	return null;
}

/**
 * Waits for an element matching the selector to appear in the DOM.
 * Uses MutationObserver for efficiency, with a configurable timeout.
 */
export function waitForElement(
	selector: string,
	timeoutMs = 10000,
): Promise<Element | null> {
	return new Promise((resolve) => {
		// Check if element already exists
		const existing = document.querySelector(selector);
		if (existing) {
			resolve(existing);
			return;
		}

		let resolved = false;

		const observer = new MutationObserver(() => {
			const el = document.querySelector(selector);
			if (el && !resolved) {
				resolved = true;
				observer.disconnect();
				resolve(el);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Timeout fallback
		setTimeout(() => {
			if (!resolved) {
				resolved = true;
				observer.disconnect();
				resolve(null);
			}
		}, timeoutMs);
	});
}
