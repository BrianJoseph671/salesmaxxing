create table if not exists public.intros (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid not null references auth.users(id) on delete cascade,
	lead_id uuid references public.leads(id) on delete set null,
	lead_name text not null,
	lead_headline text,
	lead_profile_url text,
	lead_profile_data jsonb not null default '{}'::jsonb,
	qualification_score integer,
	qualification_justification text,
	tone text not null,
	subject_line text,
	message_body text not null,
	version integer not null default 1,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_intros_auth_user_id
	on public.intros(auth_user_id);

create index if not exists idx_intros_created_at
	on public.intros(created_at desc);

alter table public.intros enable row level security;

drop policy if exists "intros_select_own" on public.intros;
create policy "intros_select_own"
	on public.intros
	for select
	to authenticated
	using (auth.uid() = auth_user_id);

drop policy if exists "intros_insert_own" on public.intros;
create policy "intros_insert_own"
	on public.intros
	for insert
	to authenticated
	with check (auth.uid() = auth_user_id);

drop policy if exists "intros_update_own" on public.intros;
create policy "intros_update_own"
	on public.intros
	for update
	to authenticated
	using (auth.uid() = auth_user_id)
	with check (auth.uid() = auth_user_id);

drop policy if exists "intros_delete_own" on public.intros;
create policy "intros_delete_own"
	on public.intros
	for delete
	to authenticated
	using (auth.uid() = auth_user_id);

drop trigger if exists set_intros_updated_at on public.intros;
create trigger set_intros_updated_at
	before update on public.intros
	for each row
	execute function public.set_updated_at_timestamp();
