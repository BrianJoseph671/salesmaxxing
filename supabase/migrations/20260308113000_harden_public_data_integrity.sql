alter table public.qualification_configs
	add constraint qualification_configs_mode_check
	check (mode in ('automatic', 'custom'));

alter table public.leads
	add constraint leads_status_check
	check (
		status in ('new', 'contacted', 'replied', 'qualified', 'disqualified')
	);

alter table public.leads
	add constraint leads_score_check
	check (score between 0 and 100);

alter table public.intros
	add constraint intros_tone_check
	check (tone in ('professional', 'casual', 'mutual_connection'));

alter table public.qualification_configs
	add constraint qualification_configs_id_auth_user_id_unique
	unique (id, auth_user_id);

alter table public.leads
	add constraint leads_id_auth_user_id_unique
	unique (id, auth_user_id);

alter table public.leads
	add constraint leads_config_id_same_owner_fk
	foreign key (config_id, auth_user_id)
	references public.qualification_configs (id, auth_user_id)
	on delete set null;

alter table public.intros
	add constraint intros_lead_id_same_owner_fk
	foreign key (lead_id, auth_user_id)
	references public.leads (id, auth_user_id)
	on delete set null;

create index if not exists idx_leads_auth_user_id_score
	on public.leads(auth_user_id, score desc);

create index if not exists idx_leads_auth_user_id_status_score
	on public.leads(auth_user_id, status, score desc);
