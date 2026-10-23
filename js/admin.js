/* ══════════════════════════════════════════════════════════
   Dori Yums — atelier (owner admin PWA)

   Static page + supabase-js (the same pinned build as the site, loaded by
   js/dy-data.js). Every permission is enforced by the database (RLS:
   only users listed in private.admin_users can read orders or write
   anything); this page only decides what to show.

   Tabs: orders (realtime + sound) · baking calendar · flavors · gallery ·
   settings (stats, prices, rules, delivery, announcement, holiday, promos).
   ══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ─── i18n (FR default · AR · EN). Customer-facing WhatsApp texts stay French. ─── */
  var I18N = {
    fr: {
      'app.title':'Atelier','app.logout':'Se déconnecter','app.refresh':'Actualiser','app.save':'Enregistrer','app.saved':'Enregistré',
      'app.cancel':'Annuler','app.delete':'Supprimer','app.edit':'Modifier','app.add':'Ajouter','app.close':'Fermer',
      'app.error':'Une erreur est survenue : {m}','app.offline':'Hors ligne — les données affichées peuvent être anciennes.',
      'app.confirmDelete':'Supprimer définitivement « {n} » ?','app.moveUp':'Monter','app.moveDown':'Descendre',
      'app.live':'En direct','app.polling':'Actualisation auto','app.offlineShort':'Hors ligne',
      'app.soundOn':'Son des nouvelles commandes : activé','app.soundOff':'Son des nouvelles commandes : coupé',
      'app.sessionEnded':'Session expirée — reconnectez-vous.','app.notSaved':'Modification non enregistrée — actualisez puis réessayez.',
      'cfg.title':"Supabase n'est pas encore connecté",
      'cfg.body':"L'atelier a besoin de la base de données pour fonctionner. Le site public, lui, continue de marcher normalement.",
      'cfg.s1':'Exécutez supabase_schema.sql dans Supabase → SQL Editor.',
      'cfg.s2':'Créez le compte de la maison (Authentication → Users), puis donnez-lui l’accès avec la ligne private.admin_users en tête du fichier SQL.',
      'cfg.s3':'Dans Vercel → Settings → Environment Variables, ajoutez SUPABASE_URL et SUPABASE_ANON_KEY, puis redéployez.',
      'login.title':'Atelier Dori Yums','login.sub':'Espace réservé à la maison.','login.email':'E-mail','login.password':'Mot de passe',
      'login.submit':'Se connecter','login.busy':'Connexion…','login.bad':'E-mail ou mot de passe incorrect.',
      'login.network':'Connexion impossible — vérifiez internet puis réessayez.',
      'denied.title':'Accès refusé','denied.body':"Ce compte n'est pas autorisé à gérer l'atelier.",
      'mfa.title':'Code de vérification','mfa.sub':"Saisissez le code à 6 chiffres affiché par votre application d'authentification.",
      'mfa.device':'Appareil','mfa.code':'Code','mfa.submit':'Vérifier','mfa.busy':'Vérification…',
      'mfa.six':'Le code compte 6 chiffres.','mfa.bad':"Code incorrect — vérifiez que l'heure du téléphone est juste, puis réessayez.",
      'mfa.tooMany':"Trop d'essais — patientez une minute puis réessayez.",'mfa.expired':'Le code a expiré — saisissez le nouveau code.',
      'mfa.lost':"Téléphone perdu ? Saisissez le code de votre appareil de secours. Sans lui, la récupération se fait depuis votre compte Supabase.",
      'sec.title':'Sécurité du compte','sec.on':'Code de vérification activé',
      'sec.offHint':"Aujourd'hui, la connexion ne demande que le mot de passe. Ajoutez un code à 6 chiffres donné par une application d'authentification : quelqu'un qui connaît seulement le mot de passe ne pourra plus entrer.",
      'sec.onHint':'Sur un nouvel appareil, la connexion demande le mot de passe puis le code. Vos appareils habituels restent connectés.',
      'sec.setup':'Activer le code de vérification','sec.devices':"Applications d'authentification",'sec.added':'ajoutée le {d}',
      'sec.addBackup':'Ajouter un appareil de secours','sec.backupHint':"Conseillé : un 2e appareil (ou un gestionnaire de mots de passe) garde l'accès si le téléphone est perdu.",
      'sec.remove':'Retirer','sec.confirmRemove':'Retirer « {n} » ? Ses codes ne permettront plus de se connecter.','sec.removed':'Appareil retiré.',
      'sec.sessions':'Appareils connectés','sec.logoutAll':'Déconnecter tous les appareils',
      'sec.logoutAllHint':"Si un téléphone ou un ordinateur est perdu : chaque appareil devra se reconnecter (mot de passe, puis code).",
      'sec.confirmLogoutAll':'Déconnecter tous les appareils, y compris celui-ci ?','sec.loggedOutAll':'Tous les appareils ont été déconnectés.',
      'sec.enabled':'Code de vérification activé. Les autres appareils connectés sans code ont été déconnectés.',
      'sec.nudge':'Protégez le compte : activez le code de vérification.','sec.nudgeBtn':'Activer',
      'en.title':'Activer le code de vérification','en.titleBackup':'Ajouter un appareil de secours','en.busy':'Préparation…',
      'en.s1':"Installez une application d'authentification sur le téléphone (Google Authenticator, Microsoft Authenticator…).",
      'en.s2':"Ajoutez le compte : scannez ce QR code avec l'application ou, sur ce téléphone, touchez « Ouvrir dans l'application ».",
      'en.open':"Ouvrir dans l'application",'en.key':'Ou saisissez cette clé à la main :','en.copy':'Copier','en.copied':'Clé copiée.',
      'en.keySecret':'Gardez cette clé pour vous : elle permet de créer les codes.',
      'en.s3':"Saisissez le code à 6 chiffres affiché par l'application.",'en.confirm':'Confirmer et activer',
      'tab.orders':'Commandes','tab.calendar':'Fournées','tab.flavors':'Parfums','tab.gallery':'Galerie','tab.settings':'Réglages',
      'st.pending':'En attente','st.confirmed':'Confirmée','st.baking':'Au four','st.completed':'Terminée','st.cancelled':'Annulée',
      'act.confirmed':'Confirmer','act.baking':'Mettre au four','act.completed':'Terminée ✓','act.confirmCancel':'Annuler la commande {c} ?',
      'ord.eyebrow':'Le carnet de la maison','ord.all':'Toutes','ord.search':'Nom, téléphone ou code…',
      'ord.empty':'Aucune commande pour le moment.','ord.emptyFilter':'Aucune commande ne correspond.',
      'ord.new':'Nouvelle','ord.newToast':'Nouvelle commande {c} — {n}','ord.pieces':'{n} pièces',
      'ord.delivery':'Livraison','ord.pickup':"Retrait à l'atelier",'ord.call':'Appeler','ord.customer':'Cliente / client',
      'ord.when':'Date & remise','ord.box':'Coffret · {n} pièces','ord.notes':'Notes & allergies','ord.photo':"Photo d'inspiration",
      'ord.photoErr':'Photo indisponible.','ord.subtotal':'Sous-total','ord.discount':'Remise','ord.fee':'Livraison','ord.free':'Offerte',
      'ord.total':'Total','ord.created':'Reçue le {d}','ord.history':'Historique','ord.status':'Statut',
      'ord.statusSaved':'Statut mis à jour : {s}','ord.today':"Aujourd'hui",'ord.tomorrow':'Demain','ord.inDays':'dans {n} j',
      'ord.daysAgo':'il y a {n} j','ord.late':'En retard','ord.holidayOn':'Mode vacances activé : les commandes en ligne sont suspendues.',
      'ord.notFound':'Commande introuvable.',
      'cal.eyebrow':'Ce qui sort du four','cal.days':'{n} jours','cal.includePending':'Inclure les commandes en attente',
      'cal.total':'À préparer sur la période','cal.late':'En retard — date passée, pas encore terminées',
      'cal.empty':'Rien à préparer sur cette période.','cal.dayTotal':'{n} pièces · {o} commande(s)','cal.today':"Aujourd'hui",
      'fl.eyebrow':'La collection','fl.add':'Nouveau parfum','fl.available':'Disponible','fl.soldout':'Épuisé',
      'fl.perPiece':'{p} DZD / pièce','fl.basePrice':'prix de base','fl.price':'Prix par pièce (DZD)',
      'fl.priceHint':'Vide = prix de base ({p} DZD).','fl.roman':'Numéro (Ⅰ, Ⅱ…)','fl.name':'Nom','fl.desc':'Description',
      'fl.photo':'Photo','fl.photoPick':'Choisir une photo','fl.photoHint':'Elle est allégée automatiquement avant l’envoi.',
      'fl.saved':'Parfum enregistré','fl.deleted':'Parfum supprimé','fl.nameRequired':'Le nom en français est obligatoire.',
      'fl.priceBad':'Le prix doit être un nombre entier positif.','fl.empty':'Aucun parfum pour le moment.',
      'fl.editTitle':'Modifier le parfum','fl.newTitle':'Nouveau parfum','fl.uploading':'Envoi de la photo…','fl.saving':'Enregistrement…',
      'fl.nowAvailable':'{n} est de nouveau disponible','fl.nowSoldout':'{n} est marqué épuisé',
      'ga.eyebrow':'Ce que voient les visiteurs','ga.atelier':'Atelier','ga.testimonial':'Avis clients','ga.add':'Ajouter une photo',
      'ga.title':'Titre','ga.titleTesti':'Compte Instagram (ex. @compte)','ga.caption':'Légende','ga.captionTesti':'Texte du commentaire',
      'ga.category':'Rubrique','ga.photoRequired':'Choisissez une photo.','ga.saved':'Publication enregistrée','ga.deleted':'Publication supprimée',
      'ga.empty':'Aucune photo dans cette rubrique.','ga.editTitle':'Modifier la publication','ga.newTitle':'Nouvelle publication',
      'ga.testHint':'Pour un avis : une capture recadrée du commentaire.',
      'se.eyebrow':'La maison en chiffres et en règles','se.stats':'Statistiques','se.orders':'Commandes','se.sales':'Ventes (hors annulées)',
      'se.month':'Ventes ce mois-ci','se.avg':'Panier moyen','se.pendingCount':'À confirmer','se.top':'Parfums les plus demandés',
      'se.topEmpty':'Pas encore de données.','se.piecesShort':'{n} pcs',
      'se.pricing':'Prix','se.pricingHint':'Le prix propre à chaque parfum se règle dans l’onglet Parfums.',
      'se.base':'Prix de base par pièce (DZD)','se.baseHint':'Pour les parfums sans prix propre.',
      'se.tiers':'Remises selon la taille du coffret','se.tierFrom':'À partir de (pièces)','se.tierOff':'Remise par pièce (DZD)',
      'se.addTier':'Ajouter un palier','se.remove':'Retirer',
      'se.ordering':'Règles de commande','se.orderingHint':'Ce que le site propose dans le composeur de coffret.',
      'se.sizes':'Tailles de coffret proposées','se.sizesHint':'Séparées par des virgules, ex. 20, 40, 60, 80, 120',
      'se.boxStep':'Pas du coffret (pièces)','se.min':'Minimum (pièces)','se.max':'Maximum (pièces)',
      'se.flavorStep':'Pas par parfum (pièces)','se.lead':'Délai minimum (jours)','se.wa':'Numéro WhatsApp (213…)',
      'se.delivery':'Livraison','se.deliveryHint':'Frais ajoutés au total selon la wilaya.',
      'se.pickupFee':"Retrait à l'atelier (DZD)",'se.defaultFee':'Autres wilayas (DZD)',
      'se.defaultFeeHint':'Vide = pas de livraison hors des wilayas listées ci-dessous.',
      'se.wilayaFees':'Tarifs par wilaya','se.wilayaFeeHint':'Tarif vide = pas de livraison vers cette wilaya.',
      'se.addWilaya':'Ajouter une wilaya','se.wilaya':'Wilaya','se.fee':'Frais (DZD)',
      'se.announcement':"Bandeau d'annonce",'se.annHint':'Affiché tout en haut du site, dans les 3 langues.',
      'se.annEnabled':'Afficher le bandeau','se.text':'Texte',
      'se.holiday':'Mode vacances','se.holHint':'Le bandeau affiche ce message et le bouton de commande du site est désactivé.',
      'se.holEnabled':'Suspendre les commandes en ligne','se.message':'Message',
      'se.promos':'Codes promo','se.promosHint':'Un code désactivé reste dans l’historique des commandes.',
      'se.code':'Code','se.type':'Type','se.percentage':'Pourcentage (%)','se.fixed':'Montant fixe (DZD)','se.value':'Valeur',
      'se.expires':'Expire le (facultatif)','se.create':'Créer le code','se.active':'Actif','se.noExpiry':'sans date limite',
      'se.until':"jusqu'au {d}",'se.expired':'expiré','se.codeBad':'Code : 3 à 32 caractères (lettres, chiffres, - ou _).',
      'se.valueBad':'Valeur invalide (1 à 100 pour un pourcentage).','se.codeExists':'Ce code existe déjà.','se.noPromos':'Aucun code pour le moment.',
      'se.numBad':'Vérifiez les nombres : entiers positifs uniquement.','se.sizesBad':'Indiquez au moins une taille de coffret valide.',
      'se.promoCreated':'Code {c} créé','se.promoOn':'Code {c} activé','se.promoOff':'Code {c} désactivé',
      'lang.fr':'Français','lang.en':'English','lang.ar':'العربية',
      'se.baseBad':'Le prix de base doit être d’au moins 1 DZD.','se.rulesBad':'Règles incohérentes : le minimum doit être un multiple du pas du coffret.','se.sizesRule':'Chaque taille doit être entre le minimum et le maximum, et multiple du pas du coffret et du pas par parfum.','se.dupTier':'Deux paliers ont le même nombre de pièces.','se.dupWilaya':'Une wilaya apparaît deux fois.','fl.formatBad':'Format de photo non pris en charge — utilisez JPG, PNG ou WebP.','alert.hint':'Pour entendre et voir les nouvelles commandes, touchez « Activer les alertes ».','alert.btn':'Activer les alertes','off.title':'Pas de connexion','off.body':'L\'atelier a besoin d\'internet pour charger les commandes. Vérifiez la connexion puis réessayez.','off.retry':'Réessayer'
    },
    en: {
      'app.title':'Atelier','app.logout':'Sign out','app.refresh':'Refresh','app.save':'Save','app.saved':'Saved',
      'app.cancel':'Cancel','app.delete':'Delete','app.edit':'Edit','app.add':'Add','app.close':'Close',
      'app.error':'Something went wrong: {m}','app.offline':'Offline — the data shown may be out of date.',
      'app.confirmDelete':'Delete “{n}” permanently?','app.moveUp':'Move up','app.moveDown':'Move down',
      'app.live':'Live','app.polling':'Auto-refresh','app.offlineShort':'Offline',
      'app.soundOn':'New-order sound: on','app.soundOff':'New-order sound: off',
      'app.sessionEnded':'Session expired — please sign in again.','app.notSaved':'Change not saved — refresh and try again.',
      'cfg.title':'Supabase is not connected yet',
      'cfg.body':'The atelier needs the database to work. The public site keeps working normally.',
      'cfg.s1':'Run supabase_schema.sql in Supabase → SQL Editor.',
      'cfg.s2':'Create the owner account (Authentication → Users), then grant it access with the private.admin_users line at the top of the SQL file.',
      'cfg.s3':'In Vercel → Settings → Environment Variables, add SUPABASE_URL and SUPABASE_ANON_KEY, then redeploy.',
      'login.title':'Dori Yums atelier','login.sub':'Owner area.','login.email':'Email','login.password':'Password',
      'login.submit':'Sign in','login.busy':'Signing in…','login.bad':'Wrong email or password.',
      'login.network':'Cannot connect — check the internet and try again.',
      'denied.title':'Access denied','denied.body':'This account is not allowed to manage the atelier.',
      'mfa.title':'Verification code','mfa.sub':'Enter the 6-digit code shown by your authenticator app.',
      'mfa.device':'Device','mfa.code':'Code','mfa.submit':'Verify','mfa.busy':'Checking…',
      'mfa.six':'The code has 6 digits.','mfa.bad':'Wrong code — check that the phone’s clock is right, then try again.',
      'mfa.tooMany':'Too many attempts — wait a minute, then try again.','mfa.expired':'The code expired — enter the new one.',
      'mfa.lost':'Lost your phone? Enter the code from your backup device. Without one, recovery is done from your Supabase account.',
      'sec.title':'Account security','sec.on':'Verification code on',
      'sec.offHint':'Signing in only asks for the password today. Add a 6-digit code from an authenticator app: someone who only knows the password will no longer get in.',
      'sec.onHint':'A new device asks for the password, then the code. Your usual devices stay signed in.',
      'sec.setup':'Turn on the verification code','sec.devices':'Authenticator apps','sec.added':'added {d}',
      'sec.addBackup':'Add a backup device','sec.backupHint':'Recommended: a second device (or a password manager) keeps you in if the phone is lost.',
      'sec.remove':'Remove','sec.confirmRemove':'Remove “{n}”? Its codes will no longer sign you in.','sec.removed':'Device removed.',
      'sec.sessions':'Signed-in devices','sec.logoutAll':'Sign out of all devices',
      'sec.logoutAllHint':'If a phone or a computer is lost: every device will have to sign in again (password, then code).',
      'sec.confirmLogoutAll':'Sign out of every device, including this one?','sec.loggedOutAll':'Every device has been signed out.',
      'sec.enabled':'Verification code on. Other devices signed in without the code were signed out.',
      'sec.nudge':'Protect the account: turn on the verification code.','sec.nudgeBtn':'Turn on',
      'en.title':'Turn on the verification code','en.titleBackup':'Add a backup device','en.busy':'Preparing…',
      'en.s1':'Install an authenticator app on the phone (Google Authenticator, Microsoft Authenticator…).',
      'en.s2':'Add the account: scan this QR code with the app or, on this phone, tap “Open in the app”.',
      'en.open':'Open in the app','en.key':'Or type this key by hand:','en.copy':'Copy','en.copied':'Key copied.',
      'en.keySecret':'Keep this key to yourself: it can create the codes.',
      'en.s3':'Enter the 6-digit code the app shows.','en.confirm':'Confirm and turn on',
      'tab.orders':'Orders','tab.calendar':'Baking','tab.flavors':'Flavors','tab.gallery':'Gallery','tab.settings':'Settings',
      'st.pending':'Pending','st.confirmed':'Confirmed','st.baking':'In the oven','st.completed':'Completed','st.cancelled':'Cancelled',
      'act.confirmed':'Confirm','act.baking':'Start baking','act.completed':'Done ✓','act.confirmCancel':'Cancel order {c}?',
      'ord.eyebrow':'The house order book','ord.all':'All','ord.search':'Name, phone or code…',
      'ord.empty':'No orders yet.','ord.emptyFilter':'No matching orders.',
      'ord.new':'New','ord.newToast':'New order {c} — {n}','ord.pieces':'{n} pieces',
      'ord.delivery':'Delivery','ord.pickup':'Pickup at the atelier','ord.call':'Call','ord.customer':'Customer',
      'ord.when':'Date & handover','ord.box':'Box · {n} pieces','ord.notes':'Notes & allergies','ord.photo':'Inspiration photo',
      'ord.photoErr':'Photo unavailable.','ord.subtotal':'Subtotal','ord.discount':'Discount','ord.fee':'Delivery','ord.free':'Free',
      'ord.total':'Total','ord.created':'Received {d}','ord.history':'History','ord.status':'Status',
      'ord.statusSaved':'Status updated: {s}','ord.today':'Today','ord.tomorrow':'Tomorrow','ord.inDays':'in {n} d',
      'ord.daysAgo':'{n} d ago','ord.late':'Overdue','ord.holidayOn':'Holiday mode is on: online orders are paused.',
      'ord.notFound':'Order not found.',
      'cal.eyebrow':'What comes out of the oven','cal.days':'{n} days','cal.includePending':'Include pending orders',
      'cal.total':'To bake in this period','cal.late':'Overdue — date passed, not completed yet',
      'cal.empty':'Nothing to bake in this period.','cal.dayTotal':'{n} pieces · {o} order(s)','cal.today':'Today',
      'fl.eyebrow':'The collection','fl.add':'New flavor','fl.available':'Available','fl.soldout':'Sold out',
      'fl.perPiece':'{p} DZD / piece','fl.basePrice':'base price','fl.price':'Price per piece (DZD)',
      'fl.priceHint':'Empty = base price ({p} DZD).','fl.roman':'Numeral (Ⅰ, Ⅱ…)','fl.name':'Name','fl.desc':'Description',
      'fl.photo':'Photo','fl.photoPick':'Choose a photo','fl.photoHint':'It is resized automatically before upload.',
      'fl.saved':'Flavor saved','fl.deleted':'Flavor deleted','fl.nameRequired':'The French name is required.',
      'fl.priceBad':'The price must be a whole positive number.','fl.empty':'No flavors yet.',
      'fl.editTitle':'Edit flavor','fl.newTitle':'New flavor','fl.uploading':'Uploading photo…','fl.saving':'Saving…',
      'fl.nowAvailable':'{n} is available again','fl.nowSoldout':'{n} is marked sold out',
      'ga.eyebrow':'What visitors see','ga.atelier':'Atelier','ga.testimonial':'Testimonials','ga.add':'Add a photo',
      'ga.title':'Title','ga.titleTesti':'Instagram account (e.g. @account)','ga.caption':'Caption','ga.captionTesti':'Comment text',
      'ga.category':'Section','ga.photoRequired':'Choose a photo.','ga.saved':'Post saved','ga.deleted':'Post deleted',
      'ga.empty':'No photos in this section.','ga.editTitle':'Edit post','ga.newTitle':'New post',
      'ga.testHint':'For a testimonial: a cropped capture of the comment.',
      'se.eyebrow':'The house in numbers and rules','se.stats':'Statistics','se.orders':'Orders','se.sales':'Sales (excl. cancelled)',
      'se.month':'Sales this month','se.avg':'Average order','se.pendingCount':'To confirm','se.top':'Most ordered flavors',
      'se.topEmpty':'No data yet.','se.piecesShort':'{n} pcs',
      'se.pricing':'Prices','se.pricingHint':'Each flavor’s own price is set in the Flavors tab.',
      'se.base':'Base price per piece (DZD)','se.baseHint':'For flavors without their own price.',
      'se.tiers':'Discounts by box size','se.tierFrom':'From (pieces)','se.tierOff':'Discount per piece (DZD)',
      'se.addTier':'Add a tier','se.remove':'Remove',
      'se.ordering':'Ordering rules','se.orderingHint':'What the site offers in the box builder.',
      'se.sizes':'Box sizes offered','se.sizesHint':'Comma-separated, e.g. 20, 40, 60, 80, 120',
      'se.boxStep':'Box step (pieces)','se.min':'Minimum (pieces)','se.max':'Maximum (pieces)',
      'se.flavorStep':'Step per flavor (pieces)','se.lead':'Minimum notice (days)','se.wa':'WhatsApp number (213…)',
      'se.delivery':'Delivery','se.deliveryHint':'Fees added to the total depending on the wilaya.',
      'se.pickupFee':'Pickup at the atelier (DZD)','se.defaultFee':'Other wilayas (DZD)',
      'se.defaultFeeHint':'Empty = no delivery outside the wilayas listed below.',
      'se.wilayaFees':'Fees per wilaya','se.wilayaFeeHint':'Empty fee = no delivery to that wilaya.',
      'se.addWilaya':'Add a wilaya','se.wilaya':'Wilaya','se.fee':'Fee (DZD)',
      'se.announcement':'Announcement bar','se.annHint':'Shown at the very top of the site, in the 3 languages.',
      'se.annEnabled':'Show the bar','se.text':'Text',
      'se.holiday':'Holiday mode','se.holHint':'The bar shows this message and the site’s order button is disabled.',
      'se.holEnabled':'Pause online orders','se.message':'Message',
      'se.promos':'Promo codes','se.promosHint':'A deactivated code stays in the order history.',
      'se.code':'Code','se.type':'Type','se.percentage':'Percentage (%)','se.fixed':'Fixed amount (DZD)','se.value':'Value',
      'se.expires':'Expires on (optional)','se.create':'Create code','se.active':'Active','se.noExpiry':'no end date',
      'se.until':'until {d}','se.expired':'expired','se.codeBad':'Code: 3 to 32 characters (letters, digits, - or _).',
      'se.valueBad':'Invalid value (1 to 100 for a percentage).','se.codeExists':'This code already exists.','se.noPromos':'No codes yet.',
      'se.numBad':'Check the numbers: whole positive numbers only.','se.sizesBad':'Enter at least one valid box size.',
      'se.promoCreated':'Code {c} created','se.promoOn':'Code {c} activated','se.promoOff':'Code {c} deactivated',
      'lang.fr':'Français','lang.en':'English','lang.ar':'العربية',
      'se.baseBad':'The base price must be at least 1 DZD.','se.rulesBad':'Inconsistent rules: the minimum must be a multiple of the box step.','se.sizesRule':'Each size must be between the minimum and the maximum, and a multiple of the box step and of the flavor step.','se.dupTier':'Two tiers have the same number of pieces.','se.dupWilaya':'A wilaya appears twice.','fl.formatBad':'Unsupported photo format — use JPG, PNG or WebP.','alert.hint':'To hear and see new orders, tap “Enable alerts”.','alert.btn':'Enable alerts','off.title':'No connection','off.body':'The atelier needs the internet to load orders. Check the connection and try again.','off.retry':'Try again'
    },
    ar: {
      'app.title':'الورشة','app.logout':'تسجيل الخروج','app.refresh':'تحديث','app.save':'حفظ','app.saved':'تم الحفظ',
      'app.cancel':'إلغاء','app.delete':'حذف','app.edit':'تعديل','app.add':'إضافة','app.close':'إغلاق',
      'app.error':'حدث خطأ: {m}','app.offline':'غير متصل — قد تكون البيانات المعروضة قديمة.',
      'app.confirmDelete':'حذف «{n}» نهائيًا؟','app.moveUp':'تحريك للأعلى','app.moveDown':'تحريك للأسفل',
      'app.live':'مباشر','app.polling':'تحديث تلقائي','app.offlineShort':'غير متصل',
      'app.soundOn':'صوت الطلبات الجديدة: مفعّل','app.soundOff':'صوت الطلبات الجديدة: متوقف',
      'app.sessionEnded':'انتهت الجلسة — سجّلوا الدخول من جديد.','app.notSaved':'لم يُحفَظ التعديل — حدّثوا الصفحة ثم أعيدوا المحاولة.',
      'cfg.title':'لم يتم ربط Supabase بعد',
      'cfg.body':'تحتاج الورشة إلى قاعدة البيانات لتعمل. أما الموقع العام فيواصل العمل بشكل عادي.',
      'cfg.s1':'نفّذوا الملف supabase_schema.sql في Supabase ← SQL Editor.',
      'cfg.s2':'أنشئوا حساب صاحبة الورشة (Authentication ← Users) ثم امنحوه الصلاحية بسطر private.admin_users في أعلى ملف SQL.',
      'cfg.s3':'في Vercel ← Settings ← Environment Variables أضيفوا SUPABASE_URL و SUPABASE_ANON_KEY ثم أعيدوا النشر.',
      'login.title':'ورشة Dori Yums','login.sub':'مساحة خاصة بصاحبة الورشة.','login.email':'البريد الإلكتروني','login.password':'كلمة المرور',
      'login.submit':'تسجيل الدخول','login.busy':'جارٍ الدخول…','login.bad':'البريد أو كلمة المرور غير صحيحة.',
      'login.network':'تعذّر الاتصال — تحققوا من الإنترنت ثم أعيدوا المحاولة.',
      'denied.title':'الوصول مرفوض','denied.body':'هذا الحساب غير مخوّل بإدارة الورشة.',
      'mfa.title':'رمز التحقق','mfa.sub':'أدخلوا الرمز المكوّن من 6 أرقام الذي يعرضه تطبيق المصادقة.',
      'mfa.device':'الجهاز','mfa.code':'الرمز','mfa.submit':'تحقّق','mfa.busy':'جارٍ التحقق…',
      'mfa.six':'الرمز مكوّن من 6 أرقام.','mfa.bad':'رمز غير صحيح — تأكدوا أن ساعة الهاتف مضبوطة ثم أعيدوا المحاولة.',
      'mfa.tooMany':'محاولات كثيرة — انتظروا دقيقة ثم أعيدوا المحاولة.','mfa.expired':'انتهت صلاحية الرمز — أدخلوا الرمز الجديد.',
      'mfa.lost':'ضاع الهاتف؟ أدخلوا رمز جهازكم الاحتياطي. وإن لم يوجد، يتم الاسترجاع من حسابكم في Supabase.',
      'sec.title':'أمان الحساب','sec.on':'رمز التحقق مفعّل',
      'sec.offHint':'حاليًا يطلب تسجيل الدخول كلمة المرور فقط. أضيفوا رمزًا من 6 أرقام يعطيه تطبيق المصادقة: من يعرف كلمة المرور وحدها لن يستطيع الدخول.',
      'sec.onHint':'على جهاز جديد يُطلب كلمة المرور ثم الرمز. أجهزتكم المعتادة تبقى متصلة.',
      'sec.setup':'تفعيل رمز التحقق','sec.devices':'تطبيقات المصادقة','sec.added':'أُضيف في {d}',
      'sec.addBackup':'إضافة جهاز احتياطي','sec.backupHint':'يُنصح به: جهاز ثانٍ (أو مدير كلمات المرور) يحفظ الوصول إذا ضاع الهاتف.',
      'sec.remove':'إزالة','sec.confirmRemove':'إزالة «{n}»؟ لن تعمل رموزه لتسجيل الدخول بعد الآن.','sec.removed':'أُزيل الجهاز.',
      'sec.sessions':'الأجهزة المتصلة','sec.logoutAll':'تسجيل الخروج من كل الأجهزة',
      'sec.logoutAllHint':'إذا ضاع هاتف أو حاسوب: سيحتاج كل جهاز إلى تسجيل الدخول من جديد (كلمة المرور ثم الرمز).',
      'sec.confirmLogoutAll':'تسجيل الخروج من كل الأجهزة بما فيها هذا الجهاز؟','sec.loggedOutAll':'تم تسجيل الخروج من كل الأجهزة.',
      'sec.enabled':'تم تفعيل رمز التحقق. سُجّل خروج الأجهزة الأخرى التي دخلت بدون رمز.',
      'sec.nudge':'احموا الحساب: فعّلوا رمز التحقق.','sec.nudgeBtn':'تفعيل',
      'en.title':'تفعيل رمز التحقق','en.titleBackup':'إضافة جهاز احتياطي','en.busy':'جارٍ التحضير…',
      'en.s1':'ثبّتوا تطبيق مصادقة على الهاتف (Google Authenticator أو Microsoft Authenticator…).',
      'en.s2':'أضيفوا الحساب: امسحوا رمز QR هذا بالتطبيق، أو على هذا الهاتف اضغطوا «فتح في التطبيق».',
      'en.open':'فتح في التطبيق','en.key':'أو أدخلوا هذا المفتاح يدويًا:','en.copy':'نسخ','en.copied':'نُسخ المفتاح.',
      'en.keySecret':'احتفظوا بهذا المفتاح لأنفسكم: فهو يُنشئ الرموز.',
      'en.s3':'أدخلوا الرمز المكوّن من 6 أرقام الذي يعرضه التطبيق.','en.confirm':'تأكيد وتفعيل',
      'tab.orders':'الطلبات','tab.calendar':'التحضير','tab.flavors':'النكهات','tab.gallery':'المعرض','tab.settings':'الإعدادات',
      'st.pending':'قيد المراجعة','st.confirmed':'مؤكد','st.baking':'في الفرن','st.completed':'مكتمل','st.cancelled':'ملغى',
      'act.confirmed':'تأكيد','act.baking':'إلى الفرن','act.completed':'تم ✓','act.confirmCancel':'إلغاء الطلب {c}؟',
      'ord.eyebrow':'دفتر طلبات الورشة','ord.all':'الكل','ord.search':'الاسم، الهاتف أو الكود…',
      'ord.empty':'لا توجد طلبات حاليًا.','ord.emptyFilter':'لا توجد طلبات مطابقة.',
      'ord.new':'جديد','ord.newToast':'طلب جديد {c} — {n}','ord.pieces':'{n} قطعة',
      'ord.delivery':'توصيل','ord.pickup':'استلام من الورشة','ord.call':'اتصال','ord.customer':'الزبون',
      'ord.when':'التاريخ والتسليم','ord.box':'العلبة · {n} قطعة','ord.notes':'الملاحظات والحساسية','ord.photo':'صورة الإلهام',
      'ord.photoErr':'الصورة غير متاحة.','ord.subtotal':'المجموع الفرعي','ord.discount':'الخصم','ord.fee':'التوصيل','ord.free':'مجاني',
      'ord.total':'المجموع','ord.created':'وصل في {d}','ord.history':'السجل','ord.status':'الحالة',
      'ord.statusSaved':'تم تحديث الحالة: {s}','ord.today':'اليوم','ord.tomorrow':'غدًا','ord.inDays':'بعد {n} يوم',
      'ord.daysAgo':'منذ {n} يوم','ord.late':'متأخر','ord.holidayOn':'وضع الإجازة مفعّل: الطلبات عبر الموقع متوقفة.',
      'ord.notFound':'الطلب غير موجود.',
      'cal.eyebrow':'ما سيخرج من الفرن','cal.days':'{n} يوم','cal.includePending':'تضمين الطلبات قيد المراجعة',
      'cal.total':'المطلوب تحضيره في هذه الفترة','cal.late':'متأخرة — فات موعدها ولم تكتمل بعد',
      'cal.empty':'لا شيء للتحضير في هذه الفترة.','cal.dayTotal':'{n} قطعة · {o} طلب','cal.today':'اليوم',
      'fl.eyebrow':'التشكيلة','fl.add':'نكهة جديدة','fl.available':'متوفرة','fl.soldout':'نفدت',
      'fl.perPiece':'{p} DZD للقطعة','fl.basePrice':'السعر الأساسي','fl.price':'سعر القطعة (DZD)',
      'fl.priceHint':'فارغ = السعر الأساسي ({p} DZD).','fl.roman':'الرقم (Ⅰ، Ⅱ…)','fl.name':'الاسم','fl.desc':'الوصف',
      'fl.photo':'الصورة','fl.photoPick':'اختر صورة','fl.photoHint':'تُصغَّر تلقائيًا قبل الرفع.',
      'fl.saved':'تم حفظ النكهة','fl.deleted':'تم حذف النكهة','fl.nameRequired':'الاسم بالفرنسية إلزامي.',
      'fl.priceBad':'يجب أن يكون السعر عددًا صحيحًا موجبًا.','fl.empty':'لا توجد نكهات حاليًا.',
      'fl.editTitle':'تعديل النكهة','fl.newTitle':'نكهة جديدة','fl.uploading':'جارٍ رفع الصورة…','fl.saving':'جارٍ الحفظ…',
      'fl.nowAvailable':'{n} متوفرة من جديد','fl.nowSoldout':'تم تعليم {n} كنافدة',
      'ga.eyebrow':'ما يراه الزوار','ga.atelier':'الورشة','ga.testimonial':'آراء الزبائن','ga.add':'إضافة صورة',
      'ga.title':'العنوان','ga.titleTesti':'حساب إنستغرام (مثال: ‎@account)','ga.caption':'التعليق','ga.captionTesti':'نص التعليق',
      'ga.category':'القسم','ga.photoRequired':'اختاروا صورة.','ga.saved':'تم حفظ المنشور','ga.deleted':'تم حذف المنشور',
      'ga.empty':'لا توجد صور في هذا القسم.','ga.editTitle':'تعديل المنشور','ga.newTitle':'منشور جديد',
      'ga.testHint':'لرأي زبون: لقطة شاشة مقصوصة للتعليق.',
      'se.eyebrow':'الورشة بالأرقام والقواعد','se.stats':'الإحصائيات','se.orders':'الطلبات','se.sales':'المبيعات (دون الملغاة)',
      'se.month':'مبيعات هذا الشهر','se.avg':'متوسط الطلب','se.pendingCount':'بانتظار التأكيد','se.top':'النكهات الأكثر طلبًا',
      'se.topEmpty':'لا توجد بيانات بعد.','se.piecesShort':'{n} قطعة',
      'se.pricing':'الأسعار','se.pricingHint':'سعر كل نكهة يُضبط في تبويب النكهات.',
      'se.base':'السعر الأساسي للقطعة (DZD)','se.baseHint':'للنكهات التي ليس لها سعر خاص.',
      'se.tiers':'الخصم حسب حجم العلبة','se.tierFrom':'ابتداءً من (قطعة)','se.tierOff':'الخصم للقطعة (DZD)',
      'se.addTier':'إضافة شريحة','se.remove':'إزالة',
      'se.ordering':'قواعد الطلب','se.orderingHint':'ما يعرضه الموقع في أداة تشكيل العلبة.',
      'se.sizes':'أحجام العلب المقترحة','se.sizesHint':'مفصولة بفواصل، مثال: 20, 40, 60, 80, 120',
      'se.boxStep':'خطوة العلبة (قطعة)','se.min':'الحد الأدنى (قطعة)','se.max':'الحد الأقصى (قطعة)',
      'se.flavorStep':'الخطوة لكل نكهة (قطعة)','se.lead':'المهلة الدنيا (أيام)','se.wa':'رقم واتساب (213…)',
      'se.delivery':'التوصيل','se.deliveryHint':'رسوم تضاف إلى المجموع حسب الولاية.',
      'se.pickupFee':'الاستلام من الورشة (DZD)','se.defaultFee':'باقي الولايات (DZD)',
      'se.defaultFeeHint':'فارغ = لا توصيل خارج الولايات المذكورة أدناه.',
      'se.wilayaFees':'الأسعار حسب الولاية','se.wilayaFeeHint':'سعر فارغ = لا توصيل إلى هذه الولاية.',
      'se.addWilaya':'إضافة ولاية','se.wilaya':'الولاية','se.fee':'الرسوم (DZD)',
      'se.announcement':'الشريط الإعلاني','se.annHint':'يظهر في أعلى الموقع باللغات الثلاث.',
      'se.annEnabled':'إظهار الشريط','se.text':'النص',
      'se.holiday':'وضع الإجازة','se.holHint':'يعرض الشريط هذه الرسالة ويتعطّل زر الطلب في الموقع.',
      'se.holEnabled':'إيقاف الطلبات عبر الموقع','se.message':'الرسالة',
      'se.promos':'أكواد الخصم','se.promosHint':'الكود الموقوف يبقى في سجل الطلبات.',
      'se.code':'الكود','se.type':'النوع','se.percentage':'نسبة مئوية (%)','se.fixed':'مبلغ ثابت (DZD)','se.value':'القيمة',
      'se.expires':'ينتهي في (اختياري)','se.create':'إنشاء الكود','se.active':'مفعّل','se.noExpiry':'بلا تاريخ انتهاء',
      'se.until':'حتى {d}','se.expired':'منتهي','se.codeBad':'الكود: من 3 إلى 32 حرفًا (حروف، أرقام، - أو _).',
      'se.valueBad':'قيمة غير صالحة (من 1 إلى 100 للنسبة المئوية).','se.codeExists':'هذا الكود موجود مسبقًا.','se.noPromos':'لا توجد أكواد حاليًا.',
      'se.numBad':'تحققوا من الأرقام: أعداد صحيحة موجبة فقط.','se.sizesBad':'أدخلوا حجم علبة صالحًا واحدًا على الأقل.',
      'se.promoCreated':'تم إنشاء الكود {c}','se.promoOn':'تم تفعيل الكود {c}','se.promoOff':'تم إيقاف الكود {c}',
      'lang.fr':'Français','lang.en':'English','lang.ar':'العربية',
      'se.baseBad':'يجب ألا يقل السعر الأساسي عن 1 DZD.','se.rulesBad':'قواعد غير متناسقة: يجب أن يكون الحد الأدنى من مضاعفات خطوة العلبة.','se.sizesRule':'يجب أن يكون كل حجم بين الحد الأدنى والأقصى، ومن مضاعفات خطوة العلبة وخطوة النكهة.','se.dupTier':'شريحتان بعدد القطع نفسه.','se.dupWilaya':'ولاية مكررة مرتين.','fl.formatBad':'صيغة الصورة غير مدعومة — استخدموا JPG أو PNG أو WebP.','alert.hint':'لسماع ورؤية الطلبات الجديدة، اضغطوا «تفعيل التنبيهات».','alert.btn':'تفعيل التنبيهات','off.title':'لا يوجد اتصال','off.body':'تحتاج الورشة إلى الإنترنت لتحميل الطلبات. تحققوا من الاتصال ثم أعيدوا المحاولة.','off.retry':'إعادة المحاولة'
    }
  };

  var LANG = (document.documentElement.lang === 'ar' || document.documentElement.lang === 'en') ? document.documentElement.lang : 'fr';
  function t(k){ var d = I18N[LANG]; return d[k] != null ? d[k] : (I18N.fr[k] != null ? I18N.fr[k] : k); }
  function fill(s, map){ return String(s).replace(/\{(\w+)\}/g, function(m, k){ return map[k] != null ? map[k] : m; }); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function $(id){ return document.getElementById(id); }
  function fmt(n){ return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function money(n){ return fmt(n) + ' DZD'; }
  function safeImg(u){ u = String(u || ''); return /^(https?:\/\/|assets\/|blob:)/.test(u) ? u : ''; }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }

  var STATUSES = ['pending', 'confirmed', 'baking', 'completed', 'cancelled'];
  var NEXT = { pending:'confirmed', confirmed:'baking', baking:'completed' };
  var OPEN = { pending:1, confirmed:1, baking:1 };
  var LANGS = ['fr', 'en', 'ar'];
  var WILAYAS = [
    'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira',
    'Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda',
    'Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla',
    'Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela',
    'Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
    'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa'
  ];
  var ICON = {
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a9.9 9.9 0 0 0-8.6 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3.2-.5s0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z"/></svg>',
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.5"/></svg>'
  };

  /* ─── state ─── */
  var sb = null;
  var S = {
    orders:[], flavors:[], gallery:[], settings:{}, promos:[],
    tab:'orders', filter:'all', search:'', calDays:14, calPending:true, galCat:'atelier',
    known:null, unseen:{}, live:'off', channel:null, poll:null, lastLoad:0,
    drawer:null, sound: store('dy_admin_sound') !== '0', dirtyForms:{}, signed:{}, moveQueue:Promise.resolve(),
    mfa:{ known:false, factors:[] }    /* verified authenticator apps of the signed-in account */
  };

  /* ─── dates (Algiers) & phone ─── */
  function todayISO(){
    try{ return new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Algiers', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); }
    catch(e){ return new Date().toISOString().slice(0, 10); }
  }
  function addDays(iso, n){ var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b){ return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function locale(){ return LANG === 'ar' ? 'ar-DZ-u-nu-latn' : LANG === 'en' ? 'en-GB' : 'fr-FR'; }
  function fmtDay(iso, long){
    if(!iso) return '';
    try{
      return new Intl.DateTimeFormat(locale(), long ? { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }
                                                    : { weekday:'short', day:'numeric', month:'short', timeZone:'UTC' })
        .format(new Date(String(iso).slice(0, 10) + 'T12:00:00Z'));
    }catch(e){ return iso; }
  }
  function fmtDateTime(iso){
    try{ return new Intl.DateTimeFormat(locale(), { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Africa/Algiers' }).format(new Date(iso)); }
    catch(e){ return iso; }
  }
  function algiersMonth(iso){
    try{ return new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Algiers', year:'numeric', month:'2-digit' }).format(new Date(iso)).slice(0, 7); }
    catch(e){ return String(iso).slice(0, 7); }
  }
  function relDay(iso){
    var d = daysBetween(todayISO(), iso);
    if(d === 0) return t('ord.today');
    if(d === 1) return t('ord.tomorrow');
    return d > 0 ? fill(t('ord.inDays'), { n:d }) : fill(t('ord.daysAgo'), { n:-d });
  }
  function prettyPhone(p){
    var d = String(p || '').replace(/\D/g, '').replace(/^213/, '');
    return d.length === 9 ? '+213 ' + d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5, 7) + ' ' + d.slice(7) : String(p || '');
  }
  /* WhatsApp to the customer — French, like every message of the house */
  function waLink(o){
    var msg = 'Bonjour ' + o.customer_name + ', ici Dori Yums. Merci pour votre commande ' + o.tracking_code +
      ' (' + o.box_size + ' macarons, ' + fmt(o.total_price) + ' DZD) pour le ' + frDate(o.event_date) + '.';
    return 'https://wa.me/' + String(o.phone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
  }
  function frDate(iso){
    try{ return new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' }).format(new Date(iso + 'T12:00:00Z')); }
    catch(e){ return iso; }
  }

  /* ─── screens, language, toasts ─── */
  var SCREENS = ['scrBoot', 'scrNoConfig', 'scrOffline', 'scrLogin', 'scrMfa', 'scrDenied', 'scrMain'];
  function show(id){ SCREENS.forEach(function(s){ $(s).hidden = s !== id; }); }

  function applyLang(){
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){ el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('.langs button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === LANG)); });
    setLive(S.live);
    renderSoundBtn();
    if(!$('scrMain').hidden){
      if(S.tab !== 'settings' || !Object.keys(S.dirtyForms).length) renderTab();
      if(S.drawer && S.drawer.type === 'order') openOrder(S.drawer.id);
    }
  }
  function toast(msg, cls){
    var el = document.createElement('div');
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(function(){ el.remove(); }, cls === 'is-new' ? 7000 : 3600);
  }
  function errMsg(e){ return (e && (e.message || e.error_description || e.msg)) || String(e || ''); }
  function friendly(e){
    var m = errMsg(e);
    if(m === 'no_rows') return t('app.notSaved');
    if(m === 'photo_format') return t('fl.formatBad');
    return fill(t('app.error'), { m:m || '—' });
  }
  function toastErr(e){
    var m = errMsg(e);
    /* signed-out / expired token: the API then answers as "anon" (permission denied) or rejects the JWT */
    if(/jwt|not authenticated|permission denied|401/i.test(m)){ sessionEnded(); return; }
    toast(friendly(e), 'is-err');
  }
  function sessionEnded(){
    toast(t('app.sessionEnded'), 'is-err');
    if(sb) sb.auth.signOut({ scope:'local' }).catch(function(){});   /* this device only */
    teardown(); show('scrLogin');
  }
  /* PostgREST result → data, or throw */
  function q(p){ return p.then(function(r){ if(r.error) throw r.error; return r.data; }); }

  /* ─── boot & auth ─── */
  function boot(){
    applyLang();
    if(!window.DY){ show('scrNoConfig'); return; }
    window.DY.getConfig().then(function(cfg){
      /* "not configured" (no keys on Vercel) and "could not ask" (offline, slow) are different answers */
      if(!cfg){ show(window.DY.configFailed && window.DY.configFailed() ? 'scrOffline' : 'scrNoConfig'); return; }
      return window.DY.loadLibrary().then(function(lib){
        sb = lib.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false, storageKey:'dy-atelier-auth' }
        });
        sb.auth.onAuthStateChange(function(ev){
          if(ev === 'SIGNED_OUT' && (!$('scrMain').hidden || !$('scrMfa').hidden)){ teardown(); closeDrawer(); show('scrLogin'); }
        });
        return sb.auth.getSession().then(function(r){
          if(r.data && r.data.session) return enter();
          show('scrLogin');
          $('loginEmail').focus();
        });
      });
    }).catch(function(){ show('scrOffline'); });
  }
  function loginErr(msg){ $('loginErr').textContent = msg; $('loginErr').hidden = !msg; }
  function setLoginBusy(b){
    $('loginBtn').disabled = b;
    $('loginBtn').querySelector('span').textContent = t(b ? 'login.busy' : 'login.submit');
  }
  $('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    unlockAudio();
    if(!sb){ boot(); return; }
    var email = $('loginEmail').value.trim(), pw = $('loginPassword').value;
    if(!email || !pw){ loginErr(t('login.bad')); return; }
    loginErr('');
    setLoginBusy(true);
    sb.auth.signInWithPassword({ email:email, password:pw }).then(function(r){
      setLoginBusy(false);
      if(r.error){
        var bad = r.error.status === 400 || /invalid|credentials/i.test(errMsg(r.error));
        loginErr(t(bad ? 'login.bad' : 'login.network'));
        return;
      }
      $('loginPassword').value = '';
      enter();
    }).catch(function(){ setLoginBusy(false); loginErr(t('login.network')); });
  });

  /* After the password: if the account has an authenticator app, the code comes next. The
     database enforces it (private.is_admin() wants aal2 once a factor is verified); this
     only decides which screen to show. */
  function enter(){
    return assurance().then(function(a){
      if(a.needCode) return askCode(a.factors);
      return checkAdmin();
    }).catch(function(e){
      var gone = /jwt|session|401|403/i.test(errMsg(e)) || (e && (e.status === 401 || e.status === 403));
      if(gone) sb.auth.signOut({ scope:'local' }).catch(function(){});
      show('scrLogin');
      loginErr(t(gone ? 'app.sessionEnded' : 'login.network'));
    });
  }
  function checkAdmin(){
    return sb.rpc('is_admin').then(function(r){
      if(r.error){
        /* anon-level answer = the session is gone; anything else = could not reach the server */
        var gone = /permission denied|jwt|401/i.test(errMsg(r.error));
        if(gone) sb.auth.signOut({ scope:'local' }).catch(function(){});
        show('scrLogin');
        loginErr(t(gone ? 'app.sessionEnded' : 'login.network'));
        return;
      }
      if(r.data !== true){
        /* an app added — or the app this session used removed — on another device makes this
           session too weak: refresh the token so its level is current, then ask for a code */
        return sb.auth.refreshSession().catch(function(){}).then(function(){ return assurance(); })
          .then(function(a){ if(a.needCode) return askCode(a.factors); show('scrDenied'); });
      }
      show('scrMain');
      switchTab(S.tab);
      loadAll(true);
      startLive();
      registerSW();
      refreshMfa();
    }).catch(function(){ show('scrLogin'); loginErr(t('login.network')); });
  }
  function teardown(){
    stopLive();
    closeDrawer();
    S.orders = []; S.flavors = []; S.gallery = []; S.promos = []; S.settings = {};
    S.known = null; S.unseen = {}; S.dirtyForms = {}; S.signed = {};
    S.mfa = { known:false, factors:[] };
    updateBadges();
  }
  function logout(){                      /* this device only — the others stay signed in */
    var done = function(){ teardown(); show('scrLogin'); };
    if(sb) sb.auth.signOut({ scope:'local' }).then(done, done); else done();
  }
  function logoutAll(){
    if(!window.confirm(t('sec.confirmLogoutAll'))) return;
    var done = function(){ teardown(); show('scrLogin'); loginErr(''); toast(t('sec.loggedOutAll')); };
    sb.auth.signOut({ scope:'global' }).then(function(r){
      if(r && r.error) throw r.error;
      done();
    }).catch(toastErr);
  }

  /* ─── two-step sign-in (TOTP authenticator apps) ─── */
  function verifiedApps(user){
    return ((user && user.factors) || []).filter(function(f){ return f.status === 'verified' && f.factor_type === 'totp'; });
  }
  /* the session's level comes from its token; the apps come fresh from the server
     (the copy kept with the session can predate an app added on another device) */
  function assurance(){
    return Promise.all([sb.auth.mfa.getAuthenticatorAssuranceLevel(), sb.auth.getUser()]).then(function(rs){
      if(rs[0].error) throw rs[0].error;
      if(rs[1].error) throw rs[1].error;
      var apps = verifiedApps(rs[1].data && rs[1].data.user), level = rs[0].data && rs[0].data.currentLevel;
      return { level:level, factors:apps, needCode:apps.length > 0 && level !== 'aal2' };
    });
  }
  function refreshMfa(){
    return assurance().then(function(a){
      S.mfa = { known:true, factors:a.factors };
      renderSecNudge(); renderSecurity();
    }).catch(function(){});
  }
  function mfaErrKey(e){
    var code = e && (e.code || e.error_code), m = errMsg(e);
    if((e && e.status === 429) || /too many|rate limit/i.test(m)) return 'mfa.tooMany';
    if(code === 'mfa_challenge_expired' || /expired/i.test(m)) return 'mfa.expired';
    if(code === 'mfa_verification_failed' || /invalid (totp )?code/i.test(m)) return 'mfa.bad';
    return 'login.network';
  }
  function digits(el){ var v = el.value.replace(/\D/g, '').slice(0, 6); if(v !== el.value) el.value = v; return v; }

  function askCode(apps){
    teardown();
    var sel = $('mfaFactor');
    sel.innerHTML = apps.map(function(f){ return '<option value="' + esc(f.id) + '">' + esc(f.friendly_name || 'TOTP') + '</option>'; }).join('');
    $('mfaFactorField').hidden = apps.length < 2;
    $('mfaCode').value = '';
    mfaErr('');
    show('scrMfa');
    $('mfaCode').focus();
  }
  function mfaErr(msg){ $('mfaErr').textContent = msg; $('mfaErr').hidden = !msg; }
  var codeBusy = false;
  function submitCode(){
    var code = digits($('mfaCode'));
    if(code.length !== 6){ mfaErr(t('mfa.six')); return; }
    if(codeBusy) return;
    codeBusy = true;
    $('mfaBtn').disabled = true;
    $('mfaBtn').querySelector('span').textContent = t('mfa.busy');
    var settle = function(){ codeBusy = false; $('mfaBtn').disabled = false; $('mfaBtn').querySelector('span').textContent = t('mfa.submit'); };
    sb.auth.mfa.challengeAndVerify({ factorId:$('mfaFactor').value, code:code }).then(function(r){
      settle();
      if(r.error){ mfaErr(t(mfaErrKey(r.error))); $('mfaCode').select(); return; }
      $('mfaCode').value = '';
      mfaErr('');
      checkAdmin();
    }).catch(function(){ settle(); mfaErr(t('login.network')); });
  }
  $('mfaForm').addEventListener('submit', function(e){ e.preventDefault(); submitCode(); });
  $('mfaCode').addEventListener('input', function(){ if(digits(this).length === 6) submitCode(); });

  /* settings card + a reminder on the orders page while no app is set up */
  function renderSecNudge(){
    var box = $('secNudge');
    if(!box) return;
    box.innerHTML = S.mfa.known && !S.mfa.factors.length ?
      '<p class="notice notice-row"><span>' + esc(t('sec.nudge')) + '</span>' +
      '<button class="btn btn-primary btn-sm" type="button" data-action="mfa-setup">' + esc(t('sec.nudgeBtn')) + '</button></p>' : '';
  }
  function renderSecurity(){
    var box = $('secBox');
    if(!box) return;
    if(!S.mfa.known){ box.innerHTML = ''; return; }
    var apps = S.mfa.factors, html;
    if(apps.length){
      html = '<p class="sec-state">' + ICON.shield + '<span>' + esc(t('sec.on')) + '</span></p><p class="hint">' + esc(t('sec.onHint')) + '</p>' +
        '<p class="subhead">' + esc(t('sec.devices')) + '</p>' +
        apps.map(function(f){
          return '<div class="dev-row"><span><b>' + esc(f.friendly_name || 'TOTP') + '</b><span class="hint">' + esc(fill(t('sec.added'), { d:fmtDay(f.created_at) })) + '</span></span>' +
            (apps.length > 1 ? '<button class="btn btn-danger btn-sm" type="button" data-action="mfa-remove" data-id="' + esc(f.id) + '">' + esc(t('sec.remove')) + '</button>' : '') + '</div>';
        }).join('') +
        (apps.length < 2 ? '<p class="hint" style="margin-top:8px">' + esc(t('sec.backupHint')) + '</p>' : '') +
        '<div class="btnrow" style="margin-top:12px"><button class="btn btn-ghost btn-sm" type="button" data-action="mfa-setup">' + ICON.plus + '<span>' + esc(t('sec.addBackup')) + '</span></button></div>';
    } else {
      html = '<p class="hint">' + esc(t('sec.offHint')) + '</p>' +
        '<div class="btnrow" style="margin-top:12px"><button class="btn btn-primary" type="button" data-action="mfa-setup">' + ICON.shield + '<span>' + esc(t('sec.setup')) + '</span></button></div>';
    }
    box.innerHTML = html +
      '<p class="subhead">' + esc(t('sec.sessions')) + '</p><p class="hint">' + esc(t('sec.logoutAllHint')) + '</p>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn btn-danger btn-sm" type="button" data-action="logout-all">' + esc(t('sec.logoutAll')) + '</button></div>';
  }

  /* setting up an app: enroll → show the QR / key → confirm with a first code (that also
     turns this session into aal2). An unconfirmed app is removed if the panel closes. */
  function startEnroll(){
    var backup = S.mfa.factors.length > 0;
    openDrawer('<h3 id="drawerTitle">' + esc(t(backup ? 'en.titleBackup' : 'en.title')) + '</h3><p class="dsub">' + esc(t('en.busy')) + '</p>');
    var mine = S.drawer = { type:'mfa', pending:null };
    sb.auth.mfa.listFactors().then(function(r){
      if(r.error) throw r.error;
      var unfinished = ((r.data && r.data.all) || []).filter(function(f){ return f.status !== 'verified'; });
      return Promise.all(unfinished.map(function(f){ return sb.auth.mfa.unenroll({ factorId:f.id }); }));
    }).then(function(){
      return sb.auth.mfa.enroll({ factorType:'totp', friendlyName:appName(), issuer:'Dori Yums' });
    }).then(function(r){
      if(r.error) throw r.error;
      if(S.drawer !== mine){ dropApp(r.data.id); return; }      /* closed while preparing */
      mine.pending = r.data.id;
      renderEnroll(r.data, backup);
    }).catch(function(e){ if(S.drawer === mine) closeDrawer(); toastErr(e); });
  }
  /* supabase-js hands the QR as "data:image/svg+xml;utf-8,<raw svg>": unencoded, a "#" in the
     markup would cut the image short — re-encode it (only an SVG data image is accepted) */
  function qrSrc(v){
    v = String(v || '');
    var head = /^data:image\/svg\+xml(;[^,]*)?,/i.exec(v);
    if(!head) return '';
    var body = v.slice(head[0].length);
    if(/;base64/i.test(head[1] || '') || /^%3C/i.test(body)) return v;   /* already safe */
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(body);
  }
  /* Supabase refuses two apps with the same name on one account: number them */
  function appName(){
    var used = {}, day = new Date().toISOString().slice(0, 10), n = S.mfa.factors.length + 1, name;
    S.mfa.factors.forEach(function(f){ used[f.friendly_name] = 1; });
    do { name = 'Authenticator ' + n + ' · ' + day; n++; } while(used[name]);
    return name;
  }
  function dropApp(id){ if(id && sb) sb.auth.mfa.unenroll({ factorId:id }).catch(function(){}); }
  function renderEnroll(data, backup){
    var tp = data.totp || {};
    var qr = qrSrc(tp.qr_code);
    var uri = /^otpauth:\/\/totp\//.test(String(tp.uri || '')) ? tp.uri : '';
    var key = String(tp.secret || '').replace(/[^A-Z2-7]/gi, '');
    $('drawerBody').innerHTML = '<h3 id="drawerTitle">' + esc(t(backup ? 'en.titleBackup' : 'en.title')) + '</h3>' +
      '<ol class="enroll">' +
        '<li><b>1</b><span>' + esc(t('en.s1')) + '</span></li>' +
        '<li><b>2</b><span>' + esc(t('en.s2')) + '</span>' +
          (qr ? '<div class="qr"><img src="' + esc(qr) + '" alt="QR code" width="180" height="180" /></div>' : '') +
          (uri ? '<div><a class="btn btn-ghost btn-sm" href="' + esc(uri) + '">' + esc(t('en.open')) + '</a></div>' : '') +
          '<span class="hint">' + esc(t('en.key')) + '</span>' +
          '<div class="secret"><code id="enKey">' + esc(key.replace(/(.{4})/g, '$1 ').trim()) + '</code>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-action="copy-key" data-key="' + esc(key) + '">' + esc(t('en.copy')) + '</button></div>' +
          '<span class="hint">' + esc(t('en.keySecret')) + '</span></li>' +
        '<li><b>3</b><span>' + esc(t('en.s3')) + '</span>' +
          '<form id="enrollForm" class="stack" novalidate>' +
            '<input class="input code-input" id="enCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" spellcheck="false" aria-label="' + esc(t('mfa.code')) + '" />' +
            '<p class="err" id="enErr" role="alert" hidden></p>' +
            '<button class="btn btn-primary" id="enBtn" type="submit">' + ICON.shield + '<span>' + esc(t('en.confirm')) + '</span></button>' +
          '</form></li>' +
      '</ol>';
  }
  var enrollBusy = false;
  function confirmEnroll(){
    var d = S.drawer, input = $('enCode');
    if(!d || d.type !== 'mfa' || !d.pending || !input || enrollBusy) return;
    var code = digits(input), err = $('enErr');
    if(code.length !== 6){ err.textContent = t('mfa.six'); err.hidden = false; return; }
    enrollBusy = true;
    $('enBtn').disabled = true;
    sb.auth.mfa.challengeAndVerify({ factorId:d.pending, code:code }).then(function(r){
      enrollBusy = false;
      if($('enBtn')) $('enBtn').disabled = false;
      if(r.error){ err.textContent = t(mfaErrKey(r.error)); err.hidden = false; input.select(); return; }
      d.pending = null;                   /* confirmed: keep it */
      closeDrawer();
      toast(t('sec.enabled'));
      refreshMfa();
    }).catch(function(){ enrollBusy = false; if($('enBtn')) $('enBtn').disabled = false; err.textContent = t('login.network'); err.hidden = false; });
  }
  function removeApp(id){
    var apps = S.mfa.factors, f = apps.filter(function(x){ return x.id === id; })[0];
    if(!f || apps.length < 2) return;   /* the last app is removed only through the recovery procedure */
    if(!window.confirm(fill(t('sec.confirmRemove'), { n:f.friendly_name || 'TOTP' }))) return;
    sb.auth.mfa.unenroll({ factorId:id }).then(function(r){
      if(r.error) throw r.error;
      toast(t('sec.removed'));
      /* if this session had used that app, it is back to aal1: ask for a code from the other one */
      return sb.auth.refreshSession().then(function(){ return assurance(); }).then(function(a){
        if(a.needCode) return askCode(a.factors);
        S.mfa = { known:true, factors:a.factors };
        renderSecNudge(); renderSecurity();
      });
    }).catch(toastErr);
  }

  /* ─── data ─── */
  var orderSeq = 0, orderApplied = 0;
  function loadOrders(first){
    var seq = ++orderSeq;
    return q(sb.from('orders').select('*').order('created_at', { ascending:false }).limit(1000)).then(function(rows){
      if(seq < orderApplied) return false;     /* an older request answered late: ignore it */
      orderApplied = seq;
      var fresh = [];
      if(S.known){
        rows.forEach(function(o){ if(!S.known[o.id] && o.status === 'pending') fresh.push(o); });
      }
      S.known = {};
      rows.forEach(function(o){ S.known[o.id] = 1; });
      S.orders = rows;
      S.lastLoad = Date.now();
      if(fresh.length && !first) alertNew(fresh);
      return true;
    });
  }
  function loadFlavors(){ return q(sb.from('flavors').select('*').order('sort_order', { ascending:true }).order('id', { ascending:true })).then(function(r){ S.flavors = r; }); }
  function loadGallery(){ return q(sb.from('gallery_posts').select('*').order('sort_order', { ascending:true }).order('id', { ascending:true })).then(function(r){ S.gallery = r; }); }
  function loadSettings(){
    return q(sb.from('site_settings').select('key,value')).then(function(rows){
      S.settings = {};
      rows.forEach(function(r){ S.settings[r.key] = r.value || {}; });
    });
  }
  function loadPromos(){ return q(sb.from('promo_codes').select('*').order('created_at', { ascending:false })).then(function(r){ S.promos = r; }); }
  function loadAll(first){
    return Promise.all([loadOrders(first), loadFlavors(), loadGallery(), loadSettings(), loadPromos()])
      .then(function(){ renderTab(); updateBadges(); })
      .catch(toastErr);
  }
  var refreshTimer = null;
  function refreshOrders(){
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function(){
      if(!sb || $('scrMain').hidden) return;
      loadOrders(false).then(function(applied){
        if(applied === false) return;
        if(S.tab === 'orders') updateOrders();
        if(S.tab === 'calendar') renderCalendar();
        if(S.tab === 'settings') updateStats();
        refreshDrawerOrder();
        updateBadges();
      }).catch(function(e){ if(navigator.onLine !== false) toastErr(e); });
    }, 300);
  }
  function findOrder(id){ for(var i = 0; i < S.orders.length; i++){ if(String(S.orders[i].id) === String(id)) return S.orders[i]; } return null; }
  function findFlavor(id){ for(var i = 0; i < S.flavors.length; i++){ if(String(S.flavors[i].id) === String(id)) return S.flavors[i]; } return null; }
  function findPost(id){ for(var i = 0; i < S.gallery.length; i++){ if(String(S.gallery[i].id) === String(id)) return S.gallery[i]; } return null; }
  function setting(key){ return S.settings[key] || {}; }
  function basePrice(){ return parseInt(setting('pricing').base_unit_price, 10) || 120; }

  /* ─── realtime + polling fallback ─── */
  function setLive(state){
    S.live = state;
    var el = $('liveState');
    el.classList.toggle('is-live', state === 'live');
    el.classList.toggle('is-off', state === 'off');
    $('liveLabel').textContent = t(state === 'live' ? 'app.live' : state === 'off' ? 'app.offlineShort' : 'app.polling');
    el.title = $('liveLabel').textContent;
  }
  function startLive(){
    stopLive();
    setLive(navigator.onLine === false ? 'off' : 'poll');
    try{
      S.channel = sb.channel('dy-atelier-orders')
        .on('postgres_changes', { event:'*', schema:'public', table:'orders' }, refreshOrders)
        .subscribe(function(status){
          if(status === 'SUBSCRIBED') setLive('live');
          else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setLive(navigator.onLine === false ? 'off' : 'poll');
        });
    }catch(e){ S.channel = null; }
    /* realtime can drop silently on phones: poll every 20 s without it, every 2 min with it */
    S.poll = setInterval(function(){
      if(document.hidden && S.live === 'live') return;
      if(S.live !== 'live' || Date.now() - S.lastLoad > 120000) refreshOrders();
    }, 20000);
  }
  function stopLive(){
    if(S.poll){ clearInterval(S.poll); S.poll = null; }
    if(S.channel && sb){ try{ sb.removeChannel(S.channel); }catch(e){} }
    S.channel = null;
    setLive('off');
  }
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) refreshOrders(); });
  window.addEventListener('online', function(){ if(sb && !$('scrMain').hidden){ setLive(S.channel ? 'poll' : 'poll'); refreshOrders(); } });
  window.addEventListener('offline', function(){ if(!$('scrMain').hidden){ setLive('off'); toast(t('app.offline'), 'is-err'); } });

  /* ─── new-order alert: chime + vibration + toast + system notification ─── */
  var audioCtx = null;
  function unlockAudio(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      if(!audioCtx) audioCtx = new AC();
      var p = audioCtx.state === 'suspended' ? audioCtx.resume() : null;
      if(p && p.then) p.then(renderAlertHint, function(){}); else renderAlertHint();
    }catch(e){}
  }
  function alertsReady(){
    var audioOk = !S.sound || !(window.AudioContext || window.webkitAudioContext) || (audioCtx && audioCtx.state === 'running');
    var notifOk = !('Notification' in window) || Notification.permission !== 'default';
    return audioOk && notifOk;
  }
  /* browsers only allow sound / notifications after a tap: ask for that tap once */
  function renderAlertHint(){
    var box = $('alertHint');
    if(!box) return;
    box.innerHTML = alertsReady() ? '' : '<p class="notice notice-row"><span>' + esc(t('alert.hint')) + '</span>' +
      '<button class="btn btn-primary btn-sm" type="button" data-action="enable-alerts">' + esc(t('alert.btn')) + '</button></p>';
  }
  function enableAlerts(){
    unlockAudio();
    if(S.sound) chime();
    if('Notification' in window && Notification.permission === 'default'){
      try{
        var r = Notification.requestPermission(renderAlertHint);
        if(r && r.then) r.then(renderAlertHint, function(){});
      }catch(e){}
    }
    renderAlertHint();
  }
  document.addEventListener('pointerdown', unlockAudio, { passive:true });
  function chime(){
    if(!audioCtx) return;
    try{
      var now = audioCtx.currentTime;
      [880, 1174.7, 1568].forEach(function(f, i){
        var o = audioCtx.createOscillator(), g = audioCtx.createGain(), at = now + i * 0.16;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(at); o.stop(at + 0.75);
      });
    }catch(e){}
  }
  function renderSoundBtn(){
    var b = $('soundBtn');
    b.classList.toggle('is-off', !S.sound);
    b.setAttribute('aria-pressed', String(S.sound));
    b.setAttribute('aria-label', t(S.sound ? 'app.soundOn' : 'app.soundOff'));
    b.title = b.getAttribute('aria-label');
  }
  function toggleSound(){
    S.sound = !S.sound;
    store('dy_admin_sound', S.sound ? '1' : '0');
    renderSoundBtn();
    toast(t(S.sound ? 'app.soundOn' : 'app.soundOff'));
    if(S.sound){
      unlockAudio(); chime();
      if('Notification' in window && Notification.permission === 'default'){ try{ Notification.requestPermission(); }catch(e){} }
    }
  }
  function alertNew(list){
    list.forEach(function(o){ S.unseen[o.id] = true; });
    var o = list[0], text = fill(t('ord.newToast'), { c:o.tracking_code, n:o.customer_name });
    if(S.sound) chime();
    if(navigator.vibrate){ try{ navigator.vibrate([180, 90, 180]); }catch(e){} }
    toast(text, 'is-new');
    if(document.hidden && 'Notification' in window && Notification.permission === 'granted'){
      var opts = { body:fill(t('ord.pieces'), { n:o.box_size }) + ' · ' + money(o.total_price), icon:'icons/icon-192.png', tag:'dy-order-' + o.id };
      var direct = function(){ try{ new Notification(text, opts); }catch(e){} };
      /* Android needs the service worker to show it; without a registration fall back to the page API */
      if(navigator.serviceWorker && navigator.serviceWorker.getRegistration){
        navigator.serviceWorker.getRegistration().then(function(reg){
          if(reg && reg.showNotification) reg.showNotification(text, opts).catch(direct); else direct();
        }, direct);
      }else direct();
    }
    updateBadges();
  }
  function updateBadges(){
    var pending = S.orders.filter(function(o){ return o.status === 'pending'; }).length;
    var b = $('badgeOrders');
    b.hidden = !pending;
    b.textContent = pending;
    var unseen = Object.keys(S.unseen).length;
    document.title = (unseen ? '(' + unseen + ') ' : '') + 'Atelier — Dori Yums';
  }

  /* ─── tabs ─── */
  function switchTab(tab){
    if(S.tab === 'settings' && tab !== 'settings') S.dirtyForms = {};
    S.tab = tab;
    document.querySelectorAll('.tab').forEach(function(b){ b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === tab)); });
    document.querySelectorAll('.view').forEach(function(v){ v.hidden = v.id !== 'view-' + tab; });
    renderTab();
    window.scrollTo(0, 0);
  }
  function renderTab(){
    if(S.tab === 'orders') renderOrders();
    else if(S.tab === 'calendar') renderCalendar();
    else if(S.tab === 'flavors') renderFlavors();
    else if(S.tab === 'gallery') renderGallery();
    else if(S.tab === 'settings') renderSettings();
  }
  function head(eyebrowKey, titleKey, actions){
    return '<div class="view-head"><div><span class="eyebrow">' + esc(t(eyebrowKey)) + '</span><h2>' + esc(t(titleKey)) + '</h2></div>' +
      (actions ? '<div class="btnrow">' + actions + '</div>' : '') + '</div>';
  }
  function pill(st){ return '<span class="pill st-' + esc(st) + '">' + esc(t('st.' + st)) + '</span>'; }
  function emptyBox(key){ return '<p class="empty">' + esc(t(key)) + '</p>'; }

  /* ─── orders ─── */
  function renderOrders(){
    var el = $('view-orders');
    el.innerHTML = head('ord.eyebrow', 'tab.orders',
        '<button class="btn btn-ghost btn-sm" type="button" data-action="refresh">' + ICON.refresh + '<span>' + esc(t('app.refresh')) + '</span></button>') +
      '<div id="secNudge"></div><div id="alertHint"></div><div id="ordHoliday"></div>' +
      '<div class="chips" id="ordChips" role="group"></div>' +
      '<input class="input search" id="ordSearch" type="search" autocomplete="off" placeholder="' + esc(t('ord.search')) + '" value="' + esc(S.search) + '" />' +
      '<div id="ordList"></div>';
    updateOrders();
    renderSecNudge();
    renderAlertHint();
  }
  function updateOrders(){
    var chips = $('ordChips');
    if(!chips) return;
    var counts = { all:S.orders.length };
    STATUSES.forEach(function(s){ counts[s] = 0; });
    S.orders.forEach(function(o){ counts[o.status] = (counts[o.status] || 0) + 1; });
    chips.innerHTML = ['all'].concat(STATUSES).map(function(f){
      return '<button class="chip" type="button" data-action="filter" data-filter="' + f + '" aria-pressed="' + (S.filter === f) + '">' +
        esc(f === 'all' ? t('ord.all') : t('st.' + f)) + '<b>' + counts[f] + '</b></button>';
    }).join('');
    $('ordHoliday').innerHTML = setting('holiday_mode').enabled ? '<p class="notice">' + esc(t('ord.holidayOn')) + '</p>' : '';
    var needle = S.search.trim().toLowerCase(), digits = needle.replace(/\D/g, '');
    var list = S.orders.filter(function(o){
      if(S.filter !== 'all' && o.status !== S.filter) return false;
      if(!needle) return true;
      return String(o.customer_name).toLowerCase().indexOf(needle) >= 0 ||
        String(o.tracking_code).toLowerCase().indexOf(needle) >= 0 ||
        (digits.length >= 3 && String(o.phone).replace(/\D/g, '').indexOf(digits.replace(/^0/, '')) >= 0);
    });
    $('ordList').innerHTML = list.length ? '<div class="olist">' + list.map(orderCard).join('') + '</div>'
      : emptyBox(S.orders.length ? 'ord.emptyFilter' : 'ord.empty');
  }
  function orderCard(o){
    var d = daysBetween(todayISO(), o.event_date), open = !!OPEN[o.status];
    var late = open && d < 0, soon = open && d >= 0 && d <= 1, next = NEXT[o.status];
    var where = o.delivery_type === 'pickup' ? t('ord.pickup') : t('ord.delivery') + ' · ' + o.wilaya + (o.commune ? ', ' + o.commune : '');
    return '<article class="ocard' + (S.unseen[o.id] ? ' is-new' : '') + (o.status === 'cancelled' ? ' is-cancelled' : '') + '">' +
      '<button class="ocard-open" type="button" data-action="open-order" data-id="' + esc(o.id) + '">' +
        '<span class="ocard-top"><span class="ocode">' + esc(o.tracking_code) + '</span>' +
          (S.unseen[o.id] ? '<span class="newtag">' + esc(t('ord.new')) + '</span>' : '') + pill(o.status) + '</span>' +
        '<span class="oname">' + esc(o.customer_name) + '</span>' +
        '<span class="ometa"><span class="' + (late ? 'late' : soon ? 'soon' : '') + '">' +
          esc(fmtDay(o.event_date) + ' · ' + (late ? t('ord.late') + ' · ' : '') + relDay(o.event_date)) + '</span>' +
          '<span>' + esc(fill(t('ord.pieces'), { n:o.box_size })) + '</span><span>' + esc(money(o.total_price)) + '</span></span>' +
        '<span class="ometa"><span>' + esc(where) + '</span></span>' +
      '</button>' +
      '<div class="oactions">' +
        '<a class="icon-btn icon-btn-sm" href="tel:' + esc(o.phone) + '" aria-label="' + esc(t('ord.call') + ' ' + o.customer_name) + '">' + ICON.phone + '</a>' +
        '<a class="icon-btn icon-btn-sm" href="' + esc(waLink(o)) + '" target="_blank" rel="noopener" aria-label="' + esc('WhatsApp ' + o.customer_name) + '">' + ICON.wa + '</a>' +
        (next ? '<button class="btn btn-primary btn-sm" type="button" data-action="set-status" data-id="' + esc(o.id) + '" data-status="' + next + '">' + esc(t('act.' + next)) + '</button>' : '') +
      '</div>' +
    '</article>';
  }
  function setStatus(id, status){
    var o = findOrder(id);
    if(!o || o.status === status) return;
    if(status === 'cancelled' && !window.confirm(fill(t('act.confirmCancel'), { c:o.tracking_code }))) return;
    var prev = o.status;
    o.status = status;
    delete S.unseen[o.id];
    afterOrderChange();
    q(sb.from('orders').update({ status:status }).eq('id', o.id).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      Object.assign(o, rows[0]);
      afterOrderChange();
      toast(fill(t('ord.statusSaved'), { s:t('st.' + status) }));
    }).catch(function(e){ o.status = prev; afterOrderChange(); toastErr(e); });
  }
  function afterOrderChange(){
    if(S.tab === 'orders') updateOrders();
    if(S.tab === 'calendar') renderCalendar();
    refreshDrawerOrder();
    updateBadges();
  }
  function stamp(o){ return String(o.updated_at) + '|' + o.status; }
  function refreshDrawerOrder(){
    if(!S.drawer || S.drawer.type !== 'order') return;
    var o = findOrder(S.drawer.id);
    if(!o){ closeDrawer(); return; }
    if(stamp(o) !== S.drawer.stamp) openOrder(o.id, true);
  }

  /* order details */
  function openOrder(id, keep){
    var o = findOrder(id);
    if(!o){ toast(t('ord.notFound'), 'is-err'); return; }
    if(S.unseen[o.id]){ delete S.unseen[o.id]; updateBadges(); if(S.tab === 'orders') updateOrders(); }
    var scroll = keep ? document.querySelector('.drawer').scrollTop : 0;
    S.drawer = { type:'order', id:o.id, stamp:stamp(o) };
    var items = (o.items || []).map(function(i){
      return '<div class="drow"><span>' + esc(i.name_fr) + ' × ' + esc(i.qty) + ' <small class="hint">(' + esc(money(i.unit_price)) + ')</small></span><b>' +
        esc(money(i.line_total != null ? i.line_total : i.qty * i.unit_price)) + '</b></div>';
    }).join('');
    var html =
      '<div class="dhead"><h3 id="drawerTitle">' + esc(o.tracking_code) + '</h3>' + pill(o.status) + '</div>' +
      '<p class="dsub">' + esc(fill(t('ord.created'), { d:fmtDateTime(o.created_at) })) + '</p>' +
      '<div class="dsec"><h4>' + esc(t('ord.status')) + '</h4><div class="status-row">' + STATUSES.map(function(s){
        return '<button class="status-btn' + (o.status === s ? ' st-' + s : '') + '" type="button" data-action="set-status" data-id="' + esc(o.id) +
          '" data-status="' + s + '" aria-pressed="' + (o.status === s) + '">' + esc(t('st.' + s)) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="dsec"><h4>' + esc(t('ord.customer')) + '</h4>' +
        '<p class="dline"><b>' + esc(o.customer_name) + '</b></p><p class="dline">' + esc(prettyPhone(o.phone)) + '</p>' +
        '<div class="btnrow" style="margin-top:10px">' +
          '<a class="btn btn-ghost btn-sm" href="tel:' + esc(o.phone) + '">' + ICON.phone + '<span>' + esc(t('ord.call')) + '</span></a>' +
          '<a class="btn btn-wa btn-sm" href="' + esc(waLink(o)) + '" target="_blank" rel="noopener">' + ICON.wa + '<span>WhatsApp</span></a>' +
        '</div></div>' +
      '<div class="dsec"><h4>' + esc(t('ord.when')) + '</h4>' +
        '<p class="dline"><b>' + esc(fmtDay(o.event_date, true)) + '</b> · ' + esc(relDay(o.event_date)) + '</p>' +
        '<p class="dline">' + esc(o.delivery_type === 'pickup' ? t('ord.pickup') + ' · ' + o.wilaya
          : t('ord.delivery') + ' · ' + o.wilaya + (o.commune ? ', ' + o.commune : '')) + '</p></div>' +
      '<div class="dsec"><h4>' + esc(fill(t('ord.box'), { n:o.box_size })) + '</h4>' + items +
        '<div class="drow"><span>' + esc(t('ord.subtotal')) + '</span><b>' + esc(money(o.subtotal)) + '</b></div>' +
        (o.discount_amount ? '<div class="drow"><span>' + esc(t('ord.discount')) + (o.promo_code ? ' · ' + esc(o.promo_code) : '') + '</span><b>−' + esc(money(o.discount_amount)) + '</b></div>' : '') +
        (o.delivery_type === 'pickup' ? '' : '<div class="drow"><span>' + esc(t('ord.fee')) + '</span><b>' + esc(o.delivery_fee ? money(o.delivery_fee) : t('ord.free')) + '</b></div>') +
        '<div class="drow total"><span>' + esc(t('ord.total')) + '</span><b>' + esc(money(o.total_price)) + '</b></div></div>' +
      '<div class="dsec"><h4>' + esc(t('ord.notes')) + '</h4><p class="dline" style="white-space:pre-wrap">' + esc(o.custom_notes || '—') + '</p></div>' +
      (o.inspiration_image_url ? '<div class="dsec"><h4>' + esc(t('ord.photo')) + '</h4><a class="inspo" id="inspoLink" target="_blank" rel="noopener" hidden><img id="inspoImg" alt="' + esc(t('ord.photo')) + '" /></a><p class="hint" id="inspoErr" hidden>' + esc(t('ord.photoErr')) + '</p></div>' : '') +
      '<div class="dsec"><h4>' + esc(t('ord.history')) + '</h4><ul class="history" id="histList"></ul></div>';
    openDrawer(html, scroll);
    if(o.inspiration_image_url){
      var path = String(o.inspiration_image_url).replace(/^inspirations\//, '');
      var cached = S.signed[path];
      var signed = cached && Date.now() - cached.at < 50 * 60000 ? Promise.resolve({ data:{ signedUrl:cached.url } })
        : sb.storage.from('inspirations').createSignedUrl(path, 3600);
      signed.then(function(r){
        if(!S.drawer || S.drawer.id !== o.id || !$('inspoImg')) return;
        if(r.error || !r.data || !r.data.signedUrl){ $('inspoErr').hidden = false; return; }
        if(!cached || cached.url !== r.data.signedUrl) S.signed[path] = { url:r.data.signedUrl, at:Date.now() };
        $('inspoImg').src = r.data.signedUrl; $('inspoLink').href = r.data.signedUrl; $('inspoLink').hidden = false;
      }).catch(function(){ if($('inspoErr')) $('inspoErr').hidden = false; });
    }
    q(sb.from('order_status_log').select('*').eq('order_id', o.id).order('changed_at', { ascending:true })).then(function(rows){
      var list = $('histList');
      if(!list || !S.drawer || S.drawer.id !== o.id) return;
      list.innerHTML = rows.map(function(l){
        return '<li><span>' + esc(t('st.' + l.to_status)) + '</span><span>' + esc(fmtDateTime(l.changed_at)) + '</span></li>';
      }).join('');
    }).catch(function(){});
  }

  /* ─── drawer ─── */
  var drawerTrigger = null;
  function openDrawer(html, scroll){
    if($('drawer').hidden) drawerTrigger = document.activeElement;
    $('drawerBody').innerHTML = html;
    $('drawer').hidden = false;
    document.body.style.overflow = 'hidden';
    var d = document.querySelector('.drawer');
    d.scrollTop = scroll || 0;
    if(!scroll) d.querySelector('.drawer-close').focus();
  }
  function closeDrawer(){
    if($('drawer').hidden) return;
    if(S.drawer && S.drawer.type === 'mfa' && S.drawer.pending) dropApp(S.drawer.pending);   /* never confirmed */
    $('drawer').hidden = true;
    $('drawerBody').innerHTML = '';
    document.body.style.overflow = '';
    S.drawer = null;
    if(drawerTrigger && document.contains(drawerTrigger) && drawerTrigger.focus) drawerTrigger.focus();
  }
  $('drawer').addEventListener('click', function(e){ if(e.target === $('drawer')) closeDrawer(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeDrawer(); });

  /* ─── baking calendar ─── */
  function aggregate(orders){
    var map = {}, list = [];
    orders.forEach(function(o){
      (o.items || []).forEach(function(i){
        var k = i.flavor_id != null ? 'id' + i.flavor_id : 'n' + i.name_fr;
        if(!map[k]){ map[k] = { name:i.name_fr, qty:0 }; list.push(map[k]); }
        map[k].qty += +i.qty || 0;
      });
    });
    return list.sort(function(a, b){ return b.qty - a.qty || String(a.name).localeCompare(String(b.name)); });
  }
  function flavorRows(rows){
    var max = rows.length ? rows[0].qty : 1;
    return rows.map(function(r){
      return '<div class="frow"><span>' + esc(r.name) + '</span><b>' + esc(r.qty) + '</b><div class="bar"><i style="width:' +
        Math.max(4, Math.round(r.qty / max * 100)) + '%"></i></div></div>';
    }).join('');
  }
  function orderChips(list){
    return '<div class="order-chips">' + list.map(function(o){
      return '<button class="order-chip" type="button" data-action="open-order" data-id="' + esc(o.id) + '">' +
        esc(o.tracking_code + ' · ' + o.customer_name) + '</button>';
    }).join('') + '</div>';
  }
  function renderCalendar(){
    var today = todayISO(), end = addDays(today, S.calDays - 1);
    var keep = S.calPending ? OPEN : { confirmed:1, baking:1 };
    var open = S.orders.filter(function(o){ return keep[o.status]; });
    var range = open.filter(function(o){ return o.event_date >= today && o.event_date <= end; });
    var late = open.filter(function(o){ return o.event_date < today; });
    var days = {};
    range.forEach(function(o){ (days[o.event_date] = days[o.event_date] || []).push(o); });
    var pieces = function(l){ return l.reduce(function(s, o){ return s + (+o.box_size || 0); }, 0); };
    var html = head('cal.eyebrow', 'tab.calendar') +
      '<div class="cal-controls"><div class="chips" role="group">' + [7, 14, 30].map(function(n){
        return '<button class="chip" type="button" data-action="cal-days" data-days="' + n + '" aria-pressed="' + (S.calDays === n) + '">' + esc(fill(t('cal.days'), { n:n })) + '</button>';
      }).join('') + '</div>' +
      '<label class="check"><span class="switch"><input type="checkbox" id="calPending"' + (S.calPending ? ' checked' : '') + ' /><span></span></span>' +
        '<span>' + esc(t('cal.includePending')) + '</span></label></div>';
    if(late.length){
      html += '<div class="card cal-card is-late" style="margin-bottom:14px"><h3>' + esc(t('cal.late')) + '</h3>' +
        '<p class="cal-sub">' + esc(fill(t('cal.dayTotal'), { n:pieces(late), o:late.length })) + '</p>' + flavorRows(aggregate(late)) + orderChips(late) + '</div>';
    }
    if(!range.length){
      html += emptyBox('cal.empty');
    }else{
      html += '<div class="card cal-total"><h3>' + esc(t('cal.total')) + '</h3>' +
        '<p class="cal-sub">' + esc(fill(t('cal.dayTotal'), { n:pieces(range), o:range.length })) + '</p>' + flavorRows(aggregate(range)) + '</div>' +
        '<div class="cal-grid">' + Object.keys(days).sort().map(function(dkey){
          var l = days[dkey];
          return '<div class="card cal-card' + (dkey === today ? ' is-today' : '') + '"><h3>' + esc(fmtDay(dkey, true)) + '</h3>' +
            '<p class="cal-sub">' + esc((dkey === today ? t('cal.today') : relDay(dkey)) + ' · ' + fill(t('cal.dayTotal'), { n:pieces(l), o:l.length })) + '</p>' +
            flavorRows(aggregate(l)) + orderChips(l) + '</div>';
        }).join('') + '</div>';
    }
    $('view-calendar').innerHTML = html;
  }

  /* ─── images: resize + upload to a public bucket ─── */
  function uuid(){ return window.DY && window.DY.newRequestId ? window.DY.newRequestId() : String(Date.now()) + Math.random().toString(16).slice(2); }
  function uploadPublic(bucket, folder, file){
    var prep = window.DY && window.DY.prepareImage ? window.DY.prepareImage(file, 1600) : Promise.resolve(file);
    return prep.then(function(img){
      var ext = { 'image/webp':'webp', 'image/png':'png', 'image/jpeg':'jpg' }[img.type];
      if(!ext) throw new Error('photo_format');   /* e.g. HEIC/GIF the browser could not convert */
      var path = folder + '/' + uuid() + '.' + ext;
      return sb.storage.from(bucket).upload(path, img, { contentType:img.type, upsert:false, cacheControl:'31536000' }).then(function(r){
        if(r.error) throw r.error;
        return { path:path, url:sb.storage.from(bucket).getPublicUrl(path).data.publicUrl };
      });
    });
  }
  /* "…/storage/v1/object/public/<bucket>/<path>" → path, when the image lives in that bucket */
  function bucketPath(bucket, url){
    var marker = '/storage/v1/object/public/' + bucket + '/', i = String(url || '').indexOf(marker);
    return i >= 0 ? decodeURIComponent(String(url).slice(i + marker.length).split('?')[0]) : null;
  }
  function removeObject(bucket, url){
    var p = bucketPath(bucket, url);
    if(p) sb.storage.from(bucket).remove([p]).catch(function(){});
  }
  function langBlocks(fields, row){
    return LANGS.map(function(l){
      return '<div class="lang-block"><b>' + esc(t('lang.' + l)) + '</b>' + fields.map(function(f){
        var name = f.key + '_' + l, val = row ? row[name] : '';
        return '<label class="field"><span>' + esc(f.label) + '</span>' + (f.area
          ? '<textarea class="textarea" name="' + name + '" dir="auto" rows="2">' + esc(val) + '</textarea>'
          : '<input class="input" name="' + name + '" dir="auto" value="' + esc(val) + '" />') + '</label>';
      }).join('') + '</div>';
    }).join('');
  }
  function previewFile(input, img){
    var f = input.files && input.files[0];
    if(f && img){ img.src = URL.createObjectURL(f); img.hidden = false; }
  }

  /* ─── flavors ─── */
  function renderFlavors(){
    var base = basePrice();
    var html = head('fl.eyebrow', 'tab.flavors',
      '<button class="btn btn-primary btn-sm" type="button" data-action="edit-flavor">' + ICON.plus + '<span>' + esc(t('fl.add')) + '</span></button>');
    if(!S.flavors.length){ $('view-flavors').innerHTML = html + emptyBox('fl.empty'); return; }
    html += '<div class="flist">' + S.flavors.map(function(f, i){
      var on = f.is_available !== false;
      var price = f.price != null ? fill(t('fl.perPiece'), { p:fmt(f.price) }) : fill(t('fl.perPiece'), { p:fmt(base) }) + ' · ' + t('fl.basePrice');
      var sub = [LANG !== 'fr' ? f['name_' + LANG] : f.name_en, price].filter(Boolean).join(' · ');
      return '<div class="fitem' + (on ? '' : ' is-off') + '">' +
        '<img src="' + esc(safeImg(f.image_url)) + '" alt="" loading="lazy" />' +
        '<div><div class="fi-name"><small>' + esc(f.roman_numeral) + '</small>' + esc(f.name_fr) + '</div><div class="fi-meta">' + esc(sub) + '</div></div>' +
        '<div class="fi-actions">' +
          '<span class="fi-state">' + esc(t(on ? 'fl.available' : 'fl.soldout')) + '</span>' +
          '<label class="switch"><input type="checkbox" data-action="toggle-flavor" data-id="' + esc(f.id) + '"' + (on ? ' checked' : '') +
            ' aria-label="' + esc(t('fl.available') + ' — ' + f.name_fr) + '" /><span></span></label>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="move-flavor" data-id="' + esc(f.id) + '" data-dir="-1" aria-label="' + esc(t('app.moveUp')) + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="move-flavor" data-id="' + esc(f.id) + '" data-dir="1" aria-label="' + esc(t('app.moveDown')) + '"' + (i === S.flavors.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="edit-flavor" data-id="' + esc(f.id) + '" aria-label="' + esc(t('app.edit') + ' ' + f.name_fr) + '">' + ICON.edit + '</button>' +
        '</div></div>';
    }).join('') + '</div>';
    $('view-flavors').innerHTML = html;
  }
  function toggleFlavor(input){
    var f = findFlavor(input.getAttribute('data-id'));
    if(!f) return;
    var on = input.checked, prev = f.is_available;
    f.is_available = on;
    renderFlavors();
    q(sb.from('flavors').update({ is_available:on }).eq('id', f.id).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      toast(fill(t(on ? 'fl.nowAvailable' : 'fl.nowSoldout'), { n:f.name_fr }));
    }).catch(function(e){ f.is_available = prev; renderFlavors(); toastErr(e); });
  }
  /* reorder: renumber the list 1..n and save only what changed */
  function moveRow(list, id, dir, table, rerender, reload){
    var i = -1;
    list.forEach(function(r, k){ if(String(r.id) === String(id)) i = k; });
    var j = i + dir;
    if(i < 0 || j < 0 || j >= list.length) return;
    var moved = list.splice(i, 1)[0];
    list.splice(j, 0, moved);
    var changed = [];
    list.forEach(function(r, k){ if(r.sort_order !== k + 1){ r.sort_order = k + 1; changed.push(r); } });
    rerender();
    /* queued: rapid taps are written in the order they were made */
    S.moveQueue = S.moveQueue.then(function(){
      return changed.reduce(function(p, r){
        return p.then(function(){
          return q(sb.from(table).update({ sort_order:r.sort_order }).eq('id', r.id).select()).then(function(rows){
            if(!rows || !rows.length) throw new Error('no_rows');
          });
        });
      }, Promise.resolve());
    }).catch(function(e){
      toastErr(e);
      return reload().then(rerender, function(){});   /* show what the database really holds */
    });
  }
  function editFlavor(id){
    var f = id != null ? findFlavor(id) : null;
    S.drawer = { type:'flavor', id:f ? f.id : null };
    openDrawer(
      '<h3 id="drawerTitle">' + esc(t(f ? 'fl.editTitle' : 'fl.newTitle')) + '</h3>' +
      '<form class="stack" data-form="flavor" novalidate style="margin-top:18px">' +
        '<div class="field"><span>' + esc(t('fl.photo')) + '</span><div class="photo-edit">' +
          '<img id="fePreview" alt=""' + (f && f.image_url ? ' src="' + esc(safeImg(f.image_url)) + '"' : ' hidden') + ' />' +
          '<label class="btn btn-ghost btn-sm file-btn"><input type="file" name="photo" accept="image/*" data-preview="fePreview" /><span>' + esc(t('fl.photoPick')) + '</span></label>' +
        '</div><small class="hint">' + esc(t('fl.photoHint')) + '</small></div>' +
        '<div class="grid2">' +
          '<label class="field"><span>' + esc(t('fl.roman')) + '</span><input class="input" name="roman_numeral" maxlength="8" value="' + esc(f ? f.roman_numeral : '') + '" /></label>' +
          '<label class="field"><span>' + esc(t('fl.price')) + '</span><input class="input" name="price" type="number" min="0" step="1" inputmode="numeric" placeholder="' + basePrice() + '" value="' + esc(f && f.price != null ? f.price : '') + '" />' +
            '<small class="hint">' + esc(fill(t('fl.priceHint'), { p:basePrice() })) + '</small></label>' +
        '</div>' +
        '<label class="check"><span class="switch"><input type="checkbox" name="is_available"' + (!f || f.is_available !== false ? ' checked' : '') + ' /><span></span></span><span>' + esc(t('fl.available')) + '</span></label>' +
        langBlocks([{ key:'name', label:t('fl.name') }, { key:'desc', label:t('fl.desc'), area:true }], f) +
        '<p class="err" data-role="err" role="alert" hidden></p>' +
        '<div class="form-actions">' +
          (f ? '<button class="btn btn-danger btn-sm" type="button" data-action="delete-flavor" data-id="' + esc(f.id) + '">' + ICON.trash + '<span>' + esc(t('app.delete')) + '</span></button>' : '') +
          '<button class="btn btn-ghost" type="button" data-action="close-drawer">' + esc(t('app.cancel')) + '</button>' +
          '<button class="btn btn-primary" type="submit" data-role="submit">' + esc(t('app.save')) + '</button>' +
        '</div>' +
      '</form>');
  }
  function formErr(form, msg){ var e = form.querySelector('[data-role="err"]'); e.textContent = msg; e.hidden = !msg; }
  function formBusy(form, label){
    var b = form.querySelector('[data-role="submit"]');
    b.disabled = !!label;
    b.textContent = label || t('app.save');
  }
  function saveFlavor(form){
    var f = S.drawer && S.drawer.id != null ? findFlavor(S.drawer.id) : null;
    var v = function(n){ return form.elements[n] ? String(form.elements[n].value).trim() : ''; };
    if(!v('name_fr')){ formErr(form, t('fl.nameRequired')); form.elements.name_fr.focus(); return; }
    var price = num(form.elements.price, true);
    if(isNaN(price)){ formErr(form, t('fl.priceBad')); return; }
    var row = { roman_numeral:v('roman_numeral'), price:price, is_available:form.elements.is_available.checked };
    LANGS.forEach(function(l){ row['name_' + l] = v('name_' + l); row['desc_' + l] = v('desc_' + l); });
    var file = form.elements.photo.files && form.elements.photo.files[0];
    formErr(form, '');
    formBusy(form, t(file ? 'fl.uploading' : 'fl.saving'));
    var uploaded = null;
    (file ? uploadPublic('flavor-images', 'flavors', file) : Promise.resolve(null)).then(function(up){
      uploaded = up;
      if(up) row.image_url = up.url;
      formBusy(form, t('fl.saving'));
      if(f) return q(sb.from('flavors').update(row).eq('id', f.id).select());
      row.sort_order = S.flavors.reduce(function(m, x){ return Math.max(m, x.sort_order || 0); }, 0) + 1;
      if(!row.image_url) row.image_url = '';
      return q(sb.from('flavors').insert(row).select());
    }).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      if(f){ if(uploaded && f.image_url !== rows[0].image_url) removeObject('flavor-images', f.image_url); Object.assign(f, rows[0]); }
      else S.flavors.push(rows[0]);
      closeDrawer(); renderFlavors(); toast(t('fl.saved'));
    }).catch(function(e){
      if(uploaded) removeObject('flavor-images', uploaded.url);
      formBusy(form, null); formErr(form, friendly(e));
    });
  }
  function deleteFlavor(id){
    var f = findFlavor(id);
    if(!f || !window.confirm(fill(t('app.confirmDelete'), { n:f.name_fr }))) return;
    q(sb.from('flavors').delete().eq('id', f.id).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      removeObject('flavor-images', f.image_url);
      S.flavors = S.flavors.filter(function(x){ return x !== f; });
      closeDrawer(); renderFlavors(); toast(t('fl.deleted'));
    }).catch(toastErr);
  }

  /* ─── gallery & testimonials ─── */
  function catPosts(){ return S.gallery.filter(function(g){ return g.category === S.galCat; }); }
  function renderGallery(){
    var list = catPosts();
    var html = head('ga.eyebrow', 'tab.gallery',
        '<button class="btn btn-primary btn-sm" type="button" data-action="edit-post">' + ICON.plus + '<span>' + esc(t('ga.add')) + '</span></button>') +
      '<div class="chips" role="group" style="margin-bottom:14px">' + ['atelier', 'testimonial'].map(function(c){
        var n = S.gallery.filter(function(g){ return g.category === c; }).length;
        return '<button class="chip" type="button" data-action="gal-cat" data-cat="' + c + '" aria-pressed="' + (S.galCat === c) + '">' + esc(t('ga.' + c)) + '<b>' + n + '</b></button>';
      }).join('') + '</div>';
    html += list.length ? '<div class="ggrid">' + list.map(function(g, i){
      var title = g['title_' + LANG] || g.title_fr, cap = g['caption_' + LANG] || g.caption_fr;
      return '<div class="gcard' + (g.category === 'testimonial' ? ' is-testimonial' : '') + '">' +
        '<img src="' + esc(safeImg(g.image_url)) + '" alt="" loading="lazy" />' +
        '<div class="gcard-body"><b>' + esc(title || '—') + '</b><span>' + esc(cap) + '</span></div>' +
        '<div class="gcard-actions">' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="move-post" data-id="' + esc(g.id) + '" data-dir="-1" aria-label="' + esc(t('app.moveUp')) + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="move-post" data-id="' + esc(g.id) + '" data-dir="1" aria-label="' + esc(t('app.moveDown')) + '"' + (i === list.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="edit-post" data-id="' + esc(g.id) + '" aria-label="' + esc(t('app.edit')) + '">' + ICON.edit + '</button>' +
          '<button class="icon-btn icon-btn-sm" type="button" data-action="delete-post" data-id="' + esc(g.id) + '" aria-label="' + esc(t('app.delete')) + '">' + ICON.trash + '</button>' +
        '</div></div>';
    }).join('') + '</div>' : emptyBox('ga.empty');
    $('view-gallery').innerHTML = html;
  }
  function editPost(id){
    var g = id != null ? findPost(id) : null, cat = g ? g.category : S.galCat, testi = cat === 'testimonial';
    S.drawer = { type:'post', id:g ? g.id : null };
    openDrawer(
      '<h3 id="drawerTitle">' + esc(t(g ? 'ga.editTitle' : 'ga.newTitle')) + '</h3>' +
      '<form class="stack" data-form="post" novalidate style="margin-top:18px">' +
        '<label class="field"><span>' + esc(t('ga.category')) + '</span><select class="select" name="category">' +
          ['atelier', 'testimonial'].map(function(c){ return '<option value="' + c + '"' + (c === cat ? ' selected' : '') + '>' + esc(t('ga.' + c)) + '</option>'; }).join('') +
        '</select></label>' +
        '<div class="field"><span>' + esc(t('fl.photo')) + '</span><div class="photo-edit' + (testi ? ' is-wide' : '') + '">' +
          '<img id="gePreview" alt=""' + (g && g.image_url ? ' src="' + esc(safeImg(g.image_url)) + '"' : ' hidden') + ' />' +
          '<label class="btn btn-ghost btn-sm file-btn"><input type="file" name="photo" accept="image/*" data-preview="gePreview" /><span>' + esc(t('fl.photoPick')) + '</span></label>' +
        '</div><small class="hint">' + esc(testi ? t('ga.testHint') : t('fl.photoHint')) + '</small></div>' +
        langBlocks([{ key:'title', label:testi ? t('ga.titleTesti') : t('ga.title') }, { key:'caption', label:testi ? t('ga.captionTesti') : t('ga.caption'), area:true }], g) +
        '<p class="err" data-role="err" role="alert" hidden></p>' +
        '<div class="form-actions">' +
          (g ? '<button class="btn btn-danger btn-sm" type="button" data-action="delete-post" data-id="' + esc(g.id) + '">' + ICON.trash + '<span>' + esc(t('app.delete')) + '</span></button>' : '') +
          '<button class="btn btn-ghost" type="button" data-action="close-drawer">' + esc(t('app.cancel')) + '</button>' +
          '<button class="btn btn-primary" type="submit" data-role="submit">' + esc(t('app.save')) + '</button>' +
        '</div>' +
      '</form>');
  }
  function savePost(form){
    var g = S.drawer && S.drawer.id != null ? findPost(S.drawer.id) : null;
    var v = function(n){ return String(form.elements[n].value).trim(); };
    var file = form.elements.photo.files && form.elements.photo.files[0];
    if(!g && !file){ formErr(form, t('ga.photoRequired')); return; }
    var row = { category:form.elements.category.value === 'testimonial' ? 'testimonial' : 'atelier' };
    LANGS.forEach(function(l){ row['title_' + l] = v('title_' + l); row['caption_' + l] = v('caption_' + l); });
    formErr(form, '');
    formBusy(form, t(file ? 'fl.uploading' : 'fl.saving'));
    var uploaded = null;
    (file ? uploadPublic('gallery', row.category, file) : Promise.resolve(null)).then(function(up){
      uploaded = up;
      if(up) row.image_url = up.url;
      formBusy(form, t('fl.saving'));
      if(g) return q(sb.from('gallery_posts').update(row).eq('id', g.id).select());
      row.sort_order = S.gallery.filter(function(x){ return x.category === row.category; })
        .reduce(function(m, x){ return Math.max(m, x.sort_order || 0); }, 0) + 1;
      return q(sb.from('gallery_posts').insert(row).select());
    }).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      if(g){ if(uploaded && g.image_url !== rows[0].image_url) removeObject('gallery', g.image_url); Object.assign(g, rows[0]); }
      else S.gallery.push(rows[0]);
      S.galCat = rows[0].category;
      closeDrawer(); renderGallery(); toast(t('ga.saved'));
    }).catch(function(e){
      if(uploaded) removeObject('gallery', uploaded.url);
      formBusy(form, null); formErr(form, friendly(e));
    });
  }
  function deletePost(id){
    var g = findPost(id);
    if(!g || !window.confirm(fill(t('app.confirmDelete'), { n:g.title_fr || t('ga.' + g.category) }))) return;
    q(sb.from('gallery_posts').delete().eq('id', g.id).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      removeObject('gallery', g.image_url);
      S.gallery = S.gallery.filter(function(x){ return x !== g; });
      closeDrawer(); renderGallery(); toast(t('ga.deleted'));
    }).catch(toastErr);
  }

  /* ─── settings, promo codes, statistics ─── */
  function numField(name, label, value, opts){
    opts = opts || {};
    return '<label class="field"><span>' + esc(label) + '</span><input class="input" name="' + name + '" type="number" min="0" step="1" inputmode="numeric"' +
      (opts.placeholder != null ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + ' value="' + esc(value == null ? '' : value) + '" />' +
      (opts.hint ? '<small class="hint">' + esc(opts.hint) + '</small>' : '') + '</label>';
  }
  function wilayaOptions(sel){
    return '<option value=""></option>' + WILAYAS.map(function(w, i){
      var n = String(i + 1);
      return '<option value="' + n + '"' + (n === String(sel) ? ' selected' : '') + '>' + (i + 1 < 10 ? '0' : '') + n + ' — ' + esc(w) + '</option>';
    }).join('');
  }
  function tierRow(x){
    return '<div class="row-edit" data-row="tier">' + numField('min_qty', t('se.tierFrom'), x ? x.min_qty : '') +
      numField('discount_per_piece', t('se.tierOff'), x ? x.discount_per_piece : '') +
      '<button class="icon-btn" type="button" data-action="remove-row" aria-label="' + esc(t('se.remove')) + '">' + ICON.trash + '</button></div>';
  }
  function feeRow(code, fee){
    return '<div class="row-edit" data-row="fee"><label class="field"><span>' + esc(t('se.wilaya')) + '</span><select class="select" name="wilaya">' + wilayaOptions(code) + '</select></label>' +
      numField('fee', t('se.fee'), fee) +
      '<button class="icon-btn" type="button" data-action="remove-row" aria-label="' + esc(t('se.remove')) + '">' + ICON.trash + '</button></div>';
  }
  function textBlocks(prefix, label, obj, area){
    return LANGS.map(function(l){
      var name = prefix + '_' + l;
      return '<label class="field"><span>' + esc(label + ' · ' + t('lang.' + l)) + '</span>' + (area
        ? '<textarea class="textarea" name="' + name + '" dir="auto" rows="2">' + esc(obj[name] || '') + '</textarea>'
        : '<input class="input" name="' + name + '" dir="auto" value="' + esc(obj[name] || '') + '" />') + '</label>';
    }).join('');
  }
  function saveRow(){ return '<div class="save-row"><button class="btn btn-primary" type="submit" data-role="submit">' + esc(t('app.save')) + '</button></div>'; }
  function promoRow(p){
    var today = todayISO(), expired = p.expires_at && String(p.expires_at).slice(0, 10) < today;
    var val = p.discount_type === 'percentage' ? p.discount_value + ' %' : money(p.discount_value);
    var when = p.expires_at ? (expired ? t('se.expired') : fill(t('se.until'), { d:fmtDay(String(p.expires_at).slice(0, 10)) })) : t('se.noExpiry');
    return '<div class="promo-row"><div><b>' + esc(p.code) + '</b><span class="hint">' + esc(val + ' · ' + when) + '</span></div>' +
      '<label class="check"><span class="hint">' + esc(t('se.active')) + '</span><span class="switch"><input type="checkbox" data-action="toggle-promo" data-id="' + esc(p.id) + '"' +
      (p.is_active ? ' checked' : '') + ' aria-label="' + esc(t('se.active') + ' — ' + p.code) + '" /><span></span></span></label></div>';
  }
  function renderSettings(){
    var pr = setting('pricing'), od = setting('ordering'), dl = setting('delivery'), an = setting('announcement'), hm = setting('holiday_mode');
    var fees = dl.wilaya_fees && typeof dl.wilaya_fees === 'object' ? dl.wilaya_fees : {};
    var tiers = Array.isArray(pr.tiers) ? pr.tiers : [], sizes = Array.isArray(od.box_sizes) ? od.box_sizes : [];
    S.dirtyForms = {};
    $('view-settings').innerHTML = head('se.eyebrow', 'tab.settings') + '<div class="scards">' +
      '<div class="card scard" id="secCard"><h3>' + esc(t('sec.title')) + '</h3><div id="secBox" style="margin-top:8px"></div></div>' +
      '<div class="card scard"><h3>' + esc(t('se.stats')) + '</h3><div id="statsBox" style="margin-top:12px"></div></div>' +

      '<form class="card scard" data-form="pricing" novalidate><h3>' + esc(t('se.pricing')) + '</h3><p class="hint">' + esc(t('se.pricingHint')) + '</p>' +
        numField('base_unit_price', t('se.base'), pr.base_unit_price, { hint:t('se.baseHint') }) +
        '<p class="subhead">' + esc(t('se.tiers')) + '</p><div data-list="tier">' + tiers.map(tierRow).join('') + '</div>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="add-tier" style="margin-top:10px">' + ICON.plus + '<span>' + esc(t('se.addTier')) + '</span></button>' +
        '<p class="err" data-role="err" role="alert" hidden></p>' + saveRow() + '</form>' +

      '<form class="card scard" data-form="ordering" novalidate><h3>' + esc(t('se.ordering')) + '</h3><p class="hint">' + esc(t('se.orderingHint')) + '</p>' +
        '<div class="stack">' +
          '<label class="field"><span>' + esc(t('se.sizes')) + '</span><input class="input" name="box_sizes" inputmode="numeric" value="' + esc(sizes.join(', ')) + '" /><small class="hint">' + esc(t('se.sizesHint')) + '</small></label>' +
          '<div class="grid3">' + numField('box_step', t('se.boxStep'), od.box_step) + numField('min_pieces', t('se.min'), od.min_pieces) + numField('max_pieces', t('se.max'), od.max_pieces) + '</div>' +
          '<div class="grid2">' + numField('flavor_step', t('se.flavorStep'), od.flavor_step) + numField('min_lead_days', t('se.lead'), od.min_lead_days) + '</div>' +
        '</div><p class="err" data-role="err" role="alert" hidden></p>' + saveRow() + '</form>' +

      '<form class="card scard" data-form="delivery" novalidate><h3>' + esc(t('se.delivery')) + '</h3><p class="hint">' + esc(t('se.deliveryHint')) + '</p>' +
        '<div class="grid2">' + numField('pickup_fee', t('se.pickupFee'), dl.pickup_fee) + numField('default_fee', t('se.defaultFee'), dl.default_fee, { hint:t('se.defaultFeeHint') }) + '</div>' +
        '<p class="subhead">' + esc(t('se.wilayaFees')) + '</p><p class="hint">' + esc(t('se.wilayaFeeHint')) + '</p>' +
        '<div data-list="fee">' + Object.keys(fees).sort(function(a, b){ return a - b; }).map(function(k){ return feeRow(k, fees[k]); }).join('') + '</div>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="add-wilaya" style="margin-top:10px">' + ICON.plus + '<span>' + esc(t('se.addWilaya')) + '</span></button>' +
        '<p class="err" data-role="err" role="alert" hidden></p>' + saveRow() + '</form>' +

      '<form class="card scard" data-form="announcement" novalidate><h3>' + esc(t('se.announcement')) + '</h3><p class="hint">' + esc(t('se.annHint')) + '</p>' +
        '<div class="stack"><label class="check"><span class="switch"><input type="checkbox" name="enabled"' + (an.enabled ? ' checked' : '') + ' /><span></span></span><span>' + esc(t('se.annEnabled')) + '</span></label>' +
        textBlocks('text', t('se.text'), an, false) + '</div><p class="err" data-role="err" role="alert" hidden></p>' + saveRow() + '</form>' +

      '<form class="card scard" data-form="holiday_mode" novalidate><h3>' + esc(t('se.holiday')) + '</h3><p class="hint">' + esc(t('se.holHint')) + '</p>' +
        '<div class="stack"><label class="check"><span class="switch"><input type="checkbox" name="enabled"' + (hm.enabled ? ' checked' : '') + ' /><span></span></span><span>' + esc(t('se.holEnabled')) + '</span></label>' +
        textBlocks('message', t('se.message'), hm, true) + '</div><p class="err" data-role="err" role="alert" hidden></p>' + saveRow() + '</form>' +

      '<div class="card scard"><h3>' + esc(t('se.promos')) + '</h3><p class="hint">' + esc(t('se.promosHint')) + '</p>' +
        '<div id="promoList">' + (S.promos.length ? S.promos.map(promoRow).join('') : '<p class="hint">' + esc(t('se.noPromos')) + '</p>') + '</div>' +
        '<form data-form="promo-new" novalidate style="margin-top:14px" class="stack">' +
          '<div class="grid2"><label class="field"><span>' + esc(t('se.code')) + '</span><input class="input" name="code" maxlength="32" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase" /></label>' +
          '<label class="field"><span>' + esc(t('se.type')) + '</span><select class="select" name="discount_type"><option value="percentage">' + esc(t('se.percentage')) + '</option><option value="fixed">' + esc(t('se.fixed')) + '</option></select></label></div>' +
          '<div class="grid2">' + numField('discount_value', t('se.value'), '') +
          '<label class="field"><span>' + esc(t('se.expires')) + '</span><input class="input" name="expires" type="date" /></label></div>' +
          '<p class="err" data-role="err" role="alert" hidden></p>' +
          '<div class="save-row"><button class="btn btn-primary" type="submit" data-role="submit">' + ICON.plus + '<span>' + esc(t('se.create')) + '</span></button></div>' +
        '</form></div>' +
    '</div>';
    updateStats();
    renderSecurity();
  }
  function updateStats(){
    var box = $('statsBox');
    if(!box) return;
    var valid = S.orders.filter(function(o){ return o.status !== 'cancelled'; });
    var month = todayISO().slice(0, 7);
    var sum = function(l){ return l.reduce(function(s, o){ return s + (+o.total_price || 0); }, 0); };
    var sales = sum(valid);
    var monthSales = sum(valid.filter(function(o){ return algiersMonth(o.created_at) === month; }));
    var pending = S.orders.filter(function(o){ return o.status === 'pending'; }).length;
    var top = aggregate(valid).slice(0, 5), max = top.length ? top[0].qty : 1;
    box.innerHTML = '<div class="stats">' +
      '<div class="stat"><b>' + fmt(valid.length) + '</b><span>' + esc(t('se.orders')) + '</span></div>' +
      '<div class="stat"><b>' + fmt(sales) + '</b><span>' + esc(t('se.sales')) + ' · DZD</span></div>' +
      '<div class="stat"><b>' + fmt(monthSales) + '</b><span>' + esc(t('se.month')) + ' · DZD</span></div>' +
      '<div class="stat"><b>' + fmt(valid.length ? sales / valid.length : 0) + '</b><span>' + esc(t('se.avg')) + ' · DZD</span></div>' +
      '</div>' +
      '<p class="subhead">' + esc(t('se.top')) + '</p>' +
      (top.length ? top.map(function(r){
        return '<div class="frow"><span>' + esc(r.name) + '</span><b>' + esc(fill(t('se.piecesShort'), { n:fmt(r.qty) })) + '</b><div class="bar"><i style="width:' +
          Math.max(4, Math.round(r.qty / max * 100)) + '%"></i></div></div>';
      }).join('') : '<p class="hint">' + esc(t('se.topEmpty')) + '</p>') +
      (pending ? '<p class="hint" style="margin-top:10px">' + esc(t('se.pendingCount')) + ' : ' + pending + '</p>' : '');
  }
  /* whole number 0..max from an <input>; '' → null when allowed. A typo in a number
     field ("1,000") reads as '' in the browser: validity.badInput catches it → NaN. */
  var MAX_INT = 100000;
  function num(el, allowEmpty, max){
    if(!el) return NaN;
    if(el.validity && el.validity.badInput) return NaN;
    var v = String(el.value == null ? '' : el.value).trim();
    if(v === '') return allowEmpty ? null : NaN;
    var n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= (max || MAX_INT) ? n : NaN;
  }
  function saveSetting(form, key, value){
    formErr(form, '');
    formBusy(form, t('fl.saving'));
    return q(sb.from('site_settings').upsert({ key:key, value:value }, { onConflict:'key' }).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      S.settings[key] = rows[0].value;
      delete S.dirtyForms[key];
      formBusy(form, null);
      toast(t('app.saved'));
      if(key === 'holiday_mode') updateBadges();
    }).catch(function(e){ formBusy(form, null); formErr(form, friendly(e)); });
  }
  function submitSettings(form, kind){
    var el = form.elements, bad = function(msg){ formErr(form, msg || t('se.numBad')); };
    if(kind === 'pricing'){
      var base = num(el.base_unit_price);
      if(isNaN(base)) return bad();
      if(base < 1) return bad(t('se.baseBad'));
      var tiers = [], ok = true, seenQty = {};
      form.querySelectorAll('[data-row="tier"]').forEach(function(r){
        var ia = r.querySelector('[name="min_qty"]'), ib = r.querySelector('[name="discount_per_piece"]');
        var a = num(ia, true), b = num(ib, true);
        if(a === null && b === null && !(ia.validity && ia.validity.badInput) && !(ib.validity && ib.validity.badInput)) return;
        if(!(a > 0) || isNaN(b) || b === null){ ok = false; return; }
        if(seenQty[a]){ ok = 'dup'; return; }
        seenQty[a] = 1;
        tiers.push({ min_qty:a, discount_per_piece:b });
      });
      if(ok === 'dup') return bad(t('se.dupTier'));
      if(!ok) return bad();
      tiers.sort(function(x, y){ return x.min_qty - y.min_qty; });
      return saveSetting(form, 'pricing', Object.assign({}, setting('pricing'), { currency:'DZD', base_unit_price:base, tiers:tiers }));
    }
    if(kind === 'ordering'){
      var sizes = String(el.box_sizes.value).split(/[\s,;]+/).filter(Boolean).map(Number);
      if(!sizes.length || sizes.some(function(n){ return !Number.isInteger(n) || n <= 0 || n > MAX_INT; })) return bad(t('se.sizesBad'));
      var o = { box_step:num(el.box_step), min_pieces:num(el.min_pieces), max_pieces:num(el.max_pieces),
                flavor_step:num(el.flavor_step), min_lead_days:num(el.min_lead_days, false, 365) };
      if(Object.keys(o).some(function(k){ return isNaN(o[k]); }) || !(o.min_pieces > 0) || o.max_pieces < o.min_pieces || !(o.flavor_step > 0)) return bad();
      /* the same rules place_order() enforces — otherwise every order of a given size would be refused */
      if(o.box_step > 0 && o.min_pieces % o.box_step) return bad(t('se.rulesBad'));
      if(sizes.some(function(n){
        return n < o.min_pieces || n > o.max_pieces || (o.box_step > 0 && n % o.box_step) || n % o.flavor_step;
      })) return bad(t('se.sizesRule'));
      o.box_sizes = sizes.filter(function(n, i, a){ return a.indexOf(n) === i; }).sort(function(a, b){ return a - b; });
      return saveSetting(form, 'ordering', Object.assign({}, setting('ordering'), o));
    }
    if(kind === 'delivery'){
      var pickup = num(el.pickup_fee), def = num(el.default_fee, true), fees = {}, okd = !isNaN(pickup) && !isNaN(def);
      form.querySelectorAll('[data-row="fee"]').forEach(function(r){
        var w = r.querySelector('[name="wilaya"]').value, f = num(r.querySelector('[name="fee"]'), true);
        if(!w) return;
        if(Object.prototype.hasOwnProperty.call(fees, w)){ okd = 'dup'; return; }
        if(isNaN(f)) okd = false; else fees[w] = f;
      });
      if(okd === 'dup') return bad(t('se.dupWilaya'));
      if(!okd) return bad();
      return saveSetting(form, 'delivery', { pickup_fee:pickup, default_fee:def, wilaya_fees:fees });
    }
    if(kind === 'announcement' || kind === 'holiday_mode'){
      var prefix = kind === 'announcement' ? 'text' : 'message', val = { enabled:el.enabled.checked };
      LANGS.forEach(function(l){ val[prefix + '_' + l] = String(el[prefix + '_' + l].value).trim(); });
      return saveSetting(form, kind, val);
    }
  }
  function createPromo(form){
    var el = form.elements, code = String(el.code.value).trim().toUpperCase(), type = el.discount_type.value, value = num(el.discount_value);
    if(!/^[A-Z0-9_-]{3,32}$/.test(code)){ formErr(form, t('se.codeBad')); return; }
    if(!(value > 0) || (type === 'percentage' && value > 100)){ formErr(form, t('se.valueBad')); return; }
    if(S.promos.some(function(p){ return p.code === code; })){ formErr(form, t('se.codeExists')); return; }
    var row = { code:code, discount_type:type === 'fixed' ? 'fixed' : 'percentage', discount_value:value, is_active:true,
                expires_at:el.expires.value ? el.expires.value + 'T23:59:59+01:00' : null };
    formErr(form, '');
    formBusy(form, t('fl.saving'));
    q(sb.from('promo_codes').insert(row).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      S.promos.unshift(rows[0]);
      $('promoList').innerHTML = S.promos.map(promoRow).join('');
      form.reset();
      formBusy(form, null);
      form.querySelector('[data-role="submit"]').innerHTML = ICON.plus + '<span>' + esc(t('se.create')) + '</span>';
      toast(fill(t('se.promoCreated'), { c:code }));
    }).catch(function(e){
      formBusy(form, null);
      form.querySelector('[data-role="submit"]').innerHTML = ICON.plus + '<span>' + esc(t('se.create')) + '</span>';
      formErr(form, /duplicate|23505/.test(errMsg(e)) ? t('se.codeExists') : fill(t('app.error'), { m:errMsg(e) }));
    });
  }
  function togglePromo(input){
    var p = null;
    S.promos.forEach(function(x){ if(String(x.id) === input.getAttribute('data-id')) p = x; });
    if(!p) return;
    var on = input.checked;
    q(sb.from('promo_codes').update({ is_active:on }).eq('id', p.id).select()).then(function(rows){
      if(!rows || !rows.length) throw new Error('no_rows');
      p.is_active = on;
      toast(fill(t(on ? 'se.promoOn' : 'se.promoOff'), { c:p.code }));
    }).catch(function(e){ input.checked = !on; toastErr(e); });
  }

  function markDirty(el){
    var f = el && el.closest && el.closest('#view-settings form[data-form]');
    if(f) S.dirtyForms[f.getAttribute('data-form')] = 1;
  }

  /* ─── events (delegated) ─── */
  document.addEventListener('click', function(e){
    var langBtn = e.target.closest('.langs button[data-lang]');
    if(langBtn){ LANG = langBtn.getAttribute('data-lang'); store('dy_admin_lang', LANG); applyLang(); return; }
    var tab = e.target.closest('.tab[data-tab]');
    if(tab){ closeDrawer(); switchTab(tab.getAttribute('data-tab')); return; }
    var a = e.target.closest('[data-action]');
    if(!a || a.disabled) return;
    var act = a.getAttribute('data-action'), id = a.getAttribute('data-id');
    if(act === 'logout') logout();
    else if(act === 'logout-all') logoutAll();
    else if(act === 'mfa-setup') startEnroll();
    else if(act === 'mfa-remove') removeApp(id);
    else if(act === 'copy-key'){
      var key = a.getAttribute('data-key') || '';
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(key).then(function(){ toast(t('en.copied')); }, function(){});
    }
    else if(act === 'toggle-sound') toggleSound();
    else if(act === 'close-drawer') closeDrawer();
    else if(act === 'refresh'){ refreshOrders(); loadAll(false); }
    else if(act === 'filter'){ S.filter = a.getAttribute('data-filter'); updateOrders(); }
    else if(act === 'open-order') openOrder(id);
    else if(act === 'set-status') setStatus(id, a.getAttribute('data-status'));
    else if(act === 'cal-days'){ S.calDays = +a.getAttribute('data-days') || 14; renderCalendar(); }
    else if(act === 'edit-flavor') editFlavor(id);
    else if(act === 'delete-flavor') deleteFlavor(id);
    else if(act === 'move-flavor') moveRow(S.flavors, id, +a.getAttribute('data-dir'), 'flavors', renderFlavors, loadFlavors);
    else if(act === 'gal-cat'){ S.galCat = a.getAttribute('data-cat'); renderGallery(); }
    else if(act === 'edit-post') editPost(id);
    else if(act === 'delete-post') deletePost(id);
    else if(act === 'move-post'){
      var list = catPosts();
      moveRow(list, id, +a.getAttribute('data-dir'), 'gallery_posts', function(){
        S.gallery.sort(function(x, y){ return (x.sort_order || 0) - (y.sort_order || 0) || x.id - y.id; });
        renderGallery();
      }, loadGallery);
    }
    else if(act === 'add-tier'){ a.previousElementSibling.insertAdjacentHTML('beforeend', tierRow(null)); markDirty(a); }
    else if(act === 'add-wilaya'){ a.previousElementSibling.insertAdjacentHTML('beforeend', feeRow('', '')); markDirty(a); }
    else if(act === 'remove-row'){ markDirty(a); a.closest('.row-edit').remove(); }
    else if(act === 'enable-alerts') enableAlerts();
    else if(act === 'retry') window.location.reload();
  });
  document.addEventListener('change', function(e){
    var el = e.target;
    if(el.matches('[data-action="toggle-flavor"]')) toggleFlavor(el);
    else if(el.matches('[data-action="toggle-promo"]')) togglePromo(el);
    else if(el.id === 'calPending'){ S.calPending = el.checked; renderCalendar(); }
    else if(el.matches('input[type="file"][data-preview]')) previewFile(el, $(el.getAttribute('data-preview')));
    else markDirty(el);
    if(el.name === 'category' && el.closest('[data-form="post"]')){
      var wide = el.value === 'testimonial';
      el.form.querySelector('.photo-edit').classList.toggle('is-wide', wide);
    }
  });
  document.addEventListener('input', function(e){
    if(e.target.id === 'ordSearch'){ S.search = e.target.value; updateOrders(); }
    else if(e.target.id === 'enCode') digits(e.target);
    else markDirty(e.target);
  });
  document.addEventListener('submit', function(e){
    if(e.target.id === 'enrollForm'){ e.preventDefault(); confirmEnroll(); return; }
    var form = e.target.closest('form[data-form]');
    if(!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form');
    if(kind === 'flavor') saveFlavor(form);
    else if(kind === 'post') savePost(form);
    else if(kind === 'promo-new') createPromo(form);
    else submitSettings(form, kind);
  });

  /* ─── PWA ─── */
  function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/admin-sw.js', { scope:'/admin' }).catch(function(){});
  }

  boot();
})();
