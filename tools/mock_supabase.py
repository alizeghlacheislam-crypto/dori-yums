"""
Local stand-in for Supabase — a tiny in-memory backend to test the site and the
owner atelier (admin) without real keys. Dev tool only, excluded from Vercel.

  python tools/mock_supabase.py   ->  site: http://localhost:4175   atelier: http://localhost:4175/admin.html

What it imitates (same permissions as supabase_schema.sql, in spirit):
  * Data API: GET/POST/PATCH/DELETE /rest/v1/<table> with eq/in/gte/lte filters, order, limit, upsert
    - flavors, gallery_posts, site_settings: readable by everyone; writes need the admin account
    - orders, promo_codes, order_status_log: admin only (anon -> 401, signed-in stranger -> no rows)
  * RPC: place_order, track_order, validate_promo, is_admin
  * Auth: password sign-in, refresh, user, logout
  * Storage: uploads (multipart), public URLs (flavor-images, gallery), signed URLs (inspirations), removal
  * No realtime websocket: the atelier falls back to polling here.

Test accounts — local mock only, not real credentials:
  owner@example.test / dori-test-2026      -> admin
  stranger@example.test / dori-test-2026   -> signed in but not an admin

Test switches:
  GET /mock/set?holiday=1 (holiday=0)  -> holiday mode on / off
  GET /mock/new-order                   -> a customer order arrives (to test the atelier alert)
  Customer names "paused" / "spam" / "slow" -> orders_paused / too_many_orders / a 2 s delay

Fixture differences visible on the site: Pistache 200 DZD with "[DB]" descriptions, a 13th
flavor "Rose Litchi" (sold out), 2 atelier cards, tiers -5 DZD from 40 / -15 DZD from 100.
"""
import base64
import datetime
import json
import os
import re
import sys
import time
import uuid
from email import policy as email_policy
from email.parser import BytesParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qsl, unquote, urlparse

PORT = int(os.environ.get("PORT", "4175"))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANON_KEY = "mock-anon-key-0123456789abcdef"

