// Runs supabase_schema.sql on an in-memory Postgres (PGlite) with Supabase stubs,
// then exercises RLS, grants and the public functions as anon / authenticated.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const schema = readFileSync(process.argv[2], 'utf8');
const db = new PGlite();

const STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create table auth.mfa_factors (id uuid default gen_random_uuid() primary key, user_id uuid not null references auth.users(id),
  factor_type text not null default 'totp', status text not null);
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text references storage.buckets(id), name text, owner uuid);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
create publication supabase_realtime;
-- worst case: the legacy Supabase defaults that expose everything in public
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
                              ('22222222-2222-2222-2222-222222222222', 'stranger@example.com');
`;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); }
}
/* aal: the session's assurance level claim ('aal1' after the password, 'aal2' after the code; null = no claim) */
async function as(role, sub, fn, aal = 'aal1') {
  const claims = JSON.stringify(sub ? { sub, role, ...(aal ? { aal } : {}) } : { role });
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub || ''}', false);
                 select set_config('request.jwt.claims', '${claims}', false); set role ${role};`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
async function q(sql, params) { return (await db.query(sql, params)).rows; }
async function err(sql, params) {
  try { await db.query(sql, params); return null; } catch (e) { return e.message; }
}
const day = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };

const ORDER = `select public.place_order($1,$2,$3,$4,$5,$6::date,$7,$8::jsonb,$9,$10,$11,$12::uuid) as r`;
function order(o = {}) {
  const d = {
    name: 'Amina B.', phone: '0551 40 17 04', wilaya: '16 - Alger', commune: 'Hydra', type: 'delivery',
    date: day(5), box: 60, items: [{ flavor_id: 1, qty: 40 }, { flavor_id: 2, qty: 20 }],
    notes: 'Sans gluten si possible', image: null, promo: null, req: null, ...o,
  };
  return [d.name, d.phone, d.wilaya, d.commune, d.type, d.date, d.box, JSON.stringify(d.items), d.notes, d.image, d.promo, d.req];
}

await db.exec(STUBS);
console.log('schema run 1');
await db.exec(schema);
console.log('schema run 2 (idempotency)');
await db.exec(schema);
await db.exec(`insert into private.admin_users (user_id) select id from auth.users where email = 'owner@example.com' on conflict do nothing;`);

console.log('\n[seed]');
ok('12 flavors', (await q('select count(*)::int n from public.flavors'))[0].n === 12);
ok('6 gallery posts', (await q('select count(*)::int n from public.gallery_posts'))[0].n === 6);
ok('5 settings', (await q('select count(*)::int n from public.site_settings'))[0].n === 5);
ok('3 buckets', (await q('select count(*)::int n from storage.buckets'))[0].n === 3);
ok('orders in realtime publication', (await q(`select count(*)::int n from pg_publication_tables where pubname='supabase_realtime' and tablename='orders'`))[0].n === 1);
ok('flavor id sequence moved past seeds', (await q(`insert into public.flavors (name_fr) values ('Test') returning id`))[0].id === 13);
await db.exec(`delete from public.flavors where id = 13`);

console.log('\n[anon: public reads, no private access]');
await as('anon', null, async () => {
  ok('anon reads flavors', (await q('select count(*)::int n from public.flavors'))[0].n === 12);
  ok('anon reads gallery', (await q('select count(*)::int n from public.gallery_posts'))[0].n === 6);
  ok('anon reads settings', (await q('select count(*)::int n from public.site_settings'))[0].n === 5);
  ok('anon cannot read orders', /permission denied/.test(await err('select * from public.orders')));
  ok('anon cannot read promo codes', /permission denied/.test(await err('select * from public.promo_codes')));
  ok('anon cannot read status log', /permission denied/.test(await err('select * from public.order_status_log')));
  ok('anon cannot insert flavor', /permission denied/.test(await err(`insert into public.flavors (name_fr) values ('x')`)));
  ok('anon cannot update settings', /permission denied/.test(await err(`update public.site_settings set value = '{}'`)));
  ok('anon cannot insert order directly', /permission denied/.test(await err(`insert into public.orders (customer_name) values ('x')`)));
  ok('anon cannot call is_admin', /permission denied/.test(await err('select public.is_admin()')));
  ok('anon cannot reach private schema', /permission denied/.test(await err('select private.is_admin()')));
});

