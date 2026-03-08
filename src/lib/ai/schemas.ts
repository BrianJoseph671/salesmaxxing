import { z } from "zod";

// Schema for a single LinkedIn connection sent to the API
export const connectionSchema = z.object({
	name: z.string(),
	headline: z.string().nullable(),
	profileUrl: z.string(),
	avatarUrl: z.string().nullable(),
});

// Schema for user profile context sent to the API
export const userProfileSchema = z.object({
	name: z.string().nullable(),
	headline: z.string().nullable(),
	location: z.string().nullable(),
	about: z.string().nullable(),
	experience: z.array(
		z.object({
			title: z.string(),
			company: z.string(),
			duration: z.string().nullable(),
			location: z.string().nullable(),
			description: z.string().nullable(),
		}),
	),
	education: z.array(
		z.object({
			school: z.string(),
			degree: z.string().nullable(),
			field: z.string().nullable(),
			years: z.string().nullable(),
		}),
	),
	skills: z.array(z.string()),
});

// Custom qualification config
export const customConfigSchema = z.object({
	keywords: z.array(z.string()).optional(),
	companyUrls: z.array(z.string()).optional(),
	icpNotes: z.string().optional(),
	industries: z.array(z.string()).optional(),
});

// The request body for /api/qualify
export const qualifyRequestSchema = z.object({
	mode: z.enum(["automatic", "custom"]),
	userProfile: userProfileSchema,
	connections: z.array(connectionSchema).min(1).max(500),
	customConfig: customConfigSchema.optional(),
});

// A single qualified lead in the AI response
export const qualifiedLeadSchema = z.object({
	name: z.string().describe("The lead's full name"),
	headline: z.string().describe("The lead's current title and company"),
	profileUrl: z.string().describe("LinkedIn profile URL"),
	score: z
		.number()
		.min(0)
		.max(100)
		.describe(
			"Qualification score from 0-100, where 100 is the most qualified",
		),
	justification: z
		.string()
		.describe("2-3 sentence explanation of why this person is a strong lead"),
	keySignals: z
		.array(z.string())
		.describe("3-5 specific signals that indicate this is a good lead"),
	talkingPoints: z
		.array(z.string())
		.describe("2-3 personalized conversation starters for outreach"),
});

// The full AI response schema
export const qualifyResponseSchema = z.object({
	leads: z
		.array(qualifiedLeadSchema)
		.describe("Top 5-10 qualified leads, ranked by score descending"),
	summary: z
		.string()
		.describe("Brief 1-2 sentence overview of the qualification results"),
});

// TypeScript types derived from schemas
export type QualifyRequest = z.infer<typeof qualifyRequestSchema>;
export type QualifiedLead = z.infer<typeof qualifiedLeadSchema>;
export type QualifyResponse = z.infer<typeof qualifyResponseSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CustomConfig = z.infer<typeof customConfigSchema>;
