const escapedNewlinePattern = /\\n/g;

export function normalizeConfiguredValue(value: string | undefined | null) {
	if (!value) {
		return "";
	}

	return value.replace(escapedNewlinePattern, "").trim();
}
