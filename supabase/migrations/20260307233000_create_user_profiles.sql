create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

create table if not exists public.user_profiles (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid not null unique references auth.users(id) on delete cascade,
	email text,
	full_name text,
	avatar_url text,
	provider text not null default 'linkedin_oidc',
	linkedin_sub text,
	linkedin_data jsonb not null default '{}'::jsonb,
	last_sign_in_at timestamptz not null default timezone('utc', now()),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_profiles_auth_user_id
	on public.user_profiles(auth_user_id);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
	on public.user_profiles
	for select
	to authenticated
	using (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
	on public.user_profiles
	for insert
	to authenticated
	with check (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
	on public.user_profiles
	for update
	to authenticated
	using (auth.uid() = auth_user_id)
	with check (auth.uid() = auth_user_id);

drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own"
	on public.user_profiles
	for delete
	to authenticated
	using (auth.uid() = auth_user_id);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
	before update on public.user_profiles
	for each row
	execute function public.set_updated_at_timestamp();