F = lambda i, r, fr, en, ar, dfr, den, dar, img, price, ok=True: {
    "id": i, "roman_numeral": r, "name_fr": fr, "name_en": en, "name_ar": ar,
    "desc_fr": dfr, "desc_en": den, "desc_ar": dar, "image_url": img,
    "price": price, "is_available": ok, "sort_order": i,
}
FLAVORS = [
    F(1, "Ⅰ", "Fraise", "Strawberry", "الفراولة", "Crème délicate à la fraise dans une coque rose poudré.", "Delicate strawberry cream in a blush-pink shell.", "كريمة فراولة رقيقة داخل قشرة وردية.", "assets/m-rose.webp", 120),
    F(2, "Ⅱ", "Pistache", "Pistachio", "الفستق", "[DB] Pistache de Bronte, depuis la base.", "[DB] Bronte pistachio, from the database.", "[DB] فستق من قاعدة البيانات.", "assets/m-pistachio.webp", 200),
    F(3, "Ⅲ", "Chocolat Noir", "Dark chocolate", "الشوكولاتة السوداء", "Ganache intense au chocolat noir, à peine sucrée.", "Deep dark-chocolate ganache, barely sweet.", "غاناش شوكولاتة داكنة عميقة، بحلاوة خفيفة.", "assets/m-chocolate.webp", 150),
    F(4, "Ⅳ", "Banane Chocolat", "Banana chocolate", "موز بالشوكولاتة", "Banane mûre mariée à une crème au chocolat au lait.", "Ripe banana folded into milk-chocolate cream.", "موز ناضج ممزوج بكريمة شوكولاتة الحليب.", "assets/m-banana.webp", 120),
    F(5, "Ⅴ", "Fraise Framboise", "Strawberry raspberry", "فراولة بالتوت", "Fraise et framboise, vives et acidulées.", "Strawberry and raspberry, bright and tangy.", "فراولة وتوت العليق، نكهة حيوية ومنعشة.", "assets/m-strawberry.webp", 140),
    F(6, "Ⅵ", "Citron", "Lemon", "الليمون", "Crème au citron ensoleillée, vive puis douce.", "Sun-bright lemon cream, sharp then sweet.", "كريمة ليمون مشمسة، حادّة ثم حلوة.", "assets/m-lemon.webp", 120),
    F(7, "Ⅶ", "Coco Ananas", "Coconut pineapple", "جوز الهند والأناناس", "Une coque coco au cœur d'ananas.", "A coconut shell with a pineapple heart.", "قشرة جوز هند بقلب أناناس.", "assets/m-coconut.webp", 120),
    F(8, "Ⅷ", "Noisette Praliné", "Hazelnut praliné", "البندق والبرالين", "Praliné noisette torréfié, chaleureux et fondant.", "Toasted hazelnut praliné, warm and buttery.", "برالين بندق محمّص، دافئ وذائب.", "assets/m-pecan.webp", 180),
    F(9, "Ⅸ", "Vanille Caramel", "Vanilla caramel", "الفانيليا بالكراميل", "Crème vanille et ruban de caramel fondant.", "Vanilla cream with a soft caramel ribbon.", "كريمة فانيليا مع شريط كراميل ناعم.", "assets/m-vanilla.webp", 140),
    F(10, "Ⅹ", "Cerise Chocolat", "Cherry chocolate", "كرز بالشوكولاتة", "Cerise noire sur un cœur de crème au chocolat.", "Dark cherry over a chocolate cream heart.", "كرز أسود فوق قلب من كريمة الشوكولاتة.", "assets/m-cherry.webp", 140),
    F(11, "Ⅺ", "Coco Chocolat", "Coconut chocolate", "جوز الهند بالشوكولاتة", "Coco et chocolat, l'accord classique.", "Coconut and chocolate, the classic pairing.", "جوز الهند والشوكولاتة، الثنائي الكلاسيكي.", "assets/m-coconut-choc.webp", 120),
    F(12, "Ⅻ", "Orange", "Orange", "البرتقال", "Zeste d'orange confite, légèrement amer.", "Candied orange zest, gently bitter.", "قشر برتقال مسكّر، بمرارة لطيفة.", "assets/m-orange.webp", 120),
    F(13, "ⅩⅢ", "Rose Litchi", "Rose lychee", "الورد والليتشي", "Rose et litchi, tout en délicatesse.", "Rose and lychee, delicate and floral.", "ورد وليتشي، رقيق وزهري.", "assets/m-rose.webp", None, False),
]
GALLERY = [
    {"id": 1, "category": "atelier", "image_url": "assets/atelier-0.webp", "sort_order": 1,
     "title_fr": "Coffrets cadeaux", "title_en": "Gift coffrets", "title_ar": "علب هدايا",
     "caption_fr": "En boîte, rubannés, prêts à offrir.", "caption_en": "Boxed and ribboned, ready to offer.", "caption_ar": "في علب مزيّنة بشريط، جاهزة للإهداء."},
    {"id": 3, "category": "atelier", "image_url": "assets/atelier-3.webp", "sort_order": 2,
     "title_fr": "[DB] Plateaux", "title_en": "[DB] Event trays", "title_ar": "[DB] صوانٍ",
     "caption_fr": "Depuis la base.", "caption_en": "From the database.", "caption_ar": "من قاعدة البيانات."},
    {"id": 4, "category": "testimonial", "image_url": "assets/testimonial-1.jpg", "sort_order": 1,
     "title_fr": "@perrie_chapier", "title_en": "@perrie_chapier", "title_ar": "@perrie_chapier",
     "caption_fr": "masterpiece", "caption_en": "masterpiece", "caption_ar": "masterpiece"},
    {"id": 5, "category": "testimonial", "image_url": "assets/testimonial-2.jpg", "sort_order": 2,
     "title_fr": "@_meriem_mer._", "title_en": "@_meriem_mer._", "title_ar": "@_meriem_mer._",
     "caption_fr": "Je valide a 100%", "caption_en": "Je valide a 100%", "caption_ar": "Je valide a 100%"},
    {"id": 6, "category": "testimonial", "image_url": "assets/testimonial-3.jpg", "sort_order": 3,
     "title_fr": "@sabrinahalouane", "title_en": "@sabrinahalouane", "title_ar": "@sabrinahalouane",
     "caption_fr": "Un délice", "caption_en": "Un délice", "caption_ar": "Un délice"},
]
SETTINGS = [
    {"key": "pricing", "value": {"currency": "DZD", "base_unit_price": 130,
                                 "tiers": [{"min_qty": 40, "discount_per_piece": 5}, {"min_qty": 100, "discount_per_piece": 15}]}},
    {"key": "ordering", "value": {"box_sizes": [20, 40, 60, 80, 120], "box_step": 20, "min_pieces": 20,
                                  "max_pieces": 1000, "flavor_step": 5, "min_lead_days": 2, "whatsapp_number": "213551401704"}},
    {"key": "delivery", "value": {"pickup_fee": 0, "default_fee": 1000, "wilaya_fees": {"16": 500}}},
    {"key": "announcement", "value": {"enabled": True, "text_fr": "[DB] Coffrets de l'Aïd disponibles",
                                      "text_en": "[DB] Eid boxes available", "text_ar": "[DB] علب العيد متوفرة"}},
    {"key": "holiday_mode", "value": {"enabled": False, "message_fr": "", "message_en": "", "message_ar": ""}},
]
PROMOS = [
    {"id": 1, "code": "TEST10", "discount_type": "percentage", "discount_value": 10, "is_active": True, "expires_at": None,
     "created_at": "2026-10-01T09:00:00Z"},
    {"id": 2, "code": "BIENVENUE10", "discount_type": "percentage", "discount_value": 10, "is_active": False, "expires_at": None,
     "created_at": "2026-09-01T09:00:00Z"},
]

