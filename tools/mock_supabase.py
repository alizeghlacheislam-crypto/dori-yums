"""
Local stand-in for Supabase, to test the site's "live catalog" mode without real keys.

  python tools/mock_supabase.py            -> http://localhost:4175

Serves the site itself, plus:
  GET  /api/config                 -> points the site at this server
  GET  /rest/v1/flavors            -> fixture flavors (deliberately different from the static page)
  GET  /rest/v1/gallery_posts      -> fixture gallery
  GET  /rest/v1/site_settings      -> fixture settings (changed price tiers)
  POST /rest/v1/rpc/place_order    -> simplified pricing, stores the order in memory (DY-1043, DY-1044…)
  POST /rest/v1/rpc/track_order    -> stored orders, plus fixture DY-1042 / 0551401704 (status "baking")
  POST /rest/v1/rpc/validate_promo -> TEST10 = 10 %
  POST /storage/v1/object/inspirations/<name> -> accepts uploads
  GET  /mock/set?holiday=1         -> switch holiday mode on (holiday=0 off)
  Customer names "paused" / "spam" / "slow" trigger orders_paused / too_many_orders / a 2 s delay.

Fixture differences you should see on the page:
  * Pistache costs 200 DZD and its EN/FR/AR descriptions start with "[DB]"
  * a 13th flavor "Rose Litchi" (unavailable)
  * 2 atelier cards instead of 3, testimonials unchanged
  * tiers: -5 DZD from 40 pieces, -15 DZD from 100 pieces
Dev tool only — excluded from the Vercel deployment (.vercelignore).
"""
import json
import os
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "4175"))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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
RECEIPT = {
    "tracking_code": "DY-1042", "status": "baking", "customer_name": "Amina B.", "delivery_type": "delivery",
    "wilaya": "16 - Alger", "commune": "Hydra", "event_date": "2026-10-25", "box_size": 40,
    "items": [{"flavor_id": 1, "name_fr": "Fraise", "name_en": "Strawberry", "name_ar": "الفراولة", "qty": 20, "unit_price": 125, "line_total": 2500},
              {"flavor_id": 2, "name_fr": "Pistache", "name_en": "Pistachio", "name_ar": "الفستق", "qty": 20, "unit_price": 195, "line_total": 3900}],
    "promo_code": None, "subtotal": 6400, "delivery_fee": 500, "discount_amount": 0, "total_price": 6900,
    "created_at": "2026-10-19T09:00:00Z",
    "history": [{"status": "pending", "at": "2026-10-19T09:00:00Z"}, {"status": "confirmed", "at": "2026-10-19T10:00:00Z"},
                {"status": "baking", "at": "2026-10-20T08:00:00Z"}],
}


ORDERS = {}          # tracking_code -> receipt (+ phone, request_id)
NEXT_CODE = [1043]
STATE = {"holiday": False}


