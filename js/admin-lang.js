/* Dori Yums atelier — the saved language, applied before the page paints (kept out of
   admin.html so the atelier's Content-Security-Policy can forbid every inline script). */
(function(){ try{ var l = localStorage.getItem('dy_admin_lang'); document.documentElement.lang = (l === 'en' || l === 'ar') ? l : 'fr'; }catch(e){} })();