# ── accounts (local mock only) ──────────────────────────────────────────────
PASSWORD = "dori-test-2026"
USERS = {
    "owner@example.test": {"id": "11111111-1111-4111-8111-111111111111", "admin": True},
    "stranger@example.test": {"id": "22222222-2222-4222-8222-222222222222", "admin": False},
}
TOKENS = {}      # access or refresh token -> email
STATE = {"holiday": False}

# ── in-memory database ──────────────────────────────────────────────────────
DB = {"flavors": FLAVORS, "gallery_posts": GALLERY, "site_settings": SETTINGS, "promo_codes": PROMOS,
      "orders": [], "order_status_log": []}
PUBLIC_READ = {"flavors", "gallery_posts", "site_settings"}
NO_DELETE = {"orders", "order_status_log"}
STORAGE = {}     # (bucket, path) -> (bytes, content_type)
SIGNED = {}      # token -> (bucket, path)
PUBLIC_BUCKETS = {"flavor-images", "gallery"}
NEXT_CODE = [1038]


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def algiers_today():
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).date()


def day(n):
    return (algiers_today() + datetime.timedelta(days=n)).isoformat()


def next_id(table):
    return max([r.get("id", 0) for r in DB[table]] + [0]) + 1


def setting(key):
    for r in DB["site_settings"]:
        if r["key"] == key:
            return r["value"]
    return {}


def price_lines(items, total_qty):
    pricing = setting("pricing")
    tier = 0
    for t in sorted(pricing.get("tiers", []), key=lambda t: t["min_qty"]):
        if total_qty >= t["min_qty"]:
            tier = t["discount_per_piece"]
    by_id = {f["id"]: f for f in DB["flavors"]}
    lines, sub = [], 0
    for i in items:
        f = by_id.get(int(i["flavor_id"]))
        if not f:
            return None, 0, "invalid_items"
        if not f["is_available"]:
            return None, 0, "flavor_unavailable"
        base = f["price"] if f["price"] is not None else pricing.get("base_unit_price", 120)
        unit = max(base - tier, 0)
        q = int(i["qty"])
        lines.append({"flavor_id": f["id"], "name_fr": f["name_fr"], "name_en": f["name_en"], "name_ar": f["name_ar"],
                      "qty": q, "unit_price": unit, "line_total": unit * q})
        sub += unit * q
    return lines, sub, None


def delivery_fee(delivery_type, wilaya):
    d = setting("delivery")
    if delivery_type == "pickup":
        return d.get("pickup_fee", 0)
    code = str(int(str(wilaya or "0").split(" ")[0] or 0))
    fee = d.get("wilaya_fees", {}).get(code, d.get("default_fee"))
    return fee if isinstance(fee, int) else None


def log_status(order, status, by=None):
    DB["order_status_log"].append({"id": next_id("order_status_log"), "order_id": order["id"],
                                   "from_status": order.get("_prev"), "to_status": status,
                                   "changed_by": by, "changed_at": now_iso()})


