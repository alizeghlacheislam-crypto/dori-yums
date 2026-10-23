-- Dori Yums · atelier two-step sign-in (MFA) — the database rule
-- Run in Supabase → SQL Editor, AFTER the owner has turned on the verification code in the
-- atelier (Réglages → Sécurité du compte). Same function as supabase_schema.sql.
--
-- Every RLS and storage policy of the atelier goes through private.is_admin(). From now on an
-- admin account that has a verified authenticator app needs a session that passed the code step
-- (JWT "aal" = 'aal2'). An account without a verified app keeps working with the password alone,
-- so running this cannot lock the owner out.
--
-- Undo: sql/2026-10-23-admin-mfa-rollback.sql   ·   Lost every code device: sql/admin-mfa-recovery.sql

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users a
    where a.user_id = (select auth.uid())
      and (
        coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2'
        or not exists (
          select 1 from auth.mfa_factors f
          where f.user_id = a.user_id and f.status = 'verified'
        )
      )
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- check: one row, "aal2 rule on"
select case when pg_get_functiondef('private.is_admin()'::regprocedure) like '%aal2%'
            then 'aal2 rule on' else 'NOT applied' end as status;