console.log('\n[anon: place_order]');
let first;
await as('anon', null, async () => {
  first = (await q(ORDER, order({ req: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })))[0].r;
  ok('tracking code DY-1001', first.tracking_code === 'DY-1001', first.tracking_code);
  ok('tier −5 applied to the whole box (60 pcs)', first.items[0].unit_price === 115 && first.items[1].unit_price === 175, first.items);
  ok('subtotal 40×115 + 20×175 = 8100', first.subtotal === 8100, first.subtotal);
  ok('Alger delivery fee 500', first.delivery_fee === 500, first.delivery_fee);
  ok('total 8600', first.total_price === 8600, first.total_price);
  ok('status pending', first.status === 'pending');
  ok('snapshot has names', first.items[0].name_fr === 'Fraise' && first.items[1].name_ar === 'الفستق');
  const again = (await q(ORDER, order({ req: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })))[0].r;
  ok('same request_id returns same order (no duplicate)', again.tracking_code === 'DY-1001');

  const r120 = (await q(ORDER, order({ phone: '0661000001', box: 120, items: [{ flavor_id: 3, qty: 120 }], type: 'pickup', commune: '' })))[0].r;
  ok('tier −10 at 120 pcs (150 → 140)', r120.items[0].unit_price === 140 && r120.subtotal === 16800, r120);
  ok('pickup fee 0', r120.delivery_fee === 0 && r120.total_price === 16800);

  const oran = (await q(ORDER, order({ phone: '0771000002', wilaya: '31 - Oran', box: 20, items: [{ flavor_id: 6, qty: 20 }] })))[0].r;
  ok('other wilaya uses default fee 1000', oran.delivery_fee === 1000 && oran.subtotal === 2400 && oran.total_price === 3400, oran);
  ok('phone stored normalized', true);

  const e = async (o) => (await err(ORDER, order(o))) || 'NO ERROR';
  ok('invalid phone', /invalid_phone/.test(await e({ phone: '0221234567' })));
  ok('invalid name', /invalid_name/.test(await e({ name: ' a ' })));
  ok('invalid wilaya', /invalid_wilaya/.test(await e({ wilaya: 'Alger' })));
  ok('wilaya 59 rejected', /invalid_wilaya/.test(await e({ wilaya: '59 - X' })));
  ok('delivery needs commune', /invalid_commune/.test(await e({ commune: '' })));
  ok('bad delivery type', /invalid_delivery_type/.test(await e({ type: 'drone' })));
  ok('event date too soon (lead 2 days)', /invalid_event_date/.test(await e({ date: day(1) })));
  ok('event date in past', /invalid_event_date/.test(await e({ date: day(-3) })));
  ok('box size must match sum', /invalid_box_size/.test(await e({ box: 80 })));
  ok('box below minimum', /invalid_box_size/.test(await e({ box: 10, items: [{ flavor_id: 1, qty: 10 }] })));
  ok('box not multiple of 20', /invalid_box_size/.test(await e({ box: 25, items: [{ flavor_id: 1, qty: 25 }] })));
  ok('flavor qty not multiple of 5', /invalid_items/.test(await e({ box: 20, items: [{ flavor_id: 1, qty: 13 }, { flavor_id: 2, qty: 7 }] })));
  ok('unknown flavor', /invalid_items/.test(await e({ box: 20, items: [{ flavor_id: 999, qty: 20 }] })));
  ok('duplicate flavor lines', /invalid_items/.test(await e({ box: 40, items: [{ flavor_id: 1, qty: 20 }, { flavor_id: 1, qty: 20 }] })));
  ok('garbage qty', /invalid_items/.test(await e({ box: 20, items: [{ flavor_id: 1, qty: 'abc' }] })));
  ok('items not an array', /invalid_items/.test(await e({ items: { flavor_id: 1 } })));
  ok('price sent by browser is ignored', ((await q(ORDER, order({ phone: '0771000003', box: 20, items: [{ flavor_id: 2, qty: 20, unit_price: 1 }] })))[0].r.subtotal) === 3600);
  ok('invalid image path', /invalid_image/.test(await e({ image: 'https://evil.example/x.jpg' })));
  ok('valid image path accepted', !!(await q(ORDER, order({ phone: '0771000004', box: 20, items: [{ flavor_id: 1, qty: 20 }], image: 'inspirations/0f8fad5b-d9cb-469f-a165-70867728950e.jpg' })))[0].r.tracking_code);
  ok('inactive promo rejected', /invalid_promo/.test(await e({ promo: 'BIENVENUE10' })));
});

