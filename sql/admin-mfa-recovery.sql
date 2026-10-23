-- Dori Yums · emergency recovery: every authenticator device of the owner is lost
-- Run in Supabase → SQL Editor (you are signed in to your own Supabase account, which is the
-- root of trust — keep that account protected with its own two-step sign-in).
--
-- Removes the authenticator apps of the atelier admins (the accounts in private.admin_users)
-- and nothing else. The password alone then opens the atelier again; turn the code back on
-- right away from Réglages → Sécurité du compte, on the new phone.
-- Sessions that were already signed in stay signed in.

delete from auth.mfa_factors
where user_id in (select user_id from private.admin_users);

-- check: 0 = no authenticator app left on the admin accounts
select count(*) as admin_authenticator_apps_left
from auth.mfa_factors
where user_id in (select user_id from private.admin_users);
