import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createRlsServerClient } from "@/src/lib/supabase/auth";

type JsonRecord = Record<string, unknown>;

function readString(value: unknown) {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function asRecord(value: unknown): JsonRecord {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as JsonRecord)
		: {};
}

function buildLinkedInData(user: User) {
	const userMetadata = asRecord(user.user_metadata);
	const appMetadata = asRecord(user.app_metadata);

	return {
		app_metadata: appMetadata,
		email: user.email ?? readString(userMetadata.email),
		email_confirmed_at: user.email_confirmed_at,
		family_name: readString(userMetadata.family_name),
		full_name:
			readString(userMetadata.full_name) ?? readString(userMetadata.name),
		given_name: readString(userMetadata.given_name),
		issuer: readString(userMetadata.iss),
		last_sign_in_at: user.last_sign_in_at,
		locale: readString(userMetadata.locale),
		picture:
			readString(userMetadata.avatar_url) ?? readString(userMetadata.picture),
		preferred_username: readString(userMetadata.preferred_username),
		provider: readString(appMetadata.provider) ?? "linkedin_oidc",
		sub: readString(userMetadata.sub),
		user_metadata: userMetadata,
	};
}

function buildUserProfileUpsert(user: User) {
	const userMetadata = asRecord(user.user_metadata);
	const appMetadata = asRecord(user.app_metadata);

	return {
		auth_user_id: user.id,
		avatar_url:
			readString(userMetadata.avatar_url) ?? readString(userMetadata.picture),
		email: user.email ?? readString(userMetadata.email),
		full_name:
			readString(userMetadata.full_name) ?? readString(userMetadata.name),
		last_sign_in_at: user.last_sign_in_at ?? new Date().toISOString(),
		linkedin_data: buildLinkedInData(user),
		linkedin_sub: readString(userMetadata.sub),
		provider: readString(appMetadata.provider) ?? "linkedin_oidc",
	};
}

export async function upsertUserProfile(supabase: SupabaseClient, user: User) {
	const { data, error } = await supabase
		.from("user_profiles")
		.upsert(buildUserProfileUpsert(user), {
			onConflict: "auth_user_id",
		})
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function upsertCurrentUserProfile() {
	const supabase = await createRlsServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new Error("Authentication required");
	}

	return upsertUserProfile(supabase, user);
}

export async function getCurrentUserProfile() {
	const supabase = await createRlsServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return null;
	}

	const { data, error: profileError } = await supabase
		.from("user_profiles")
		.select("*")
		.eq("auth_user_id", user.id)
		.maybeSingle();

	if (profileError) {
		throw profileError;
	}

	return data;
}