def compute_receipt(body):
    """Simplified place_order(): same pricing rule as the database (tier on the whole box)."""
    pricing = SETTINGS[0]["value"]
    delivery = SETTINGS[2]["value"]
    items = body.get("p_items") or []
    total_qty = sum(int(i.get("qty", 0)) for i in items)
    tier = 0
    for t in sorted(pricing["tiers"], key=lambda t: t["min_qty"]):
        if total_qty >= t["min_qty"]:
            tier = t["discount_per_piece"]
    by_id = {f["id"]: f for f in FLAVORS}
    lines, sub = [], 0
    for i in items:
        f = by_id.get(int(i["flavor_id"]))
        if not f:
            return None, "invalid_items"
        if not f["is_available"]:
            return None, "flavor_unavailable"
        unit = max((f["price"] if f["price"] is not None else pricing["base_unit_price"]) - tier, 0)
        lines.append({"flavor_id": f["id"], "name_fr": f["name_fr"], "name_en": f["name_en"], "name_ar": f["name_ar"],
                      "qty": int(i["qty"]), "unit_price": unit, "line_total": unit * int(i["qty"])})
        sub += unit * int(i["qty"])
    if total_qty != int(body.get("p_box_size") or 0):
        return None, "invalid_box_size"
    if body.get("p_delivery_type") == "pickup":
        fee = delivery["pickup_fee"]
    else:
        code = str(int(str(body.get("p_wilaya", "0")).split(" ")[0] or 0))
        fee = delivery["wilaya_fees"].get(code, delivery["default_fee"])
    disc = round(sub * 0.1) if str(body.get("p_promo_code") or "").upper() == "TEST10" else 0
    return {
        "status": "pending", "customer_name": body.get("p_customer_name"), "delivery_type": body.get("p_delivery_type"),
        "wilaya": body.get("p_wilaya"), "commune": body.get("p_commune"), "event_date": body.get("p_event_date"),
        "box_size": total_qty, "items": lines, "promo_code": (body.get("p_promo_code") or None) and body["p_promo_code"].upper(),
        "subtotal": sub, "delivery_fee": fee, "discount_amount": disc, "total_price": sub - disc + fee,
        "created_at": "2026-10-19T10:30:00Z",
    }, None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def _json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/config":
            return self._json(200, {"supabaseUrl": f"http://localhost:{PORT}",
                                    "supabaseAnonKey": "mock-anon-key-0123456789abcdef"})
        if path == "/rest/v1/flavors":
            return self._json(200, FLAVORS)
        if path == "/rest/v1/gallery_posts":
            return self._json(200, GALLERY)
        if path == "/rest/v1/site_settings":
            rows = json.loads(json.dumps(SETTINGS))
            rows[4]["value"]["enabled"] = STATE["holiday"]
            return self._json(200, rows)
        if path == "/mock/set":   # /mock/set?holiday=1  (test switch)
            q = urlparse(self.path).query
            STATE["holiday"] = "holiday=1" in q
            return self._json(200, STATE)
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            body = json.loads(raw or b"{}")
        except ValueError:
            body = {}
        if path == "/rest/v1/rpc/track_order":
            code = str(body.get("p_tracking_code", "")).upper().replace(" ", "")
            code = "DY-" + code.replace("DY-", "").replace("DY", "")
            phone = "".join(ch for ch in str(body.get("p_phone", "")) if ch.isdigit())[-9:]
            if code == "DY-1042" and phone == "551401704":
                return self._json(200, RECEIPT)
            o = ORDERS.get(code)
            if o and o["_phone"][-9:] == phone:
                return self._json(200, {k: v for k, v in o.items() if not k.startswith("_")})
            return self._json(200, None)
        if path == "/rest/v1/rpc/validate_promo":
            ok = str(body.get("p_code", "")).strip().upper() == "TEST10"
            sub = int(body.get("p_subtotal") or 0)
            return self._json(200, {"valid": True, "code": "TEST10", "discount_type": "percentage", "discount_value": 10,
                                    "discount_amount": round(sub * 0.1)} if ok else {"valid": False})
        if path == "/rest/v1/rpc/place_order":
            name = str(body.get("p_customer_name", "")).strip().lower()
            if STATE["holiday"] or name == "paused":
                return self._json(400, {"code": "P0001", "message": "orders_paused", "details": None, "hint": None})
            if name == "spam":
                return self._json(400, {"code": "P0001", "message": "too_many_orders", "details": None, "hint": None})
            if name == "slow":
                time.sleep(2)
            for o in ORDERS.values():   # idempotency, like the request_id unique key
                if body.get("p_request_id") and o["_req"] == body.get("p_request_id"):
                    return self._json(200, {k: v for k, v in o.items() if not k.startswith("_")})
            receipt, error = compute_receipt(body)
            if error:
                return self._json(400, {"code": "P0001", "message": error, "details": None, "hint": None})
            code = f"DY-{NEXT_CODE[0]}"
            NEXT_CODE[0] += 1
            receipt.update({"tracking_code": code, "history": [{"status": "pending", "at": "2026-10-19T10:30:00Z"}]})
            ORDERS[code] = dict(receipt, _phone=str(body.get("p_phone", "")), _req=body.get("p_request_id"),
                                _image=body.get("p_inspiration_image_url"), _notes=body.get("p_custom_notes"))
            print("ORDER", code, json.dumps(body, ensure_ascii=False), flush=True)
            return self._json(200, {k: v for k, v in receipt.items() if k != "history"})
        if path.startswith("/storage/v1/object/inspirations/"):
            return self._json(200, {"Key": path.split("/storage/v1/object/", 1)[1]})
        return self._json(404, {"message": "not found"})


if __name__ == "__main__":
    print(f"Mock Supabase + site on http://localhost:{PORT}", flush=True)
    sys.stdout.flush()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