console.log('\n[promo, holiday mode, availability, delivery zones — set by owner]');
await db.exec(`update public.promo_codes set is_active = true where code = 'BIENVENUE10';`);
await as('anon', null, async () => {
  const v = (await q(`select public.validate_promo('bienvenue10', 8100) r`))[0].r;
  ok('validate_promo is case-insensitive and computes 10%', v.valid === true && v.discount_amount === 810, v);
  ok('validate_promo unknown → invalid', (await q(`select public.validate_promo('NOPE', 100) r`))[0].r.valid === false);
  const p = (await q(ORDER, order({ phone: '0551000005', promo: ' bienvenue10 ' })))[0].r;
  ok('order with promo: discount 810, total 7790', p.discount_amount === 810 && p.total_price === 7790 && p.promo_code === 'BIENVENUE10', p);
});
await db.exec(`insert into public.promo_codes (code, discount_type, discount_value) values ('MOINS5000', 'fixed', 5000);`);
await as('anon', null, async () => {
  const p = (await q(ORDER, order({ phone: '0551000006', box: 20, items: [{ flavor_id: 1, qty: 20 }], promo: 'MOINS5000' })))[0].r;
  ok('fixed promo capped at subtotal (2400)', p.discount_amount === 2400 && p.total_price === 500, p);
});
await db.exec(`update public.flavors set is_available = false where id = 2;`);
await as('anon', null, async () => {
  ok('unavailable flavor rejected', /flavor_unavailable/.test(await err(ORDER, order({ phone: '0551000007' }))));
});
await db.exec(`update public.flavors set is_available = true where id = 2;
               update public.site_settings set value = jsonb_set(value, '{default_fee}', 'null') where key = 'delivery';`);
await as('anon', null, async () => {
  ok('no default fee → delivery outside listed wilayas refused', /delivery_unavailable/.test(await err(ORDER, order({ phone: '0551000008', wilaya: '31 - Oran' }))));
  ok('…but pickup still works', !!(await q(ORDER, order({ phone: '0551000008', wilaya: '31 - Oran', type: 'pickup' })))[0].r.tracking_code);
});
await db.exec(`update public.site_settings set value = jsonb_set(value, '{enabled}', 'true') where key = 'holiday_mode';`);
await as('anon', null, async () => {
  ok('holiday mode pauses orders', /orders_paused/.test(await err(ORDER, order({ phone: '0551000009' }))));
});
await db.exec(`update public.site_settings set value = jsonb_set(value, '{enabled}', 'false') where key = 'holiday_mode';`);
await as('anon', null, async () => {
  await q(ORDER, order({ phone: '0662000010' }));
  await q(ORDER, order({ phone: '0662000010' }));
  await q(ORDER, order({ phone: '+213 662 00 00 10' }));
  ok('4th order from same phone within 10 min → too_many_orders', /too_many_orders/.test(await err(ORDER, order({ phone: '00213662000010' }))));
});

console.log('\n[tracking]');
await as('anon', null, async () => {
  const t1 = (await q(`select public.track_order('DY-1001', '+213551401704') r`))[0].r;
  ok('track with code + phone', t1 && t1.status === 'pending' && t1.total_price === 8600, t1);
  ok('history has the creation step', t1 && t1.history.length === 1 && t1.history[0].status === 'pending');
  ok('code variants: "dy 1001" / "1001"', (await q(`select public.track_order('dy 1001', '0551401704') a, public.track_order('1001', '551401704') b`)).every(r => r.a && r.b));
  ok('wrong phone → null', (await q(`select public.track_order('DY-1001', '0661000001') r`))[0].r === null);
  ok('garbage code → null', (await q(`select public.track_order('''; drop table x;--', '0551401704') r`))[0].r === null);
});

