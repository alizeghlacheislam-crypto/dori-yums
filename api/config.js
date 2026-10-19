// Vercel Serverless Function — GET /api/config
// Hands the browser the PUBLIC Supabase settings taken from the project's
// environment variables (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL       https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY  the anon / publishable key (public by design, protected by RLS)
// The names created by the Vercel ↔ Supabase integration are accepted too
// (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, …).
// Harmless URL mistakes are corrected (missing https://, /rest/v1 suffix, dashboard link).
// Without a usable URL + key it answers { status, url, key } describing what is wrong —
// never a value. A secret key (service_role / sb_secret_…) is refused, never forwarded.

var URL_VARS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
var KEY_VARS = ['SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

function env(name) { return String(process.env[name] || '').trim().replace(/^['"]+|['"]+$/g, '').trim(); }

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

/* → { url } when usable, else { problem } — the problem names a shape, never the value */
function normalizeUrl(raw) {
  if (!raw) return { problem: 'missing' };
  var dash = /supabase\.com\/dashboard\/project\/([a-z0-9]{10,40})/i.exec(raw);
  if (dash) return { url: 'https://' + dash[1].toLowerCase() + '.supabase.co' };
  var v = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw;
  var u;
  try { u = new URL(v); } catch (e) { return { problem: 'unreadable' }; }
  if (u.protocol !== 'https:') return { problem: 'not_https:' + u.protocol.replace(':', '') };   // e.g. a postgresql:// connection string
  if (!/\./.test(u.hostname)) return { problem: 'unreadable' };
  return { url: u.origin };   /* drops /rest/v1, trailing slashes, query strings */
}

module.exports = function handler(req, res) {
  var rawUrl = '';
  URL_VARS.some(function (n) { rawUrl = env(n); return !!rawUrl; });
  var u = normalizeUrl(rawUrl);

  var key = '', refused = false;
  KEY_VARS.forEach(function (n) {
    var v = env(n);
    if (!v || key) return;
    if (isSecretKey(v)) { refused = true; return; }
    key = v;
  });

  var body;
  if (u.url && key) {
    body = { supabaseUrl: u.url, supabaseAnonKey: key };
  } else {
    body = {
      status: 'not_configured',
      url: u.url ? 'ok' : u.problem,
      key: key ? 'ok' : (refused ? 'secret_key_refused' : 'missing')
    };
    console.warn('[api/config] Supabase not configured: url=' + body.url + ' key=' + body.key);
  }
  if (refused) {
    console.error('[api/config] a Supabase secret/service_role key was found in a public variable — refused. Use the anon or publishable key.');
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  /* short cache: a newly configured project shows up within a minute */
  res.setHeader('Cache-Control', body.status ? 'no-store' : 'public, max-age=60, s-maxage=60');
  res.end(JSON.stringify(body));
};
