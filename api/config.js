// Vercel Serverless Function — GET /api/config
// Hands the browser the PUBLIC Supabase settings taken from the project's
// environment variables (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL       https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY  the anon / publishable key (public by design, protected by RLS)
// The names created by the Vercel ↔ Supabase integration are accepted too
// (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, …).
// Without them it answers { status } and the site runs on its local catalog.
// A secret key (service_role / sb_secret_…) is refused, never forwarded.

var URL_VARS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
var KEY_VARS = ['SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

function env(name) { return String(process.env[name] || '').trim(); }

function isSecretKey(key) {
  if (/^sb_secret_/.test(key)) return true;
  var parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    var payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload && payload.role === 'service_role';
  } catch (e) {
    return false;
  }
}

module.exports = function handler(req, res) {
  var url = '';
  URL_VARS.some(function (n) { url = env(n); return !!url; });

  var key = '', refused = false;
  KEY_VARS.forEach(function (n) {
    var v = env(n);
    if (!v || key) return;
    if (isSecretKey(v)) { refused = true; return; }
    key = v;
  });

  /* status is only a hint for whoever sets the project up — it never contains a key */
  var body;
  if (!url) body = { status: 'missing_url' };
  else if (!/^https:\/\/[^\s/]+$/.test(url.replace(/\/+$/, ''))) body = { status: 'bad_url' };
  else if (!key) body = { status: refused ? 'secret_key_refused' : 'missing_key' };
  else body = { supabaseUrl: url.replace(/\/+$/, ''), supabaseAnonKey: key };

  if (refused) {
    console.error('[api/config] a Supabase secret/service_role key was found in a public variable — refused. Use the anon or publishable key.');
  }
  if (body.status) console.warn('[api/config] Supabase not configured: ' + body.status);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  /* short cache: a newly configured project shows up within a minute */
  res.setHeader('Cache-Control', body.status ? 'no-store' : 'public, max-age=60, s-maxage=60');
  res.end(JSON.stringify(body));
};
