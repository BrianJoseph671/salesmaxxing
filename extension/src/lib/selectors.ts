// Centralized CSS selectors for LinkedIn DOM extraction.
// LinkedIn changes their DOM frequently — keeping selectors here makes updates easy.
// Each group is an array of fallbacks: try the first, then the next, etc.

// ---------------------------------------------------------------------------
// Top card (name, headline, location, avatar, connection degree)
// ---------------------------------------------------------------------------

export const topCard = {
	/** Profile name — usually an h1 inside the intro/top-card section */
	name: [
		"h1.text-heading-xlarge",
		'[data-anonymize="person-name"]',
		".pv-top-card--list h1",
		".pv-text-details__left-panel h1",
		"section.pv-top-card h1",
		".artdeco-entity-lockup__title h1",
	],

	/** Headline (role / tagline below name) */
	headline: [
		".text-body-medium.break-words",
		'[data-anonymize="headline"]',
		".pv-top-card--list .text-body-medium",
		".pv-text-details__left-panel .text-body-medium",
	],

	/** Location line */
	location: [
		".text-body-small.inline.t-black--light.break-words",
		'[data-anonymize="location"]',
		".pv-top-card--list-bullet .text-body-small",
		".pv-text-details__left-panel .text-body-small",
	],

	/** Connection degree badge */
	connectionDegree: [
		".dist-value",
		".pv-top-card--list .text-body-small .dist-value",
		'span[class*="distance-badge"]',
	],

	/** Profile photo */
	avatar: [
		".pv-top-card-profile-picture__image",
		"img.profile-photo-edit__preview",
		'.pv-top-card__photo img[src*="profile"]',
		".presence-entity__image",
	],
} as const;

// ---------------------------------------------------------------------------
// About section
// ---------------------------------------------------------------------------

export const about = {
	/** The about/summary text container */
	content: [
		'[data-generated-suggestion-target="urn:li:fsu_profileActionDelegate"] .pv-shared-text-with-see-more span.visually-hidden',
		"#about ~ div .pv-shared-text-with-see-more span.visually-hidden",
		"#about ~ div .inline-show-more-text span[aria-hidden='true']",
		'section[data-view-name*="profile-card"] .pv-shared-text-with-see-more span.visually-hidden',
		".pv-about-section .pv-about__summary-text",
		".pv-about-section .inline-show-more-text",
	],

	/** Section heading — used to locate the about section when IDs are missing */
	sectionHeading: [
		"#about",
		'section:has(> div [id="about"])',
		'[data-view-name="profile-card-about"]',
	],
} as const;

// ---------------------------------------------------------------------------
// Experience section
// ---------------------------------------------------------------------------

export const experience = {
	/** The experience section container */
	section: [
		"#experience",
		'section:has(> div [id="experience"])',
		'[data-view-name="profile-card-experience"]',
		".pv-experience-section",
	],

	/** Individual experience items within the section */
	item: [
		".pvs-list__paged-list-item",
		".pv-entity__position-group-pager li",
		".pv-profile-section__list-item",
	],

	/** Job title within an experience item */
	title: [
		'.t-bold span[aria-hidden="true"]',
		".pv-entity__summary-info h3",
		".mr1.t-bold span",
	],

	/** Company name within an experience item */
	company: [
		'.t-normal span[aria-hidden="true"]',
		".pv-entity__secondary-title",
		".t-14.t-normal span",
	],

	/** Duration / date range */
	duration: [
		".pvs-entity__caption-wrapper",
		".t-black--light span.pvs-entity__caption-wrapper",
		".pv-entity__date-range span:nth-child(2)",
	],

	/** Location for the role */
	location: [
		".t-black--light.t-normal span:not(.pvs-entity__caption-wrapper)",
		".pv-entity__location span:nth-child(2)",
	],

	/** Description / bullet points */
	description: [
		".pvs-list__outer-container .inline-show-more-text",
		'.pv-shared-text-with-see-more span[aria-hidden="true"]',
		".pv-entity__description",
	],
} as const;

// ---------------------------------------------------------------------------
// Education section
// ---------------------------------------------------------------------------

export const education = {
	/** The education section container */
	section: [
		"#education",
		'section:has(> div [id="education"])',
		'[data-view-name="profile-card-education"]',
		".pv-education-section",
	],

	/** Individual education items */
	item: [
		".pvs-list__paged-list-item",
		".pv-profile-section__list-item",
		".pv-education-entity",
	],

	/** School name */
	school: [
		'.t-bold span[aria-hidden="true"]',
		".pv-entity__school-name",
		".mr1.t-bold span",
	],

	/** Degree (e.g., "Bachelor of Science") */
	degree: [
		'.t-normal span[aria-hidden="true"]',
		".pv-entity__degree-name span:nth-child(2)",
		".t-14.t-normal span",
	],

	/** Field of study */
	field: [".t-normal:nth-of-type(2) span", ".pv-entity__fos span:nth-child(2)"],

	/** Years attended */
	years: [
		".pvs-entity__caption-wrapper",
		".pv-entity__dates span:nth-child(2)",
		".t-black--light span",
	],
} as const;

// ---------------------------------------------------------------------------
// Skills section
// ---------------------------------------------------------------------------

export const skills = {
	/** The skills section container */
	section: [
		"#skills",
		'section:has(> div [id="skills"])',
		'[data-view-name="profile-card-skills"]',
		".pv-skill-categories-section",
	],

	/** Individual skill items */
	item: [
		".pvs-list__paged-list-item",
		".pv-skill-category-entity__name span",
		".pv-skill-entity__skill-name",
	],

	/** Skill name text within an item */
	name: [
		'.t-bold span[aria-hidden="true"]',
		".mr1.t-bold span",
		".pv-skill-category-entity__name span",
	],
} as const;

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Try each selector in order, returning the first element that matches.
 * Returns null when none of the selectors match.
 */
export function queryFirst(selectors: readonly string[]): Element | null {
	for (const selector of selectors) {
		const el = document.querySelector(selector);
		if (el) {
			return el;
		}
	}
	return null;
}

/**
 * Like `queryFirst`, but scoped to a parent element.
 */
export function queryFirstWithin(
	parent: Element,
	selectors: readonly string[],
): Element | null {
	for (const selector of selectors) {
		const el = parent.querySelector(selector);
		if (el) {
			return el;
		}
	}
	return null;
}

/**
 * Return ALL elements matching the first selector that produces results.
 * Falls through each selector until one returns at least one element.
 */
export function queryAllFirst(
	selectors: readonly string[],
): NodeListOf<Element> | null {
	for (const selector of selectors) {
		const els = document.querySelectorAll(selector);
		if (els.length > 0) {
			return els;
		}
	}
	return null;
}

/**
 * Return ALL elements matching the first selector that produces results,
 * scoped to a parent element.
 */
export function queryAllFirstWithin(
	parent: Element,
	selectors: readonly string[],
): NodeListOf<Element> | null {
	for (const selector of selectors) {
		const els = parent.querySelectorAll(selector);
		if (els.length > 0) {
			return els;
		}
	}
	return null;
}
