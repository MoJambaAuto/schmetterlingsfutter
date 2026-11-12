/* Schmetterlingsfutter – Zurück-Taste des Handys (LZB, 3.31.0)
   Mo: „Der Zurück-Button soll erst innerhalb der App zurück, z. B. aus den Spielen raus, bis zur Startseite.
   Erst danach und nach einem weiteren Tippen soll sich die App schließen.“
   Technik: ein zusätzlicher Verlaufseintrag fängt die Zurück-Taste ab. Jeder Druck schließt das oberste offene Fenster
   (Spiel, Kamera, Fenster von unten …), danach geht es zur Startseite. Auf der Startseite erscheint „Nochmal Zurück
   zum Beenden“ – nur ein zweiter Druck innerhalb von 2,5 s schließt die App. */
(function () {
  'use strict';
  const L = window.LZ; if (!L || !window.history || !history.pushState) return;
  const $ = (id) => document.getElementById(id);
  const vis = (el) => !!el && el.isConnected && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const z = (el) => { let e = el, v = 0; while (e && e !== document.body) { const n = parseInt(getComputedStyle(e).zIndex, 10); if (!isNaN(n)) { v = Math.max(v, n); } e = e.parentElement; } return v; };
  const click = (el) => { if (el) { el.click(); return true; } return false; };

  /* Was gerade offen ist – jeweils mit „schließen“ */
  function layers() {
    const out = [];
    const add = (el, close, bonus) => { if (vis(el)) out.push({ el, close, z: z(el) + (bonus || 0) }); };
    document.querySelectorAll('.raum-ov').forEach((el) => add(el, () => click(el.querySelector('.ra-x')), 2));
    document.querySelectorAll('.jagd-fang').forEach((el) => add(el, () => click(el.querySelector('.jf-x')), 1));
    document.querySelectorAll('.jagd').forEach((el) => add(el, () => click(el.querySelector(el.classList.contains('show-map') ? '.jg-camback' : '.jg-x'))));
    document.querySelectorAll('.heide').forEach((el) => add(el, () => click(el.querySelector('.hd-x'))));
    document.querySelectorAll('#g2Screen .g2-hand, #g2Screen .g2-end').forEach((el) => add(el, () => { if (!click(el.querySelector('[data-close]'))) el.remove(); }, 1));
    add($('g2Screen'), () => click($('g2Screen').querySelector('[data-x]')));
    document.querySelectorAll('.fang').forEach((el) => add(el, () => click(el.querySelector('.fg-x'))));
    document.querySelectorAll('.cam').forEach((el) => add(el, () => { if (el.classList.contains('scan') && window.LZC && window.LZC.closeScan) window.LZC.closeScan(); else if (window.LZK && window.LZK.close) window.LZK.close(); else el.remove(); }));
    const m = $('modal'); if (m && m.classList.contains('open')) add(m, () => L.closeSheet());
    const ms = $('matchScreen'); if (ms && !ms.classList.contains('hidden')) add(ms, () => { if (window.LZP && window.LZP.closeMatch) window.LZP.closeMatch(); else ms.classList.add('hidden'); });
    return out.sort((a, b) => b.z - a.z);
  }
  const homeActive = () => { const h = $('view-home'); return !h || h.classList.contains('active'); };

  /* Verlaufseinträge, die ohne Antippen entstehen, überspringt Chrome beim Zurück. Darum: nach jedem Zurück sofort
     neu sichern und beim nächsten Antippen noch einmal „mit Geste“. */
  let gesture = false, exitTimer = null;
  const push = () => { try { history.pushState({ sfGuard: 1 }, '', location.href); } catch (e) {} };
  const arm = () => push();
  window.addEventListener('pointerdown', () => { if (!gesture) { push(); gesture = true; } }, true);
  window.addEventListener('keydown', () => { if (!gesture) { push(); gesture = true; } }, true);
  window.addEventListener('popstate', () => {
    gesture = false;
    const top = layers()[0];
    if (top) { try { top.close(); } catch (e) {} push(); return; }
    if (!homeActive()) { L.showView('home'); window.scrollTo(0, 0); push(); return; }
    /* Startseite: einmal warnen, beim zweiten Druck die App verlassen */
    if (exitTimer) { history.back(); return; }
    L.toast('Nochmal Zurück drücken zum Beenden');
    exitTimer = setTimeout(() => { exitTimer = null; push(); }, 2500);
  });
  window.LZB = { layers, arm };
})();
