-- Dori Yums · undo sql/2026-10-23-admin-mfa.sql
-- Run in Supabase → SQL Editor. Admin rights go back to "on the allowlist", with the password
-- alone, whatever the session's assurance level. The atelier still asks for the code on screen
-- when an authenticator app is set up, but the database no longer insists on it.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users a where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- check: one row, "password-only rule"
select case when pg_get_functiondef('private.is_admin()'::regprocedure) like '%aal2%'
            then 'aal2 rule still on' else 'password-only rule' end as status;