console.log('\n[authenticated: admin vs stranger]');
await as('authenticated', '22222222-2222-2222-2222-222222222222', async () => {
  ok('stranger sees 0 orders', (await q('select count(*)::int n from public.orders'))[0].n === 0);
  ok('stranger sees 0 promo codes', (await q('select count(*)::int n from public.promo_codes'))[0].n === 0);
  ok('stranger is_admin() = false', (await q('select public.is_admin() a'))[0].a === false);
  const u = await db.query(`update public.orders set status = 'cancelled' where tracking_code = 'DY-1001'`);
  ok('stranger update affects 0 rows', u.affectedRows === 0);
  ok('stranger cannot add flavor', /row-level security/.test(await err(`insert into public.flavors (name_fr) values ('Hack')`)));
  ok('stranger cannot read admin list', /permission denied/.test(await err('select * from private.admin_users')));
});
await as('authenticated', '11111111-1111-1111-1111-111111111111', async () => {
  ok('admin is_admin() = true', (await q('select public.is_admin() a'))[0].a === true);
  ok('admin sees all orders', (await q('select count(*)::int n from public.orders'))[0].n >= 10);
  await q(`update public.orders set status = 'confirmed' where tracking_code = 'DY-1001'`);
  await q(`update public.orders set status = 'baking' where tracking_code = 'DY-1001'`);
  const log = await q(`select l.from_status, l.to_status, l.changed_by from public.order_status_log l join public.orders o on o.id = l.order_id where o.tracking_code = 'DY-1001' order by l.id`);
  ok('status log: pending → confirmed → baking, by the admin', log.length === 3 && log[2].to_status === 'baking' && log[2].changed_by === '11111111-1111-1111-1111-111111111111', log);
  ok('bad status rejected by constraint', /check constraint/.test(await err(`update public.orders set status = 'lost' where tracking_code = 'DY-1001'`)));
  ok('cannot break total consistency', /orders_total_consistent/.test(await err(`update public.orders set total_price = 1 where tracking_code = 'DY-1001'`)));
  ok('admin cannot delete orders (cancel instead)', /permission denied/.test(await err(`delete from public.orders where tracking_code = 'DY-1001'`)));
  const f = (await q(`update public.flavors set price = 130 where id = 1 returning price, updated_at > created_at as touched`))[0];
  ok('admin edits flavor; updated_at trigger fires', f && f.price === 130 && f.touched === true, f);
  ok('admin creates promo', (await q(`insert into public.promo_codes (code, discount_type, discount_value) values ('ETE2026', 'percentage', 15) returning code`))[0].code === 'ETE2026');
  ok('admin edits settings', (await db.query(`update public.site_settings set value = jsonb_set(value, '{enabled}', 'true') where key = 'announcement'`)).affectedRows === 1);
  ok('admin manual order insert', !!(await q(`insert into public.orders (customer_name, phone, wilaya, delivery_type, event_date, box_size, items, subtotal, total_price) values ('Tel', '+213551000000', '16 - Alger', 'pickup', current_date + 3, 20, '[{"flavor_id":1,"qty":20}]', 2400, 2400) returning tracking_code`))[0].tracking_code);
});
await as('anon', null, async () => {
  const t = (await q(`select public.track_order('DY-1001', '0551401704') r`))[0].r;
  ok('customer now sees "baking" with 3 history steps', t.status === 'baking' && t.history.length === 3);
  ok('old order keeps its snapshot price after flavor price change', t.items[0].unit_price === 115);
});

console.log('\n[storage]');
await as('anon', null, async () => {
  ok('visitor uploads inspiration <uuid>.jpg', !(await err(`insert into storage.objects (bucket_id, name) values ('inspirations', '0f8fad5b-d9cb-469f-a165-70867728950e.jpg')`)));
  ok('visitor cannot upload with another name', /row-level security/.test(await err(`insert into storage.objects (bucket_id, name) values ('inspirations', '../evil.html')`)));
  ok('visitor cannot upload to gallery', /row-level security/.test(await err(`insert into storage.objects (bucket_id, name) values ('gallery', '0f8fad5b-d9cb-469f-a165-70867728950e.jpg')`)));
  ok('visitor cannot list inspirations', (await q(`select count(*)::int n from storage.objects`))[0].n === 0);
});
await as('authenticated', '11111111-1111-1111-1111-111111111111', async () => {
  ok('admin uploads to gallery', !(await err(`insert into storage.objects (bucket_id, name) values ('gallery', 'new.webp')`)));
  ok('admin reads inspirations', (await q(`select count(*)::int n from storage.objects where bucket_id = 'inspirations'`))[0].n === 1);
});

