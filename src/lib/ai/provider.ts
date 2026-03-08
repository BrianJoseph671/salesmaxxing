/**
 * AI model provider configuration.
 *
 * Uses Vercel AI Gateway when AI_GATEWAY_API_KEY is set (preferred — unified
 * billing, retries, observability). Falls back to direct Anthropic provider
 * when only ANTHROPIC_API_KEY is available.
 *
 * Gateway model format uses "provider/model" prefix, e.g. "anthropic/claude-sonnet-4-20250514".
 */
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { normalizeConfiguredValue } from "@/src/lib/env";

const gatewayApiKey = normalizeConfiguredValue(process.env.AI_GATEWAY_API_KEY);
const gatewayBaseURL =
	normalizeConfiguredValue(process.env.AI_GATEWAY_BASE_URL) ||
	"https://ai-gateway.vercel.sh/v1";

const gatewayProvider = gatewayApiKey
	? createOpenAI({
			apiKey: gatewayApiKey,
			baseURL: gatewayBaseURL,
			name: "vercel-ai-gateway",
		})
	: null;

/** Default model for lead qualification (lower temperature, structured output). */
const QUALIFY_MODEL = "anthropic/claude-sonnet-4-20250514";
const QUALIFY_MODEL_DIRECT = "claude-sonnet-4-20250514";

/** Default model for InMail generation (higher temperature, creative). */
const INTRO_MODEL = "anthropic/claude-sonnet-4-20250514";
const INTRO_MODEL_DIRECT = "claude-sonnet-4-20250514";

export function getQualifyModel() {
	if (gatewayProvider) {
		return gatewayProvider(
			normalizeConfiguredValue(process.env.AI_QUALIFY_MODEL) || QUALIFY_MODEL,
		);
	}
	return anthropic(QUALIFY_MODEL_DIRECT);
}

export function getIntroModel() {
	if (gatewayProvider) {
		return gatewayProvider(
			normalizeConfiguredValue(process.env.AI_INTRO_MODEL) || INTRO_MODEL,
		);
	}
	return anthropic(INTRO_MODEL_DIRECT);
}