def receipt(o):
    keys = ["tracking_code", "status", "customer_name", "delivery_type", "wilaya", "commune", "event_date", "box_size",
            "items", "promo_code", "subtotal", "delivery_fee", "discount_amount", "total_price", "created_at"]
    return {k: o.get(k) for k in keys}


def insert_order(name, phone, wilaya, commune, dtype, event_date, items, notes="", image=None, promo=None, req=None,
                 status="pending", path=()):
    total_qty = sum(int(i["qty"]) for i in items)
    lines, sub, err = price_lines(items, total_qty)
    if err:
        return None, err
    fee = delivery_fee(dtype, wilaya)
    if fee is None:
        return None, "delivery_unavailable"
    disc = 0
    if promo:
        p = next((p for p in DB["promo_codes"] if p["code"] == promo.upper() and p["is_active"]), None)
        if not p:
            return None, "invalid_promo"
        disc = min(round(sub * p["discount_value"] / 100), sub) if p["discount_type"] == "percentage" else min(p["discount_value"], sub)
    o = {"id": next_id("orders"), "tracking_code": "DY-%d" % NEXT_CODE[0], "request_id": req, "customer_name": name,
         "phone": phone, "wilaya": wilaya, "commune": commune or "", "delivery_type": dtype, "event_date": event_date,
         "box_size": total_qty, "items": lines, "custom_notes": notes or "", "inspiration_image_url": image,
         "promo_code": promo.upper() if promo else None, "subtotal": sub, "delivery_fee": fee, "discount_amount": disc,
         "total_price": sub - disc + fee, "status": "pending", "created_at": now_iso(), "updated_at": now_iso()}
    NEXT_CODE[0] += 1
    DB["orders"].append(o)
    log_status(o, "pending")
    for st in path:
        o["_prev"] = o["status"]
        o["status"] = st
        log_status(o, st, USERS["owner@example.test"]["id"])
    o.pop("_prev", None)
    return o, None


def seed_orders():
    img = None
    try:
        with open(os.path.join(ROOT, "assets", "atelier-3.webp"), "rb") as fh:
            name = "0f8fad5b-d9cb-469f-a165-70867728950e.webp"
            STORAGE[("inspirations", name)] = (fh.read(), "image/webp")
            img = "inspirations/" + name
    except OSError:
        pass
    insert_order("Nadia R.", "+213661000111", "16 - Alger", "Kouba", "delivery", day(-2),
                 [{"flavor_id": 1, "qty": 40}, {"flavor_id": 9, "qty": 20}], path=("confirmed", "baking", "completed"))
    insert_order("Karim T.", "+213770000222", "16 - Alger", "", "pickup", day(4),
                 [{"flavor_id": 3, "qty": 20}], path=("cancelled",))
    insert_order("Lina M.", "+213550000333", "9 - Blida", "Boufarik", "delivery", day(-1),
                 [{"flavor_id": 6, "qty": 20}, {"flavor_id": 7, "qty": 20}], path=("confirmed",))
    insert_order("Sofia B.", "+213660000444", "16 - Alger", "Hydra", "delivery", day(1),
                 [{"flavor_id": 1, "qty": 30}, {"flavor_id": 2, "qty": 30}],
                 notes="Baby shower — bleu poudré, prénom « Adam »", image=img)
    insert_order("Amina B.", "+213551401704", "16 - Alger", "Hydra", "delivery", day(6),
                 [{"flavor_id": 1, "qty": 20}, {"flavor_id": 2, "qty": 20}], path=("confirmed", "baking"))
    insert_order("Yasmine D.", "+213790000555", "31 - Oran", "Bir El Djir", "delivery", day(3),
                 [{"flavor_id": 8, "qty": 40}, {"flavor_id": 3, "qty": 40}], path=("confirmed",))


# ── tiny PostgREST: filters, order, limit ───────────────────────────────────
def as_str(v):
    if v is True:
        return "true"
    if v is False:
        return "false"
    if v is None:
        return "null"
    return str(v)


def cmp_vals(a, b):
    try:
        return (float(a) > float(b)) - (float(a) < float(b))
    except (TypeError, ValueError):
        a, b = as_str(a), str(b)
        return (a > b) - (a < b)


