-- Teardown: Remove all SalesMAXXing tables. Run this to clean up a shared Supabase project.
-- Tables are empty (0 rows in leads, qualification_configs, intros; 2 test rows in user_profiles).
-- The set_updated_at_timestamp() function is left in place as it may be shared.

-- Drop in reverse dependency order (intros → leads → qualification_configs → user_profiles)

-- 1. Drop triggers
drop trigger if exists set_intros_updated_at on public.intros;
drop trigger if exists set_leads_updated_at on public.leads;
drop trigger if exists set_qualification_configs_updated_at on public.qualification_configs;
drop trigger if exists set_user_profiles_updated_at on public.user_profiles;

-- 2. Drop RLS policies
drop policy if exists "intros_select_own" on public.intros;
drop policy if exists "intros_insert_own" on public.intros;
drop policy if exists "intros_update_own" on public.intros;
drop policy if exists "intros_delete_own" on public.intros;

drop policy if exists "leads_select_own" on public.leads;
drop policy if exists "leads_insert_own" on public.leads;
drop policy if exists "leads_update_own" on public.leads;
drop policy if exists "leads_delete_own" on public.leads;

drop policy if exists "qualification_configs_select_own" on public.qualification_configs;
drop policy if exists "qualification_configs_insert_own" on public.qualification_configs;
drop policy if exists "qualification_configs_update_own" on public.qualification_configs;
drop policy if exists "qualification_configs_delete_own" on public.qualification_configs;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
drop policy if exists "user_profiles_delete_own" on public.user_profiles;

-- 3. Drop tables (CASCADE handles foreign key constraints between them)
drop table if exists public.intros cascade;
drop table if exists public.leads cascade;
drop table if exists public.qualification_configs cascade;
drop table if exists public.user_profiles cascade;
