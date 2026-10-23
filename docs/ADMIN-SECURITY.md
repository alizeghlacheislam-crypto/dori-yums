# Atelier security — two-step sign-in (TOTP)

The owner signs in to `/admin` with e-mail + password, then — once an authenticator app is set
up — a 6-digit code from that app. Built on Supabase Auth's own MFA (free, no extra service).

## What protects what

| Layer | Where | What it does |
|---|---|---|
| Allowlist | `private.admin_users` | only listed account IDs can be admin |
| Two-step rule | `private.is_admin()` (`sql/2026-10-23-admin-mfa.sql`) | an admin with a verified app must use a session that passed the code step (JWT `aal` = `aal2`); every RLS and storage policy goes through this function |
| Supabase Auth | built in | new app needs `aal2` once one is verified; removing a verified app needs `aal2`; a successful code signs out the account's other password-only sessions; MFA challenge/verify limited to 15 requests/min per IP |
| Atelier screens | `js/admin.js` | code screen after the password, set-up panel, backup app, "sign out" (this device) and "sign out of all devices" — UI only, the database decides |
| Browser policy | `vercel.json` CSP | `/admin`: no inline script, scripts only from the site and the pinned supabase-js; public pages: external scripts and data destinations limited |

An account **without** a verified app keeps working with the password alone — so the rule can
be applied before or after the set-up without locking anyone out.

## Going live — in this order

1. **Deploy** the atelier code (push to GitHub → Vercel). Nothing changes for the owner yet.
2. **Owner:** sign in at `/admin` → Réglages → *Sécurité du compte* → *Activer le code de vérification*;
   scan the QR with an authenticator app (or type the key), enter the first code.
3. **Owner:** add a **backup device** the same way (*Ajouter un appareil de secours*) — a second phone,
   a tablet, or a password manager that stores TOTP codes.
4. **Owner:** Supabase → SQL Editor → run `sql/2026-10-23-admin-mfa.sql` (expected answer: `aal2 rule on`).
5. **Owner:** Supabase → Authentication → settings: new sign-ups **off**; protect the Supabase account
   itself with its own two-step sign-in and keep its recovery codes.
6. **Check together:** on a new browser, password alone must lead to the code screen; the code opens the atelier.

## Everyday use

- Usual devices stay signed in — no password, no code.
- A new browser or device (or after clearing browser data / signing out): password, then code.
  A "known device" is only a browser that kept its session — it does not prove the physical device.

## Lost phone

1. On another signed-in device (or after signing in with the **backup** app's code): Réglages →
   *Sécurité du compte* → **Déconnecter tous les appareils**, sign in again with the backup code.
2. Remove the lost phone's app from the list; add a new phone as backup.

## Lost every code device

Supabase → SQL Editor → run `sql/admin-mfa-recovery.sql` (removes the authenticator apps of the
admin accounts only). The password alone works again: set the code up again right away.
The Supabase account is the root of trust — if it is lost too, only Supabase support can help.

## Undo

Supabase → SQL Editor → `sql/2026-10-23-admin-mfa-rollback.sql` (expected answer: `password-only rule`).

## Known limits

- An access token stays valid until it expires (1 hour by default) after a sign-out or a removed app.
- A TOTP code can be phished on a fake site; passkeys would fix that (Supabase passkeys are
  experimental as of 2026-10).
- Password reset by e-mail needs custom SMTP (the built-in mailer only reaches team members,
  2 mails/hour); today it is done from the Supabase dashboard.

## Tests

- `tools/schema-test`: `npm test` — 106 checks, incl. aal1/aal2, allowlist, storage, and the three files in `sql/`.
- `tools/mock_supabase.py` imitates Supabase MFA (real RFC 6238 codes); `GET /mock/mfa-reset` starts over.
  Test accounts are in that file's header (local mock only).