console.log('\n[two-step sign-in (MFA)]');
const OWNER = '11111111-1111-1111-1111-111111111111', STRANGER = '22222222-2222-2222-2222-222222222222';
const adminView = async () => ({
  isAdmin: (await q('select public.is_admin() a'))[0].a,
  orders: (await q('select count(*)::int n from public.orders'))[0].n,
  promos: (await q('select count(*)::int n from public.promo_codes'))[0].n,
  settingsUpdated: (await db.query(`update public.site_settings set value = value where key = 'announcement'`)).affectedRows,
  flavorInsert: await err(`insert into public.flavors (name_fr) values ('MFA test') returning id`),
  inspirations: (await q(`select count(*)::int n from storage.objects where bucket_id = 'inspirations'`))[0].n,
  galleryUpload: await err(`insert into storage.objects (bucket_id, name) values ('gallery', 'mfa-test.webp')`),
});
const cleanup = () => db.exec(`delete from public.flavors where name_fr = 'MFA test'; delete from storage.objects where name = 'mfa-test.webp';`);
await as('authenticated', OWNER, async () => {
  const v = await adminView();
  ok('before any factor: password session (aal1) is still admin — no lockout', v.isAdmin === true && v.orders >= 10 && v.settingsUpdated === 1, v);
});
await cleanup();
await db.exec(`insert into auth.mfa_factors (user_id, status) values ('${OWNER}', 'unverified');`);
await as('authenticated', OWNER, async () => {
  ok('an unfinished (unverified) factor does not lock the owner out', (await q('select public.is_admin() a'))[0].a === true);
});
await db.exec(`update auth.mfa_factors set status = 'verified' where user_id = '${OWNER}';`);
await as('authenticated', OWNER, async () => {
  const v = await adminView();
  ok('verified factor + aal1 → is_admin() = false', v.isAdmin === false, v);
  ok('verified factor + aal1 → 0 orders, 0 promo codes', v.orders === 0 && v.promos === 0, v);
  ok('verified factor + aal1 → settings update affects 0 rows', v.settingsUpdated === 0, v);
  ok('verified factor + aal1 → cannot add a flavor', /row-level security/.test(v.flavorInsert || ''), v.flavorInsert);
  ok('verified factor + aal1 → cannot read inspiration photos', v.inspirations === 0, v);
  ok('verified factor + aal1 → cannot upload to the gallery', /row-level security/.test(v.galleryUpload || ''), v.galleryUpload);
});
await as('authenticated', OWNER, async () => {
  ok('verified factor + no aal claim → treated as aal1 (refused)', (await q('select public.is_admin() a'))[0].a === false);
}, null);
await as('authenticated', OWNER, async () => {
  const v = await adminView();
  ok('verified factor + aal2 → admin again (orders, settings, flavors, photos)',
     v.isAdmin === true && v.orders >= 10 && v.settingsUpdated === 1 && !v.flavorInsert && v.inspirations === 1 && !v.galleryUpload, v);
}, 'aal2');
await cleanup();
await as('authenticated', STRANGER, async () => {
  ok('a stranger with aal2 is still not admin (the allowlist decides)', (await q('select public.is_admin() a'))[0].a === false);
}, 'aal2');
await db.exec(`insert into auth.mfa_factors (user_id, status) values ('${STRANGER}', 'verified');`);
await as('authenticated', OWNER, async () => {
  ok("another user's factor does not change the owner's rule", (await q('select public.is_admin() a'))[0].a === true);
}, 'aal2');
await as('anon', null, async () => {
  ok('customers are unaffected: anon can still place an order', !!(await q(ORDER, order({ phone: '0551000011', box: 20, items: [{ flavor_id: 1, qty: 20 }] })))[0].r.tracking_code);
});
await db.exec(`delete from auth.mfa_factors where user_id = '${OWNER}';`);
await as('authenticated', OWNER, async () => {
  ok('factors removed (recovery) → password session works again', (await q('select public.is_admin() a'))[0].a === true);
});

console.log('\n[the owner\'s SQL files: rollback · rule · recovery]');
const sqlFile = f => readFileSync(new URL('../../sql/' + f, import.meta.url), 'utf8');
const ownerIsAdmin = aal => as('authenticated', OWNER, async () => (await q('select public.is_admin() a'))[0].a, aal);
await db.exec(`insert into auth.mfa_factors (user_id, status) values ('${OWNER}', 'verified');`);
await db.exec(sqlFile('2026-10-23-admin-mfa-rollback.sql'));
ok('rollback file → password session is admin again, even with a verified app', (await ownerIsAdmin('aal1')) === true);
await db.exec(sqlFile('2026-10-23-admin-mfa.sql'));
ok('rule file → verified app + aal1 refused, aal2 admitted', (await ownerIsAdmin('aal1')) === false && (await ownerIsAdmin('aal2')) === true);
ok('rule file → anon still cannot call private.is_admin()', /permission denied/.test(await as('anon', null, () => err('select private.is_admin()')) || ''));
await db.exec(sqlFile('admin-mfa-recovery.sql'));
ok('recovery file → the owner\'s apps are gone, password session works again',
   (await q(`select count(*)::int n from auth.mfa_factors where user_id = '${OWNER}'`))[0].n === 0 && (await ownerIsAdmin('aal1')) === true);
ok('recovery file → a non-admin account keeps its apps', (await q(`select count(*)::int n from auth.mfa_factors where user_id = '${STRANGER}'`))[0].n === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