def parse_query(raw):
    filters, order, limit, conflict = [], None, None, None
    for k, v in parse_qsl(raw, keep_blank_values=True):
        if k in ("select", "columns", "offset"):
            continue
        if k == "order":
            order = v
        elif k == "limit":
            limit = int(v)
        elif k == "on_conflict":
            conflict = v
        else:
            op, _, val = v.partition(".")
            filters.append((k, op, val))
    return filters, order, limit, conflict


def match(row, filters):
    for col, op, val in filters:
        rv = row.get(col)
        if op == "eq" and as_str(rv) != val:
            return False
        if op == "neq" and as_str(rv) == val:
            return False
        if op == "in":
            vals = [x.strip().strip('"') for x in val.strip("()").split(",")]
            if as_str(rv) not in vals:
                return False
        if op == "is" and as_str(rv) != val:
            return False
        if op in ("gt", "gte", "lt", "lte"):
            if rv is None:
                return False
            c = cmp_vals(rv, val)
            if (op == "gt" and c <= 0) or (op == "gte" and c < 0) or (op == "lt" and c >= 0) or (op == "lte" and c > 0):
                return False
    return True


def apply_order(rows, order):
    rows = list(rows)
    if not order:
        return rows
    for part in reversed(order.split(",")):
        bits = part.split(".")
        col, desc = bits[0], "desc" in bits[1:]
        rows.sort(key=lambda r: (r.get(col) is None, r.get(col) if not isinstance(r.get(col), str) else r.get(col)),
                  reverse=desc)
    return rows


def public_row(table, row):
    return {k: v for k, v in row.items() if not k.startswith("_")}


