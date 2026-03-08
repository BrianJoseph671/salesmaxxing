import {
	about,
	education,
	experience,
	queryAllFirstWithin,
	queryFirst,
	queryFirstWithin,
	skills,
	topCard,
} from "./selectors";
import type { LinkedInProfile } from "./types";

// ---------------------------------------------------------------------------
// JSON-LD extraction (most reliable when present)
// ---------------------------------------------------------------------------

interface JsonLdPerson {
	"@type"?: string;
	name?: string;
	jobTitle?: string;
	address?: { addressLocality?: string };
	description?: string;
	url?: string;
	image?: string | { contentUrl?: string };
	alumniOf?: Array<{
		name?: string;
		"@type"?: string;
	}>;
	worksFor?: Array<{
		name?: string;
		"@type"?: string;
	}>;
}

function extractFromJsonLd(): Partial<LinkedInProfile> | null {
	const scripts = document.querySelectorAll(
		'script[type="application/ld+json"]',
	);

	for (const script of scripts) {
		try {
			const data = JSON.parse(script.textContent ?? "") as JsonLdPerson;
			if (data["@type"] !== "Person") {
				continue;
			}

			const imageUrl =
				typeof data.image === "string"
					? data.image
					: (data.image?.contentUrl ?? null);

			return {
				name: data.name ?? null,
				headline: data.jobTitle ?? null,
				location: data.address?.addressLocality ?? null,
				about: data.description ?? null,
				profileUrl: data.url ?? null,
				avatarUrl: imageUrl,
			};
		} catch {
			// Ignore malformed JSON-LD blocks
		}
	}

	return null;
}

// ---------------------------------------------------------------------------
// DOM extraction helpers
// ---------------------------------------------------------------------------

/** Get trimmed text content from an element, or null. */
function textOf(el: Element | null | undefined): string | null {
	const text = el?.textContent?.trim();
	return text && text.length > 0 ? text : null;
}

/** Extract connection degree from common DOM patterns. */
function extractConnectionDegree(): string | null {
	const el = queryFirst(topCard.connectionDegree);
	if (el) {
		const text = textOf(el);
		if (text) {
			const match = text.match(/(1st|2nd|3rd)/);
			if (match) {
				return match[1];
			}
		}
	}

	// Fallback: scan the top card area for degree text
	const topCardSection = document.querySelector(
		"section.pv-top-card, .scaffold-layout__main",
	);
	if (topCardSection) {
		const spans = topCardSection.querySelectorAll("span");
		for (const span of spans) {
			const t = span.textContent?.trim();
			if (t) {
				const match = t.match(/^(1st|2nd|3rd)$/);
				if (match) {
					return match[1];
				}
			}
		}
	}

	return null;
}

// ---------------------------------------------------------------------------
// Section extraction
// ---------------------------------------------------------------------------

function extractExperience(): LinkedInProfile["experience"] {
	const section = queryFirst(experience.section);
	if (!section) {
		return [];
	}

	// Walk up to the parent section if we hit the anchor element
	const container = section.closest("section") ?? section;
	const items = queryAllFirstWithin(container, experience.item);
	if (!items) {
		return [];
	}

	const results: LinkedInProfile["experience"] = [];

	for (const item of items) {
		const title = textOf(queryFirstWithin(item, experience.title));
		const company = textOf(queryFirstWithin(item, experience.company));

		// Skip items that don't have at least a title or company
		if (!title && !company) {
			continue;
		}

		results.push({
			title: title ?? "",
			company: company ?? "",
			duration: textOf(queryFirstWithin(item, experience.duration)),
			location: textOf(queryFirstWithin(item, experience.location)),
			description: textOf(queryFirstWithin(item, experience.description)),
		});
	}

	return results;
}

function extractEducation(): LinkedInProfile["education"] {
	const section = queryFirst(education.section);
	if (!section) {
		return [];
	}

	const container = section.closest("section") ?? section;
	const items = queryAllFirstWithin(container, education.item);
	if (!items) {
		return [];
	}

	const results: LinkedInProfile["education"] = [];

	for (const item of items) {
		const school = textOf(queryFirstWithin(item, education.school));
		if (!school) {
			continue;
		}

		results.push({
			school,
			degree: textOf(queryFirstWithin(item, education.degree)),
			field: textOf(queryFirstWithin(item, education.field)),
			years: textOf(queryFirstWithin(item, education.years)),
		});
	}

	return results;
}

function extractSkills(): string[] {
	const section = queryFirst(skills.section);
	if (!section) {
		return [];
	}

	const container = section.closest("section") ?? section;
	const items = queryAllFirstWithin(container, skills.item);
	if (!items) {
		return [];
	}

	const results: string[] = [];

	for (const item of items) {
		const name = textOf(queryFirstWithin(item, skills.name));
		if (name) {
			results.push(name);
		}
	}

	return results;
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

/**
 * Extract a LinkedIn profile from the current page DOM.
 *
 * Strategy:
 * 1. Try JSON-LD first (structured data, most reliable when present)
 * 2. Fill in missing fields from DOM selectors
 * 3. Return null for any field that cannot be determined
 */
export function extractProfile(): LinkedInProfile {
	// Start with JSON-LD data if available
	const jsonLd = extractFromJsonLd();

	// DOM-based extraction for fields JSON-LD may not cover
	const domName = textOf(queryFirst(topCard.name));
	const domHeadline = textOf(queryFirst(topCard.headline));
	const domLocation = textOf(queryFirst(topCard.location));
	const domAbout = textOf(queryFirst(about.content));
	const domAvatar = queryFirst(topCard.avatar)?.getAttribute("src") ?? null;

	// Canonical profile URL from the page
	const canonicalLink = document.querySelector(
		'link[rel="canonical"]',
	) as HTMLLinkElement | null;
	const domProfileUrl =
		canonicalLink?.href ?? window.location.href.split("?")[0];

	return {
		// Prefer JSON-LD, fall back to DOM
		name: jsonLd?.name ?? domName,
		headline: jsonLd?.headline ?? domHeadline,
		location: jsonLd?.location ?? domLocation,
		about: jsonLd?.about ?? domAbout,
		profileUrl: jsonLd?.profileUrl ?? domProfileUrl,
		avatarUrl: jsonLd?.avatarUrl ?? domAvatar,

		// These are DOM-only
		connectionDegree: extractConnectionDegree(),
		experience: extractExperience(),
		education: extractEducation(),
		skills: extractSkills(),

		extractedAt: new Date().toISOString(),
	};
}
