/* ============================================================
   Vendemos Rápido — Gestión de consentimiento de cookies (RGPD/LSSI)
   - Bloquea cualquier cookie no esencial (Meta Pixel, analítica...)
     hasta que el usuario dé su consentimiento explícito.
   - Aceptar y Rechazar tienen el mismo nivel de visibilidad.
   - Permite configuración granular por categoría y revocación
     en cualquier momento desde "Configurar cookies" en el footer.
   ============================================================ */
(function () {
  'use strict';

  var CONSENT_KEY = 'vr_cookie_consent_v1';
  var PIXEL_ID = window.metaPixelId || '1371434301763036';
  var PIXEL_EVENTS = window.metaPixelEvents || ['PageView'];

  /* ---------------- Consent storage ---------------- */

  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(partial) {
    var payload = {
      necessary: true,
      analytics: !!partial.analytics,
      marketing: !!partial.marketing,
      timestamp: new Date().toISOString(),
      version: 1
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    } catch (e) { /* localStorage no disponible: se pedirá de nuevo en la próxima visita */ }
    return payload;
  }

  /* ---------------- Category loaders ---------------- */
  /* Cada loader solo se ejecuta si el usuario ha dado consentimiento
     para esa categoría. No se carga ningún script de terceros antes. */

  var pixelLoaded = false;
  function loadMetaPixel() {
    if (pixelLoaded || window.fbq) return;
    pixelLoaded = true;

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', PIXEL_ID);
    PIXEL_EVENTS.forEach(function (ev) { window.fbq('track', ev); });

    var img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.alt = '';
    img.src = 'https://www.facebook.com/tr?id=' + PIXEL_ID + '&ev=' + PIXEL_EVENTS[0] + '&noscript=1';
    document.body.appendChild(img);
  }

  function loadAnalytics() {
    // Aquí se añadiría Google Analytics / otra herramienta analítica
    // cuando se incorpore, siguiendo el mismo patrón que loadMetaPixel().
    // Se deja preparado para que nunca se cargue sin consentimiento.
  }

  function applyConsent(consent) {
    if (consent.marketing) loadMetaPixel();
    if (consent.analytics) loadAnalytics();
  }

  /* ---------------- UI: banner ---------------- */

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function buildBanner() {
    return el(
      '<div id="cookieBanner" class="cookie-banner" role="region" aria-label="Aviso de cookies">' +
        '<div class="cookie-banner-inner">' +
          '<p class="cookie-banner-text">Usamos cookies propias y de terceros (como Meta) para que la web funcione, ' +
          'medir su uso y, si lo aceptas, mostrarte publicidad relevante. Puedes aceptar todas, rechazar las no ' +
          'esenciales o configurar tus preferencias. Más información en nuestra ' +
          '<a href="cookies.html">Política de Cookies</a>.</p>' +
          '<div class="cookie-banner-actions">' +
            '<button type="button" class="btn btn-outline btn-small" id="cookieRejectAll">Rechazar</button>' +
            '<button type="button" class="btn btn-outline btn-small" id="cookieConfigure">Configurar</button>' +
            '<button type="button" class="btn btn-primary btn-small" id="cookieAcceptAll">Aceptar todas</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildModal() {
    return el(
      '<div id="cookieModalOverlay" class="cookie-modal-overlay">' +
        '<div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle">' +
          '<button type="button" class="modal-close" id="cookieModalClose" aria-label="Cerrar">×</button>' +
          '<h3 id="cookieModalTitle">Preferencias de cookies</h3>' +
          '<p>Elige qué cookies quieres permitir. Puedes cambiar esta configuración cuando quieras desde ' +
          '“Configurar cookies”, al pie de cualquier página.</p>' +

          '<div class="cookie-category">' +
            '<div class="cookie-category-head">' +
              '<span>Necesarias</span>' +
              '<label class="switch switch-disabled">' +
                '<input type="checkbox" checked disabled aria-label="Cookies necesarias, siempre activas">' +
                '<span class="slider"></span>' +
              '</label>' +
            '</div>' +
            '<p>Imprescindibles para que la web funcione correctamente. No requieren consentimiento y no se pueden desactivar.</p>' +
          '</div>' +

          '<div class="cookie-category">' +
            '<div class="cookie-category-head">' +
              '<span>Analíticas</span>' +
              '<label class="switch">' +
                '<input type="checkbox" id="cookieAnalyticsToggle" aria-label="Activar cookies analíticas">' +
                '<span class="slider"></span>' +
              '</label>' +
            '</div>' +
            '<p>Nos ayudan a entender de forma agregada cómo se usa el sitio, para poder mejorarlo.</p>' +
          '</div>' +

          '<div class="cookie-category">' +
            '<div class="cookie-category-head">' +
              '<span>Publicidad / remarketing (Meta)</span>' +
              '<label class="switch">' +
                '<input type="checkbox" id="cookieMarketingToggle" aria-label="Activar cookies de publicidad de Meta">' +
                '<span class="slider"></span>' +
              '</label>' +
            '</div>' +
            '<p>Usadas por Meta (Facebook/Instagram) para medir y optimizar nuestras campañas publicitarias.</p>' +
          '</div>' +

          '<div class="cookie-modal-actions">' +
            '<button type="button" class="btn btn-outline btn-small" id="cookieModalRejectAll">Rechazar todas</button>' +
            '<button type="button" class="btn btn-outline btn-small" id="cookieModalSave">Guardar preferencias</button>' +
            '<button type="button" class="btn btn-primary btn-small" id="cookieModalAcceptAll">Aceptar todas</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var bannerEl = null;
  var modalEl = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = buildModal();
    document.body.appendChild(modalEl);

    modalEl.querySelector('#cookieModalClose').addEventListener('click', closeModal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal();
    });
    modalEl.querySelector('#cookieModalAcceptAll').addEventListener('click', function () {
      var consent = saveConsent({ analytics: true, marketing: true });
      applyConsent(consent);
      closeModal();
      hideBanner();
    });
    modalEl.querySelector('#cookieModalRejectAll').addEventListener('click', function () {
      var consent = saveConsent({ analytics: false, marketing: false });
      applyConsent(consent);
      closeModal();
      hideBanner();
    });
    modalEl.querySelector('#cookieModalSave').addEventListener('click', function () {
      var analytics = modalEl.querySelector('#cookieAnalyticsToggle').checked;
      var marketing = modalEl.querySelector('#cookieMarketingToggle').checked;
      var consent = saveConsent({ analytics: analytics, marketing: marketing });
      applyConsent(consent);
      closeModal();
      hideBanner();
    });

    return modalEl;
  }

  function openModal() {
    var modal = ensureModal();
    var existing = getConsent();
    modal.querySelector('#cookieAnalyticsToggle').checked = !!(existing && existing.analytics);
    modal.querySelector('#cookieMarketingToggle').checked = !!(existing && existing.marketing);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('show');
    document.body.style.overflow = '';
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    requestAnimationFrame(function () {
      bannerEl.classList.add('show');
    });

    bannerEl.querySelector('#cookieAcceptAll').addEventListener('click', function () {
      var consent = saveConsent({ analytics: true, marketing: true });
      applyConsent(consent);
      hideBanner();
    });
    bannerEl.querySelector('#cookieRejectAll').addEventListener('click', function () {
      var consent = saveConsent({ analytics: false, marketing: false });
      applyConsent(consent);
      hideBanner();
    });
    bannerEl.querySelector('#cookieConfigure').addEventListener('click', openModal);
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('show');
    setTimeout(function () {
      if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
      bannerEl = null;
    }, 250);
  }

  /* ---------------- Public API ---------------- */
  // Expuesto para el enlace "Configurar cookies" del footer.
  window.CookieConsent = {
    openPreferences: function () {
      ensureModal();
      openModal();
    },
    getConsent: getConsent
  };

  /* ---------------- Init ---------------- */

  function init() {
    var consent = getConsent();
    if (consent) {
      applyConsent(consent);
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
