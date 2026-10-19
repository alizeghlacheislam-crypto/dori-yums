// Vercel Serverless Function — GET /api/config
// Hands the browser the PUBLIC Supabase settings taken from the project's
// environment variables (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL       https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY  the anon / publishable key (public by design, protected by RLS)
// Without them it answers {} and the site runs on its local catalog.
// A secret key (service_role / sb_secret_…) is refused, never forwarded.

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
  var url = String(process.env.SUPABASE_URL || '').trim();
  var key = String(process.env.SUPABASE_ANON_KEY || '').trim();
  var body = {};

  if (url && key) {
    if (isSecretKey(key)) {
      console.error('[api/config] SUPABASE_ANON_KEY holds a secret/service_role key — refused. Use the anon or publishable key.');
    } else {
      body = { supabaseUrl: url, supabaseAnonKey: key };
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.end(JSON.stringify(body));
};