def b64url(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()


def make_session(email):
    u = USERS[email]
    now = int(time.time())
    access = b64url({"alg": "HS256", "typ": "JWT"}) + "." + b64url(
        {"sub": u["id"], "email": email, "role": "authenticated", "aud": "authenticated",
         "iat": now, "exp": now + 3600, "session_id": str(uuid.uuid4())}) + ".mock"
    refresh = "r-" + uuid.uuid4().hex
    TOKENS[access] = email
    TOKENS[refresh] = email
    return {"access_token": access, "token_type": "bearer", "expires_in": 3600, "expires_at": now + 3600,
            "refresh_token": refresh, "user": user_json(email)}


def user_json(email):
    u = USERS[email]
    return {"id": u["id"], "aud": "authenticated", "role": "authenticated", "email": email,
            "email_confirmed_at": "2026-10-01T09:00:00Z", "phone": "", "confirmed_at": "2026-10-01T09:00:00Z",
            "app_metadata": {"provider": "email", "providers": ["email"]}, "user_metadata": {}, "identities": [],
            "created_at": "2026-10-01T09:00:00Z", "updated_at": now_iso(), "is_anonymous": False}


def multipart_file(ctype, body):
    """storage-js sends files as multipart/form-data: return (bytes, content type) of the file part."""
    if not ctype.startswith("multipart/"):
        return body, ctype or "application/octet-stream"
    msg = BytesParser(policy=email_policy.HTTP).parsebytes(b"Content-Type: " + ctype.encode() + b"\r\n\r\n" + body)
    for part in msg.iter_parts():
        if part.get_content_type() not in ("text/plain",) or part.get_filename():
            return part.get_payload(decode=True) or b"", part.get_content_type()
    return b"", "application/octet-stream"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    # ── helpers ──
    def _send(self, status, data=b"", ctype="application/json; charset=utf-8", headers=None):
        self.send_response(status)
        if data is not None:
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if data:
            self.wfile.write(data)

    def _json(self, status, body):
        self._send(status, json.dumps(body, ensure_ascii=False).encode("utf-8"))

    def _deny(self, table):
        self._json(401, {"code": "42501", "message": "permission denied for table %s" % table, "details": None, "hint": None})

    def _raw_body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def _body(self):
        try:
            return json.loads(self._raw_body() or b"{}")
        except ValueError:
            return {}

    def _who(self):
        h = self.headers.get("Authorization", "")
        tok = h[7:] if h.startswith("Bearer ") else ""
        email = TOKENS.get(tok)
        return (email, USERS[email]) if email else (None, None)

    def _admin(self):
        _, u = self._who()
        return bool(u and u["admin"])

    def _prefer(self, word):
        return word in (self.headers.get("Prefer") or "")

    # ── verbs ──
    def do_GET(self):
        url = urlparse(self.path)
        path = url.path
        if path == "/api/config":
            return self._json(200, {"supabaseUrl": "http://localhost:%d" % PORT, "supabaseAnonKey": ANON_KEY})
        if path == "/mock/set":
            STATE["holiday"] = "holiday=1" in url.query
            for r in DB["site_settings"]:
                if r["key"] == "holiday_mode":
                    r["value"]["enabled"] = STATE["holiday"]
            return self._json(200, STATE)
        if path == "/mock/new-order":   # simulate a customer order arriving
            o, _ = insert_order("Client test", "+213661234567", "16 - Alger", "El Biar", "delivery", day(3),
                                [{"flavor_id": 4, "qty": 20}])
            return self._json(200, receipt(o))
        if path == "/auth/v1/user":
            email, _ = self._who()
            if not email:
                return self._json(401, {"code": 401, "error_code": "bad_jwt", "msg": "invalid JWT"})
            return self._json(200, user_json(email))
        if path.startswith("/rest/v1/"):
            return self._rest_get(path[len("/rest/v1/"):], url.query)
        if path.startswith("/storage/v1/object/public/"):
            bucket, _, obj = unquote(path[len("/storage/v1/object/public/"):]).partition("/")
            hit = STORAGE.get((bucket, obj)) if bucket in PUBLIC_BUCKETS else None
            return self._send(200, hit[0], hit[1]) if hit else self._json(404, {"statusCode": "404", "error": "not_found", "message": "Object not found"})
        if path.startswith("/storage/v1/object/sign/"):
            tok = dict(parse_qsl(url.query)).get("token", "")
            hit = SIGNED.get(tok)
            data = STORAGE.get(hit) if hit else None
            return self._send(200, data[0], data[1]) if data else self._json(400, {"statusCode": "400", "error": "InvalidJWT", "message": "invalid signature"})
        return super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        path = url.path
        if path == "/auth/v1/token":
            body = self._body()
            grant = dict(parse_qsl(url.query)).get("grant_type")
            if grant == "password":
                email = str(body.get("email", "")).strip().lower()
                if email in USERS and body.get("password") == PASSWORD:
                    return self._json(200, make_session(email))
                return self._json(400, {"code": 400, "error_code": "invalid_credentials", "msg": "Invalid login credentials"})
            if grant == "refresh_token":
                email = TOKENS.get(body.get("refresh_token"))
                if email:
                    return self._json(200, make_session(email))
                return self._json(400, {"code": 400, "error_code": "refresh_token_not_found", "msg": "Invalid Refresh Token"})
            return self._json(400, {"code": 400, "msg": "unsupported grant"})
        if path == "/auth/v1/logout":
            h = self.headers.get("Authorization", "")
            TOKENS.pop(h[7:], None)
            return self._send(204, None)
        if path.startswith("/rest/v1/rpc/"):
            return self._rpc(path[len("/rest/v1/rpc/"):], self._body())
        if path.startswith("/rest/v1/"):
            return self._rest_insert(path[len("/rest/v1/"):], url.query)
        if path.startswith("/storage/v1/object/sign/"):
            bucket, _, obj = unquote(path[len("/storage/v1/object/sign/"):]).partition("/")
            if not self._admin():
                return self._json(400, {"statusCode": "403", "error": "Unauthorized", "message": "new row violates row-level security policy"})
            if (bucket, obj) not in STORAGE:
                return self._json(400, {"statusCode": "404", "error": "not_found", "message": "Object not found"})
            tok = "t-" + uuid.uuid4().hex
            SIGNED[tok] = (bucket, obj)
            return self._json(200, {"signedURL": "/object/sign/%s/%s?token=%s" % (bucket, obj, tok)})
        if path.startswith("/storage/v1/object/"):
            bucket, _, obj = unquote(path[len("/storage/v1/object/"):]).partition("/")
            ok = (bucket == "inspirations" and re.match(r"^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|heif)$", obj)) or \
                 (bucket in PUBLIC_BUCKETS and self._admin())
            if not ok:
                return self._json(400, {"statusCode": "403", "error": "Unauthorized", "message": "new row violates row-level security policy"})
            data, ctype = multipart_file(self.headers.get("Content-Type", ""), self._raw_body())
            STORAGE[(bucket, obj)] = (data, ctype)
            print("UPLOAD", bucket, obj, len(data), "bytes", ctype, flush=True)
            return self._json(200, {"Key": "%s/%s" % (bucket, obj), "Id": str(uuid.uuid4())})
        return self._json(404, {"message": "not found"})

    def do_PATCH(self):
        url = urlparse(self.path)
        if url.path.startswith("/rest/v1/"):
            return self._rest_update(url.path[len("/rest/v1/"):], url.query)
        return self._json(404, {"message": "not found"})

    def do_DELETE(self):
        url = urlparse(self.path)
        path = url.path
        if path.startswith("/rest/v1/"):
            return self._rest_delete(path[len("/rest/v1/"):], url.query)
        if path.startswith("/storage/v1/object/"):
            bucket = unquote(path[len("/storage/v1/object/"):]).strip("/")
            if not self._admin():
                return self._json(400, {"statusCode": "403", "error": "Unauthorized", "message": "row-level security"})
            removed = []
            for name in self._body().get("prefixes", []):
                if STORAGE.pop((bucket, name), None) is not None:
                    removed.append({"name": name, "bucket_id": bucket})
            return self._json(200, removed)
        return self._json(404, {"message": "not found"})

    # ── REST ──
    def _rest_get(self, table, query):
        if table not in DB:
            return self._json(404, {"code": "42P01", "message": "relation %s does not exist" % table})
        email, _ = self._who()
        if table not in PUBLIC_READ:
            if not email:
                return self._deny(table)
            if not self._admin():
                return self._json(200, [])
        filters, order, limit, _ = parse_query(query)
        rows = [public_row(table, r) for r in DB[table] if match(r, filters)]
        rows = apply_order(rows, order)
        if limit:
            rows = rows[:limit]
        return self._json(200, rows)

    def _rest_insert(self, table, query):
        if table not in DB:
            return self._json(404, {"code": "42P01", "message": "relation does not exist"})
        email, _ = self._who()
        if not email:
            return self._deny(table)
        if not self._admin():
            return self._json(403, {"code": "42501", "message": 'new row violates row-level security policy for table "%s"' % table})
        body = self._body()
        rows = body if isinstance(body, list) else [body]
        _, _, _, conflict = parse_query(query)
        out = []
        for r in rows:
            r = dict(r)
            if conflict and self._prefer("merge-duplicates"):
                hit = next((x for x in DB[table] if x.get(conflict) == r.get(conflict)), None)
                if hit:
                    hit.update(r)
                    out.append(hit)
                    continue
            if table == "promo_codes":
                if not re.match(r"^[A-Z0-9_-]{3,32}$", str(r.get("code", ""))):
                    return self._json(400, {"code": "23514", "message": 'new row violates check constraint "promo_codes_code_check"'})
                if any(p["code"] == r["code"] for p in DB[table]):
                    return self._json(409, {"code": "23505", "message": 'duplicate key value violates unique constraint "promo_codes_code_key"'})
                r.setdefault("is_active", True)
                r.setdefault("expires_at", None)
            if table == "flavors":
                if not str(r.get("name_fr", "")).strip():
                    return self._json(400, {"code": "23514", "message": 'new row violates check constraint "flavors_name_fr_check"'})
                for k in ("roman_numeral", "name_en", "name_ar", "desc_fr", "desc_en", "desc_ar", "image_url"):
                    r.setdefault(k, "")
                r.setdefault("price", None)
                r.setdefault("is_available", True)
                r.setdefault("sort_order", 0)
            if table == "gallery_posts":
                for k in ("title_fr", "title_en", "title_ar", "caption_fr", "caption_en", "caption_ar"):
                    r.setdefault(k, "")
                r.setdefault("sort_order", 0)
            if table != "site_settings" and "id" not in r:
                r["id"] = next_id(table)
            r.setdefault("created_at", now_iso())
            DB[table].append(r)
            out.append(r)
        if self._prefer("return=representation"):
            return self._json(201, [public_row(table, r) for r in out])
        return self._send(201, None)

    def _rest_update(self, table, query):
        if table not in DB:
            return self._json(404, {"code": "42P01", "message": "relation does not exist"})
        email, u = self._who()
        if not email:
            return self._deny(table)
        filters, _, _, _ = parse_query(query)
        patch = self._body()
        out = []
        if self._admin():
            for r in DB[table]:
                if match(r, filters):
                    prev = r.get("status")
                    r.update(patch)
                    if table in ("orders", "flavors", "site_settings"):
                        r["updated_at"] = now_iso()
                    if table == "orders" and "status" in patch and patch["status"] != prev:
                        r["_prev"] = prev
                        log_status(r, patch["status"], u["id"])
                        r.pop("_prev", None)
                    out.append(r)
        if self._prefer("return=representation"):
            return self._json(200, [public_row(table, r) for r in out])
        return self._send(204, None)

    def _rest_delete(self, table, query):
        if table not in DB:
            return self._json(404, {"code": "42P01", "message": "relation does not exist"})
        email, _ = self._who()
        if not email or table in NO_DELETE:
            return self._deny(table)
        filters, _, _, _ = parse_query(query)
        out = []
        if self._admin():
            keep = []
            for r in DB[table]:
                (out if match(r, filters) else keep).append(r)
            DB[table][:] = keep
        if self._prefer("return=representation"):
            return self._json(200, [public_row(table, r) for r in out])
        return self._send(204, None)

    # ── RPC ──
    def _rpc(self, fn, body):
        email, u = self._who()
        if fn == "is_admin":
            if not email:
                return self._json(401, {"code": "42501", "message": "permission denied for function is_admin"})
            return self._json(200, bool(u["admin"]))
        if fn == "validate_promo":
            code = str(body.get("p_code", "")).strip().upper()
            sub = int(body.get("p_subtotal") or 0)
            p = next((p for p in DB["promo_codes"] if p["code"] == code and p["is_active"]
                      and (not p.get("expires_at") or p["expires_at"] > now_iso())), None)
            if not p:
                return self._json(200, {"valid": False})
            amount = min(round(sub * p["discount_value"] / 100), sub) if p["discount_type"] == "percentage" else min(p["discount_value"], sub)
            return self._json(200, {"valid": True, "code": p["code"], "discount_type": p["discount_type"],
                                    "discount_value": p["discount_value"], "discount_amount": amount})
        if fn == "track_order":
            code = str(body.get("p_tracking_code", "")).upper().replace(" ", "")
            code = "DY-" + code.replace("DY-", "").replace("DY", "")
            phone = "".join(ch for ch in str(body.get("p_phone", "")) if ch.isdigit())[-9:]
            o = next((o for o in DB["orders"] if o["tracking_code"] == code and o["phone"][-9:] == phone), None)
            if not o:
                return self._json(200, None)
            hist = [{"status": l["to_status"], "at": l["changed_at"]} for l in DB["order_status_log"] if l["order_id"] == o["id"]]
            return self._json(200, dict(receipt(o), history=hist))
        if fn == "place_order":
            name = str(body.get("p_customer_name", "")).strip()
            if setting("holiday_mode").get("enabled") or name.lower() == "paused":
                return self._json(400, {"code": "P0001", "message": "orders_paused", "details": None, "hint": None})
            if name.lower() == "spam":
                return self._json(400, {"code": "P0001", "message": "too_many_orders", "details": None, "hint": None})
            if name.lower() == "slow":
                time.sleep(2)
            req = body.get("p_request_id")
            hit = next((o for o in DB["orders"] if req and o.get("request_id") == req), None)
            if hit:
                return self._json(200, receipt(hit))
            items = body.get("p_items") or []
            if sum(int(i.get("qty", 0)) for i in items) != int(body.get("p_box_size") or 0):
                return self._json(400, {"code": "P0001", "message": "invalid_box_size", "details": None, "hint": None})
            o, err = insert_order(name, str(body.get("p_phone", "")), body.get("p_wilaya"), body.get("p_commune"),
                                  body.get("p_delivery_type"), body.get("p_event_date"), items,
                                  notes=body.get("p_custom_notes"), image=body.get("p_inspiration_image_url"),
                                  promo=body.get("p_promo_code"), req=req)
            if err:
                return self._json(400, {"code": "P0001", "message": err, "details": None, "hint": None})
            print("ORDER", o["tracking_code"], json.dumps(body, ensure_ascii=True), flush=True)
            return self._json(200, receipt(o))
        return self._json(404, {"code": "PGRST202", "message": "function %s not found" % fn})


if __name__ == "__main__":
    seed_orders()
    print("Mock Supabase + site on http://localhost:%d  (atelier: /admin.html)" % PORT, flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
