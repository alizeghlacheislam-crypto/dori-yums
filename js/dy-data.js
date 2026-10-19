/* ══════════════════════════════════════════════════════════
   Dori Yums — data layer (window.DY)

   Supabase when it is configured, the local catalog otherwise.
   Nothing here ever throws to the page: missing keys, no network,
   a slow database or a blocked CDN all resolve to local data, so the
   site keeps working exactly as before.

   Configuration (public values only — protected by RLS):
     • on Vercel: env vars SUPABASE_URL + SUPABASE_ANON_KEY, served by /api/config
     • or set window.DY_CONFIG = { supabaseUrl, supabaseAnonKey } before this script
   ══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var SUPABASE_JS     = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
  var SUPABASE_JS_SRI = 'sha256-WdOUh8NYmEO0EDItij1WLOAiq6HlzLFomO8/sqDaLs0=';
  var CONFIG_URL      = '/api/config';
  var CONFIG_TIMEOUT  = 5000;
  var QUERY_TIMEOUT   = 6000;

  /* ─── local fallback — mirrors the seed rows in supabase_schema.sql ─── */
  var LOCAL = {
    flavors: [
      { id:1,  roman_numeral:'Ⅰ', name_fr:'Fraise',           name_en:'Strawberry',           name_ar:'الفراولة',
        desc_fr:'Crème délicate à la fraise dans une coque rose poudré.', desc_en:'Delicate strawberry cream in a blush-pink shell.', desc_ar:'كريمة فراولة رقيقة داخل قشرة وردية.',
        image_url:'assets/m-rose.webp', price:120, is_available:true, sort_order:1 },
      { id:2,  roman_numeral:'Ⅱ', name_fr:'Pistache',         name_en:'Pistachio',            name_ar:'الفستق',
        desc_fr:'Pistache torréfiée, douce et délicatement parfumée.', desc_en:'Slow-roasted pistachio, gently sweet and nutty.', desc_ar:'فستق محمّص على مهل، حلو برقّة وبنكهة المكسّرات.',
        image_url:'assets/m-pistachio.webp', price:180, is_available:true, sort_order:2 },
      { id:3,  roman_numeral:'Ⅲ', name_fr:'Chocolat Noir',    name_en:'Dark chocolate',       name_ar:'الشوكولاتة السوداء',
        desc_fr:'Ganache intense au chocolat noir, à peine sucrée.', desc_en:'Deep dark-chocolate ganache, barely sweet.', desc_ar:'غاناش شوكولاتة داكنة عميقة، بحلاوة خفيفة.',
        image_url:'assets/m-chocolate.webp', price:150, is_available:true, sort_order:3 },
      { id:4,  roman_numeral:'Ⅳ', name_fr:'Banane Chocolat',  name_en:'Banana chocolate',     name_ar:'موز بالشوكولاتة',
        desc_fr:'Banane mûre mariée à une crème au chocolat au lait.', desc_en:'Ripe banana folded into milk-chocolate cream.', desc_ar:'موز ناضج ممزوج بكريمة شوكولاتة الحليب.',
        image_url:'assets/m-banana.webp', price:120, is_available:true, sort_order:4 },
      { id:5,  roman_numeral:'Ⅴ', name_fr:'Fraise Framboise', name_en:'Strawberry raspberry', name_ar:'فراولة بالتوت',
        desc_fr:'Fraise et framboise, vives et acidulées.', desc_en:'Strawberry and raspberry, bright and tangy.', desc_ar:'فراولة وتوت العليق، نكهة حيوية ومنعشة.',
        image_url:'assets/m-strawberry.webp', price:140, is_available:true, sort_order:5 },
      { id:6,  roman_numeral:'Ⅵ', name_fr:'Citron',           name_en:'Lemon',                name_ar:'الليمون',
        desc_fr:'Crème au citron ensoleillée, vive puis douce.', desc_en:'Sun-bright lemon cream, sharp then sweet.', desc_ar:'كريمة ليمون مشمسة، حادّة ثم حلوة.',
        image_url:'assets/m-lemon.webp', price:120, is_available:true, sort_order:6 },
      { id:7,  roman_numeral:'Ⅶ', name_fr:'Coco Ananas',      name_en:'Coconut pineapple',    name_ar:'جوز الهند والأناناس',
        desc_fr:"Une coque coco au cœur d'ananas.", desc_en:'A coconut shell with a pineapple heart.', desc_ar:'قشرة جوز هند بقلب أناناس.',
        image_url:'assets/m-coconut.webp', price:120, is_available:true, sort_order:7 },
      { id:8,  roman_numeral:'Ⅷ', name_fr:'Noisette Praliné', name_en:'Hazelnut praliné',     name_ar:'البندق والبرالين',
        desc_fr:'Praliné noisette torréfié, chaleureux et fondant.', desc_en:'Toasted hazelnut praliné, warm and buttery.', desc_ar:'برالين بندق محمّص، دافئ وذائب.',
        image_url:'assets/m-pecan.webp', price:180, is_available:true, sort_order:8 },
      { id:9,  roman_numeral:'Ⅸ', name_fr:'Vanille Caramel',  name_en:'Vanilla caramel',      name_ar:'الفانيليا بالكراميل',
        desc_fr:'Crème vanille et ruban de caramel fondant.', desc_en:'Vanilla cream with a soft caramel ribbon.', desc_ar:'كريمة فانيليا مع شريط كراميل ناعم.',
        image_url:'assets/m-vanilla.webp', price:140, is_available:true, sort_order:9 },
      { id:10, roman_numeral:'Ⅹ', name_fr:'Cerise Chocolat',  name_en:'Cherry chocolate',     name_ar:'كرز بالشوكولاتة',
        desc_fr:'Cerise noire sur un cœur de crème au chocolat.', desc_en:'Dark cherry over a chocolate cream heart.', desc_ar:'كرز أسود فوق قلب من كريمة الشوكولاتة.',
        image_url:'assets/m-cherry.webp', price:140, is_available:true, sort_order:10 },
      { id:11, roman_numeral:'Ⅺ', name_fr:'Coco Chocolat',    name_en:'Coconut chocolate',    name_ar:'جوز الهند بالشوكولاتة',
        desc_fr:"Coco et chocolat, l'accord classique.", desc_en:'Coconut and chocolate, the classic pairing.', desc_ar:'جوز الهند والشوكولاتة، الثنائي الكلاسيكي.',
        image_url:'assets/m-coconut-choc.webp', price:120, is_available:true, sort_order:11 },
      { id:12, roman_numeral:'Ⅻ', name_fr:'Orange',           name_en:'Orange',               name_ar:'البرتقال',
        desc_fr:"Zeste d'orange confite, légèrement amer.", desc_en:'Candied orange zest, gently bitter.', desc_ar:'قشر برتقال مسكّر، بمرارة لطيفة.',
        image_url:'assets/m-orange.webp', price:120, is_available:true, sort_order:12 }
    ],
    gallery: [
      { id:1, category:'atelier', image_url:'assets/atelier-0.webp', sort_order:1,
        title_fr:'Coffrets cadeaux', title_en:'Gift coffrets', title_ar:'علب هدايا',
        caption_fr:'En boîte, rubannés, prêts à offrir.', caption_en:'Boxed and ribboned, ready to offer.', caption_ar:'في علب مزيّنة بشريط، جاهزة للإهداء.' },
      { id:2, category:'atelier', image_url:'assets/atelier-2.webp', sort_order:2,
        title_fr:'Instants dressés', title_en:'Plated moments', title_ar:'لحظات مرتَّبة',
        caption_fr:'Accordés aux couleurs de votre fête.', caption_en:'Color-matched to your celebration.', caption_ar:'بألوان تناسب احتفالكم.' },
      { id:3, category:'atelier', image_url:'assets/atelier-3.webp', sort_order:3,
        title_fr:"Plateaux d'événement", title_en:'Event trays', title_ar:'صوانٍ للمناسبات',
        caption_fr:'Prêts à servir, du shower à la soirée.', caption_en:'Ready to serve, from shower to soirée.', caption_ar:'جاهزة للتقديم، من الاستقبال إلى السهرة.' },
      { id:4, category:'testimonial', image_url:'assets/testimonial-1.jpg', sort_order:1,
        title_fr:'@perrie_chapier', title_en:'@perrie_chapier', title_ar:'@perrie_chapier',
        caption_fr:'masterpiece 😍😍😍😍', caption_en:'masterpiece 😍😍😍😍', caption_ar:'masterpiece 😍😍😍😍' },
      { id:5, category:'testimonial', image_url:'assets/testimonial-2.jpg', sort_order:2,
        title_fr:'@_meriem_mer._', title_en:'@_meriem_mer._', title_ar:'@_meriem_mer._',
        caption_fr:'Je valide a 100% les meilleurs, mais vraiment la variété des goûts parfait',
        caption_en:'Je valide a 100% les meilleurs, mais vraiment la variété des goûts parfait',
        caption_ar:'Je valide a 100% les meilleurs, mais vraiment la variété des goûts parfait' },
      { id:6, category:'testimonial', image_url:'assets/testimonial-3.jpg', sort_order:3,
        title_fr:'@sabrinahalouane', title_en:'@sabrinahalouane', title_ar:'@sabrinahalouane',
        caption_fr:"Je confirme c'est un délice au palais et un plaisir à déguster",
        caption_en:"Je confirme c'est un délice au palais et un plaisir à déguster",
        caption_ar:"Je confirme c'est un délice au palais et un plaisir à déguster" }
    ],
    settings: {
      pricing:      { currency:'DZD', base_unit_price:120, tiers:[ { min_qty:60, discount_per_piece:5 }, { min_qty:120, discount_per_piece:10 } ] },
      ordering:     { box_sizes:[20,40,60,80,120], box_step:20, min_pieces:20, max_pieces:1000, flavor_step:5, min_lead_days:2, whatsapp_number:'213551401704' },
      delivery:     { pickup_fee:0, default_fee:1000, wilaya_fees:{ '16':500 } },
      announcement: { enabled:false, text_fr:'', text_en:'', text_ar:'' },
      holiday_mode: { enabled:false,
                      message_fr:'Les commandes de cette semaine sont complètes — merci ! Nous rouvrons très bientôt.',
                      message_en:"This week's orders are full — thank you! We reopen very soon.",
                      message_ar:'اكتملت طلبيات هذا الأسبوع — شكرًا لكم! نعود قريبًا جدًا.' }
    }
  };

  function clone(v){ return JSON.parse(JSON.stringify(v)); }

  function withTimeout(promise, ms){
    return new Promise(function(resolve, reject){
      var timer = setTimeout(function(){ reject(new Error('timeout')); }, ms);
      Promise.resolve(promise).then(
        function(v){ clearTimeout(timer); resolve(v); },
        function(e){ clearTimeout(timer); reject(e); }
      );
    });
  }

  /* ─── configuration ─── */
  /* null = not configured. A failed attempt (offline, timeout, server error) also resolves null
     but sets configFailed and is NOT memoized, so the next call asks again. */
  var configPromise = null, configFailed = false;
  function getConfig(){
    if(configPromise) return configPromise;
    configFailed = false;
    configPromise = (function(){
      var preset = window.DY_CONFIG;
      if(preset && preset.supabaseUrl && preset.supabaseAnonKey) return Promise.resolve(preset);
      if(typeof fetch !== 'function') return Promise.resolve(null);
      return withTimeout(fetch(CONFIG_URL, { headers:{ 'Accept':'application/json' } }), CONFIG_TIMEOUT)
        .then(function(r){
          if(r.status >= 500) throw new Error('config ' + r.status);
          return r.ok ? r.json() : null;      /* 404 = plain static server: no backend */
        });
    })().then(function(c){
      if(!c || typeof c.supabaseUrl !== 'string' || typeof c.supabaseAnonKey !== 'string') return null;
      if(!/^https?:\/\/[^\s/]+/.test(c.supabaseUrl) || c.supabaseAnonKey.length < 20) return null;
      return { supabaseUrl: c.supabaseUrl.replace(/\/+$/, ''), supabaseAnonKey: c.supabaseAnonKey };
    }).catch(function(){ configFailed = true; configPromise = null; return null; });
    return configPromise;
  }

  /* ─── supabase-js (UMD build, pinned + integrity-checked, loaded only when configured) ─── */
  var libPromise = null;
  function loadLibrary(){
    if(libPromise) return libPromise;
    libPromise = new Promise(function(resolve, reject){
      if(window.supabase && typeof window.supabase.createClient === 'function') return resolve(window.supabase);
      var s = document.createElement('script');
      s.src = SUPABASE_JS;
      s.integrity = SUPABASE_JS_SRI;
      s.crossOrigin = 'anonymous';
      s.async = true;
      s.onload = function(){
        if(window.supabase && typeof window.supabase.createClient === 'function') resolve(window.supabase);
        else reject(new Error('supabase-js missing'));
      };
      s.onerror = function(){ reject(new Error('supabase-js failed to load')); };
      document.head.appendChild(s);
    });
    libPromise = withTimeout(libPromise, QUERY_TIMEOUT).catch(function(e){ libPromise = null; throw e; });
    return libPromise;
  }

  /* public-site client: no auth session, nothing written to storage */
  var clientPromise = null;
  function getClient(){
    if(clientPromise) return clientPromise;
    clientPromise = getConfig().then(function(cfg){
      if(!cfg){ if(configFailed) clientPromise = null; return null; }   /* retry later after a failed attempt */
      return loadLibrary().then(function(lib){
        return lib.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
        });
      });
    }).catch(function(){ clientPromise = null; return null; });
    return clientPromise;
  }

  /* ─── catalog: flavors, gallery, settings ─── */
  function selectAll(client, table){
    return withTimeout(
      client.from(table).select('*').order('sort_order', { ascending:true }).order('id', { ascending:true }),
      QUERY_TIMEOUT
    ).then(function(res){
      if(res.error || !Array.isArray(res.data)) throw res.error || new Error('bad response');
      return res.data;
    });
  }
  function selectSettings(client){
    return withTimeout(client.from('site_settings').select('key,value'), QUERY_TIMEOUT).then(function(res){
      if(res.error || !Array.isArray(res.data)) throw res.error || new Error('bad response');
      return res.data;
    });
  }
  function settled(p){ return p.then(function(v){ return { ok:true, value:v }; }, function(){ return { ok:false }; }); }

  /* Resolves to { source, parts:{flavors,gallery,settings}, flavors, gallery, settings }.
     Each part is 'remote' only when it came back from the database and is usable;
     an empty table never blanks the site — the local copy is kept instead. */
  var loadPromise = null;
  function load(){
    if(loadPromise) return loadPromise;
    var local = clone(LOCAL);
    var result = { source:'local', parts:{ flavors:'local', gallery:'local', settings:'local' },
                   flavors:local.flavors, gallery:local.gallery, settings:local.settings };
    loadPromise = getClient().then(function(client){
      if(!client) return result;
      return Promise.all([
        settled(selectAll(client, 'flavors')),
        settled(selectAll(client, 'gallery_posts')),
        settled(selectSettings(client))
      ]).then(function(r){
        if(r[0].ok && r[0].value.length){ result.flavors = r[0].value; result.parts.flavors = 'remote'; }
        if(r[1].ok && r[1].value.length){ result.gallery = r[1].value; result.parts.gallery = 'remote'; }
        if(r[2].ok){
          r[2].value.forEach(function(row){
            if(row && row.key && row.value && typeof row.value === 'object'){
              result.settings[row.key] = Object.assign({}, result.settings[row.key] || {}, row.value);
            }
          });
          result.parts.settings = 'remote';
        }
        if(r[0].ok || r[1].ok || r[2].ok) result.source = 'remote';
        return result;
      });
    }).catch(function(){ return result; });
    return loadPromise;
  }

  /* ─── orders, tracking, promo codes, inspiration upload ───
     Each resolves to { ok:true, ... } or { ok:false, error } where error is
     'not_configured', 'network', or a key raised by the database
     (orders_paused, invalid_phone, flavor_unavailable, …). */
  function errorKey(e){
    var m = (e && (e.message || e.error_description || e.error)) || '';
    if(/^[a-z_]{3,40}$/.test(m)) return m;
    var hit = /\b(orders_paused|invalid_[a-z_]+|delivery_unavailable|flavor_unavailable|too_many_orders)\b/.exec(m);
    return hit ? hit[1] : 'network';
  }
  function rpc(name, args){
    return getClient().then(function(client){
      if(!client) return { ok:false, error:'not_configured' };
      return withTimeout(client.rpc(name, args), QUERY_TIMEOUT * 2).then(function(res){
        if(res.error) return { ok:false, error:errorKey(res.error) };
        return { ok:true, data:res.data };
      });
    }).catch(function(e){ return { ok:false, error:errorKey(e) }; });
  }

  function uuid(){
    if(window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }

  /* order = { customer_name, phone, wilaya, commune, delivery_type, event_date (YYYY-MM-DD),
               box_size, items:[{flavor_id, qty}], custom_notes, inspiration_image_url,
               promo_code, request_id }
     Prices are not sent: the database computes them. Reuse the same request_id
     when retrying the same order, so a retry never creates a duplicate. */
  function placeOrder(order){
    order = order || {};
    return rpc('place_order', {
      p_customer_name:         order.customer_name || '',
      p_phone:                 order.phone || '',
      p_wilaya:                order.wilaya || '',
      p_commune:               order.commune || '',
      p_delivery_type:         order.delivery_type || '',
      p_event_date:            order.event_date || null,
      p_box_size:              order.box_size || 0,
      p_items:                 (order.items || []).map(function(i){ return { flavor_id:i.flavor_id, qty:i.qty }; }),
      p_custom_notes:          order.custom_notes || '',
      p_inspiration_image_url: order.inspiration_image_url || null,
      p_promo_code:            order.promo_code || null,
      p_request_id:            order.request_id || uuid()
    }).then(function(r){ return r.ok ? { ok:true, order:r.data } : r; });
  }

  /* → { ok:true, order } where order is null when the code/phone pair matches nothing */
  function trackOrder(code, phone){
    return rpc('track_order', { p_tracking_code:code || '', p_phone:phone || '' })
      .then(function(r){ return r.ok ? { ok:true, order:r.data || null } : r; });
  }

  /* → { ok:true, promo:{ valid, code, discount_type, discount_value, discount_amount } } */
  function validatePromo(code, subtotal){
    return rpc('validate_promo', { p_code:code || '', p_subtotal:Math.max(0, subtotal | 0) })
      .then(function(r){ return r.ok ? { ok:true, promo:r.data || { valid:false } } : r; });
  }

  var IMAGE_TYPES = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/heic':'heic', 'image/heif':'heif' };
  var IMAGE_MAX_BYTES = 5 * 1024 * 1024;

  /* Phone photos are often 3–12 MB: downscale to ≤ maxSide px (WebP, JPEG fallback) before upload.
     Formats the browser cannot decode (e.g. HEIC outside Safari) come back unchanged. */
  function prepareImage(file, maxSide, quality){
    maxSide = maxSide || 1600; quality = quality || 0.85;
    if(!file || !/^image\//.test(file.type) || typeof createImageBitmap !== 'function') return Promise.resolve(file);
    return createImageBitmap(file).then(function(bmp){
      var scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      /* small JPEG/PNG/WebP are kept as they are; anything else decodable (GIF, BMP…) is re-encoded */
      if(scale === 1 && file.size <= 1.5 * 1024 * 1024 && /^image\/(jpeg|png|webp)$/.test(file.type)){ if(bmp.close) bmp.close(); return file; }
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      if(bmp.close) bmp.close();
      function encode(type){ return new Promise(function(res){ c.toBlob(function(b){ res(b); }, type, quality); }); }
      return encode('image/webp').then(function(b){ return b && b.type === 'image/webp' ? b : encode('image/jpeg'); })
        .then(function(b){
          if(!b) return file;
          var ext = b.type === 'image/webp' ? 'webp' : 'jpg';
          try{ return new File([b], String(file.name || 'photo').replace(/\.[^.]+$/, '') + '.' + ext, { type:b.type }); }
          catch(e){ return b; }
        });
    }).catch(function(){ return file; });
  }

  /* → { ok:true, path:'inspirations/<uuid>.<ext>' } — pass path as inspiration_image_url */
  function uploadInspiration(file){
    if(!file || !IMAGE_TYPES[file.type]) return Promise.resolve({ ok:false, error:'invalid_image' });
    return prepareImage(file).then(function(img){
      if(!IMAGE_TYPES[img.type]) return { ok:false, error:'invalid_image' };
      if(img.size > IMAGE_MAX_BYTES) return { ok:false, error:'image_too_large' };
      return getClient().then(function(client){
        if(!client) return { ok:false, error:'not_configured' };
        var name = uuid() + '.' + IMAGE_TYPES[img.type];
        return withTimeout(client.storage.from('inspirations').upload(name, img, { contentType:img.type, upsert:false }), 60000)
          .then(function(res){
            if(res.error) return { ok:false, error:errorKey(res.error) };
            return { ok:true, path:'inspirations/' + name };
          });
      });
    }).catch(function(e){ return { ok:false, error:errorKey(e) }; });
  }

  window.DY = {
    load: load,
    placeOrder: placeOrder,
    trackOrder: trackOrder,
    validatePromo: validatePromo,
    uploadInspiration: uploadInspiration,
    prepareImage: prepareImage,
    getConfig: getConfig,
    configFailed: function(){ return configFailed; },
    loadLibrary: loadLibrary,
    isConfigured: function(){ return getClient().then(function(c){ return !!c; }); },
    local: function(){ return clone(LOCAL); },
    newRequestId: uuid
  };
})();
