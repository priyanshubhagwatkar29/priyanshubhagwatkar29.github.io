/* Privacy-conscious website analytics.
   GA4 and Microsoft Clarity load only after the visitor accepts analytics cookies.
   A minimal preference is stored locally so the choice persists across pages. */
(() => {
  "use strict";

  const GA_ID = "G-V7YLQLT60S";
  const CLARITY_ID = "zf4180i05t";
  const CONSENT_KEY = "pb_analytics_consent_v1";
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

  let analyticsLoaded = false;
  let banner;

  function getConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      if (!saved || !saved.choice || !saved.at) return null;
      if (Date.now() - saved.at > CONSENT_MAX_AGE) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }
      return saved.choice;
    } catch (_) {
      return null;
    }
  }

  function saveConsent(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, at: Date.now() }));
    } catch (_) {}
  }

  function loadAnalytics() {
    if (analyticsLoaded) {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      }
      if (typeof window.clarity === "function") window.clarity("consent", true);
      return;
    }
    analyticsLoaded = true;

    // Google Analytics 4
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      anonymize_ip: true,
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(ga);

    // Microsoft Clarity. It is not loaded until analytics consent is granted.
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  function track(name, params) {
    if (!analyticsLoaded || getConsent() !== "accept" || typeof window.gtag !== "function") return;
    window.gtag("event", name, Object.assign({
      page_path: location.pathname,
      page_title: document.title
    }, params || {}));
  }

  function cleanText(el) {
    const raw = (el.getAttribute("aria-label") || el.innerText || el.textContent || "").trim();
    return raw.replace(/\s+/g, " ").slice(0, 100);
  }

  function installInteractionTracking() {
    document.addEventListener("click", function (event) {
      const el = event.target && event.target.closest
        ? event.target.closest("a, button, [role='button']")
        : null;
      if (!el) return;

      const text = cleanText(el);
      const href = el.tagName === "A" ? (el.getAttribute("href") || "") : "";
      const id = el.id || "";
      const destination = href ? new URL(href, location.href) : null;
      const isOutbound = destination && destination.origin !== location.origin;
      const payload = {
        interaction_type: el.tagName === "A" ? "link" : "button",
        element_text: text,
        element_id: id || undefined,
        link_url: destination ? destination.href : undefined,
        link_domain: destination ? destination.hostname : undefined
      };

      track("site_interaction", payload);

      if (href && (/booking\.html/i.test(href) || /book|schedule|calendar/i.test(text))) {
        track("booking_cta_click", payload);
      }
      if (href && (/\.pdf(?:$|[?#])/i.test(href) || /cv|resume|curriculum vitae/i.test(text))) {
        track("cv_download_click", payload);
      }
      if (href && (/mailto:/i.test(href) || /contact|email/i.test(text))) {
        track("contact_click", payload);
      }
      if (href && /\/research\//i.test(destination.pathname)) {
        track("research_article_click", payload);
      }
      if (isOutbound) {
        track("outbound_link_click", payload);
      }
    }, true);

    if (/\/booking\.html$/i.test(location.pathname)) {
      track("booking_page_view", { page_type: "booking" });
    } else if (/\/research\//i.test(location.pathname)) {
      track("research_page_view", { page_type: "research" });
    } else {
      track("portfolio_page_view", { page_type: "portfolio" });
    }
  }

  function removeBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function showBanner() {
    if (banner || document.getElementById("pb-analytics-consent")) return;

    banner = document.createElement("section");
    banner.id = "pb-analytics-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie preferences");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <div class="pb-consent-card">
        <div class="pb-consent-copy">
          <strong>Privacy preferences</strong>
          <p>This website can use Google Analytics to measure visits and clicks, and Microsoft Clarity to understand page interactions through heatmaps and session recordings. These optional tools load only if you accept. You can reject them or change your choice later.</p>
        </div>
        <div class="pb-consent-actions">
          <button type="button" data-consent="reject" class="pb-consent-secondary">Reject cookies</button>
          <button type="button" data-consent="accept" class="pb-consent-primary">Accept cookies</button>
        </div>
      </div>`;
    document.body.appendChild(banner);

    banner.addEventListener("click", function (event) {
      const button = event.target.closest("[data-consent]");
      if (!button) return;
      const choice = button.getAttribute("data-consent");
      saveConsent(choice);
      removeBanner();
      if (choice === "accept") {
        loadAnalytics();
        installInteractionTracking();
      } else {
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
          });
        }
        if (typeof window.clarity === "function") window.clarity("consent", false);
      }
    });
  }

  function addPrivacyControl() {
    if (document.getElementById("pb-privacy-settings")) return;
    const button = document.createElement("button");
    button.id = "pb-privacy-settings";
    button.type = "button";
    button.textContent = "Cookie settings";
    button.setAttribute("aria-label", "Open cookie settings");
    button.addEventListener("click", showBanner);
    document.body.appendChild(button);
  }

  function addStyles() {
    if (document.getElementById("pb-analytics-styles")) return;
    const style = document.createElement("style");
    style.id = "pb-analytics-styles";
    style.textContent = `
      #pb-analytics-consent{position:fixed;z-index:2147483000;left:18px;right:18px;bottom:18px;display:flex;justify-content:center;font-family:Arial,sans-serif;color:#202124}
      #pb-analytics-consent .pb-consent-card{box-sizing:border-box;width:min(760px,100%);padding:20px 22px;background:#fff;border:1px solid #d9dce2;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.22)}
      #pb-analytics-consent strong{display:block;font-size:16px;font-weight:700;margin-bottom:7px}
      #pb-analytics-consent p{font-size:13px;line-height:1.55;color:#50545b;margin:0}
      #pb-analytics-consent .pb-consent-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:16px}
      #pb-analytics-consent button,#pb-privacy-settings{font:600 13px Arial,sans-serif;border-radius:8px;padding:10px 15px;cursor:pointer}
      #pb-analytics-consent .pb-consent-secondary{background:#fff;color:#30343b;border:1px solid #c7cbd2}
      #pb-analytics-consent .pb-consent-primary{background:#202a35;color:#fff;border:1px solid #202a35}
      #pb-privacy-settings{position:fixed;z-index:2147482000;right:14px;bottom:14px;background:rgba(32,42,53,.92);color:#fff;border:1px solid rgba(255,255,255,.25);box-shadow:0 3px 12px rgba(0,0,0,.16);padding:7px 11px;font-size:11px;opacity:.78}
      #pb-privacy-settings:hover{opacity:1}
      @media(max-width:560px){#pb-analytics-consent{left:10px;right:10px;bottom:10px}#pb-analytics-consent .pb-consent-card{padding:16px}#pb-analytics-consent .pb-consent-actions button{flex:1}#pb-privacy-settings{right:9px;bottom:9px}}
    `;
    document.head.appendChild(style);
  }

  function init() {
    addStyles();
    addPrivacyControl();
    const consent = getConsent();
    if (consent === "accept") {
      loadAnalytics();
      installInteractionTracking();
    } else if (consent !== "reject") {
      showBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();