create table if not exists public.qualification_configs (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid not null references auth.users(id) on delete cascade,
	mode text not null,
	keywords text[],
	company_urls text[],
	icp_notes text,
	industries text[],
	is_active boolean not null default true,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_qualification_configs_auth_user_id
	on public.qualification_configs(auth_user_id);

alter table public.qualification_configs enable row level security;

drop policy if exists "qualification_configs_select_own" on public.qualification_configs;
create policy "qualification_configs_select_own"
	on public.qualification_configs
	for select
	to authenticated
	using (auth.uid() = auth_user_id);

drop policy if exists "qualification_configs_insert_own" on public.qualification_configs;
create policy "qualification_configs_insert_own"
	on public.qualification_configs
	for insert
	to authenticated
	with check (auth.uid() = auth_user_id);

drop policy if exists "qualification_configs_update_own" on public.qualification_configs;
create policy "qualification_configs_update_own"
	on public.qualification_configs
	for update
	to authenticated
	using (auth.uid() = auth_user_id)
	with check (auth.uid() = auth_user_id);

drop policy if exists "qualification_configs_delete_own" on public.qualification_configs;
create policy "qualification_configs_delete_own"
	on public.qualification_configs
	for delete
	to authenticated
	using (auth.uid() = auth_user_id);

drop trigger if exists set_qualification_configs_updated_at on public.qualification_configs;
create trigger set_qualification_configs_updated_at
	before update on public.qualification_configs
	for each row
	execute function public.set_updated_at_timestamp();

create table if not exists public.leads (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid not null references auth.users(id) on delete cascade,
	config_id uuid references public.qualification_configs(id) on delete set null,
	linkedin_url text not null,
	profile_data jsonb not null default '{}'::jsonb,
	name text,
	headline text,
	company text,
	score integer not null,
	justification text not null,
	key_signals text[],
	talking_points text[],
	status text not null default 'new',
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_leads_auth_user_id
	on public.leads(auth_user_id);

create index if not exists idx_leads_score
	on public.leads(score desc);

alter table public.leads enable row level security;

drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
	on public.leads
	for select
	to authenticated
	using (auth.uid() = auth_user_id);

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
	on public.leads
	for insert
	to authenticated
	with check (auth.uid() = auth_user_id);

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own"
	on public.leads
	for update
	to authenticated
	using (auth.uid() = auth_user_id)
	with check (auth.uid() = auth_user_id);

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own"
	on public.leads
	for delete
	to authenticated
	using (auth.uid() = auth_user_id);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
	before update on public.leads
	for each row
	execute function public.set_updated_at_timestamp();
