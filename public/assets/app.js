(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function getJSON(name) {
    return fetch("/data/" + name + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(name + " " + r.status);
      return r.json();
    });
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function icon(id) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("class", "i");
    var u = document.createElementNS(ns, "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  }

  // lower-case and strip Greek accents, so "Έδεσσα" matches "εδεσσα"
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function telHref(v) {
    var d = String(v || "").replace(/[^\d+]/g, "");
    if (/^\d{10}$/.test(d)) d = "+30" + d;
    return "tel:" + d;
  }

  /* ---------- business details (data/site.json) ---------- */
  function applySite(site) {
    document.querySelectorAll("[data-site]").forEach(function (n) {
      var v = site[n.getAttribute("data-site")];
      if (v) n.textContent = v;
    });
    document.querySelectorAll("[data-tel]").forEach(function (n) {
      var v = site[n.getAttribute("data-tel")];
      if (v) n.setAttribute("href", telHref(v));
    });
    document.querySelectorAll("[data-mail]").forEach(function (n) {
      var v = site[n.getAttribute("data-mail")];
      if (v) n.setAttribute("href", "mailto:" + v);
    });
    document.querySelectorAll("[data-href]").forEach(function (n) {
      var v = site[n.getAttribute("data-href")];
      if (v) n.setAttribute("href", v);
    });
  }

  /* ---------- projects carousel ---------- */
  function buildCarousel(items) {
    var track = $("track");
    if (!track) return;
    var dots = $("dots"), prev = $("prev"), next = $("next");
    var counter = $("works-count");
    if (!counter) { counter = el("span", { id: "works-count", class: "works-count" }); counter.hidden = true; dots.after(counter); }
    items = (items || []).filter(function (i) { return i && i.image; });

    // Random order on every visit (Fisher–Yates shuffle).
    for (var r = items.length - 1; r > 0; r--) {
      var j = Math.floor(Math.random() * (r + 1));
      var tmp = items[r]; items[r] = items[j]; items[j] = tmp;
    }

    // On area pages show the projects from that area first (if any).
    var match = (track.getAttribute("data-match") || "").split("|").filter(Boolean).map(norm);
    if (match.length) {
      var local = items.filter(function (it) {
        var hay = norm((it.title || "") + " " + (it.location || ""));
        return match.some(function (m) { return hay.indexOf(m) >= 0; });
      });
      if (local.length) items = local.concat(items.filter(function (it) { return local.indexOf(it) < 0; }));
    }

    track.innerHTML = "";
    dots.innerHTML = "";
    if (!items.length) {
      track.replaceWith(el("p", { class: "empty-works", text: "Σύντομα εδώ φωτογραφίες από τα έργα μας." }));
      prev.hidden = next.hidden = true;
      return;
    }

    items.forEach(function (it, n) {
      var meta = [it.location, it.date].filter(Boolean).join(", ");
      var alt = [it.title || "Έργο κουφωμάτων", it.location].filter(Boolean).join(" - ");
      var img = el("img", { src: it.image, alt: alt, decoding: "async" });
      if (n > 3) img.setAttribute("loading", "lazy");
      // a photo that fails to load is removed instead of leaving an empty card
      img.addEventListener("error", function () {
        var fig = img.closest("figure");
        if (fig && track.children.length > 1) { fig.remove(); render(); }
      });
      track.appendChild(el("figure", { class: "work" }, [
        img,
        (it.title || meta) ? el("figcaption", {}, [
          it.title ? el("strong", { text: it.title }) : null,
          meta ? el("span", { text: meta }) : null
        ]) : null
      ]));
    });

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;
    function step() {
      var first = track.firstElementChild;
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function pages() {
      var perView = Math.max(1, Math.round(track.clientWidth / step()));
      return Math.max(1, items.length - perView + 1);
    }
    function index() { return Math.round(track.scrollLeft / step()); }
    function render() {
      var n = pages(), i = Math.min(index(), n - 1);
      if (dots.children.length !== n) {
        dots.innerHTML = "";
        for (var k = 0; k < n; k++) {
          (function (k) {
            var d = el("button", { class: "dot", type: "button", "aria-label": "Έργο " + (k + 1) });
            d.addEventListener("click", function () { go(k); });
            dots.appendChild(d);
          })(k);
        }
      }
      Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      prev.hidden = next.hidden = n < 2;
      dots.hidden = n < 2 || n > 10; // many photos: arrows only, no row of dots
      if (counter) { counter.hidden = n <= 10; counter.textContent = (i + 1) + " / " + n; }
    }
    function go(i) {
      var n = pages();
      i = ((i % n) + n) % n;
      track.scrollTo({ left: i * step(), behavior: reduce ? "auto" : "smooth" });
      restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduce && pages() > 1) timer = setInterval(function () { go(index() + 1); }, 5000);
    }
    prev.addEventListener("click", function () { go(index() - 1); });
    next.addEventListener("click", function () { go(index() + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(index() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index() - 1); }
    });
    var t;
    track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(render, 80); });
    track.addEventListener("pointerdown", function () { if (timer) clearInterval(timer); });
    window.addEventListener("resize", render);
    render();
    restart();
  }

  /* ---------- products catalogue (data/products.json) ---------- */
  function buildProducts(items) {
    var cat = $("catalogue");
    if (!cat) return;
    var chips = $("chips"), q = $("q");
    var ALL = "Όλα";
    var only = (cat.getAttribute("data-categories") || "").split("|").filter(Boolean);
    items = (items || []).filter(function (p) { return !only.length || only.indexOf(p.category) >= 0; });
    var cats = [];
    items.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var active = ALL;

    function chip(name) {
      var b = el("button", { class: "chip", type: "button", "aria-pressed": name === active ? "true" : "false", text: name });
      b.addEventListener("click", function () { active = name; render(); });
      return b;
    }

    function card(p) {
      var tags = el("ul", { class: "tags" });
      (p.specs || []).forEach(function (s) {
        var txt = typeof s === "string" ? s : (s && s.spec) || "";
        if (txt) tags.appendChild(el("li", { text: txt }));
      });
      var media = p.image
        ? el("img", { class: "product-img", src: p.image, alt: p.name || "", loading: "lazy" })
        : el("div", { class: "product-img ph" }, [icon("i-window")]);
      var ask = el("a", { class: "btn btn-outline", href: "#epikoinonia", text: "Ζητήστε προσφορά" });
      ask.addEventListener("click", function () {
        var f = $("f-code");
        if (f) f.value = p.code || p.name || "";
      });
      return el("article", { class: "product" }, [
        media,
        el("div", { class: "product-body" }, [
          el("div", { class: "product-top" }, [
            el("span", { class: "code", text: p.code || "" }),
            el("span", { class: "cat", text: p.category || "" })
          ]),
          el("h3", { text: p.name || "" }),
          p.description ? el("p", { text: p.description }) : null,
          tags.children.length ? tags : null,
          ask
        ])
      ]);
    }

    function render() {
      if (chips) {
        chips.innerHTML = "";
        if (cats.length > 1) [ALL].concat(cats).forEach(function (c) { chips.appendChild(chip(c)); });
      }
      var term = q ? norm(q.value.trim()) : "";
      var list = items.filter(function (p) {
        if (active !== ALL && p.category !== active) return false;
        if (!term) return true;
        return norm([p.code, p.name, p.category, p.description].join(" ")).indexOf(term) >= 0;
      });
      cat.innerHTML = "";
      if (!list.length) {
        cat.appendChild(el("p", { class: "no-results", text: "Δεν βρέθηκε προϊόν. Γράψτε μας τι χρειάζεστε στη φόρμα ή καλέστε μας." }));
        return;
      }
      list.forEach(function (p) { cat.appendChild(card(p)); });
    }

    if (q) q.addEventListener("input", render);
    render();
  }

  /* ---------- menus: close dropdowns on outside click / link click ---------- */
  document.addEventListener("click", function (e) {
    document.querySelectorAll("details.dd[open], details.mnav[open]").forEach(function (d) {
      if (!d.contains(e.target) || e.target.closest("a")) d.removeAttribute("open");
    });
  });

  /* ---------- analytics (GA4, only after consent) ---------- */
  // Set "ga4_id" (e.g. G-XXXXXXX) in data/site.json to turn it on.
  var CONSENT_KEY = "mk-consent";
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }
  function loadGA(id) {
    if (!id || window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
  }
  function setupAnalytics(site) {
    var id = site && site.ga4_id;
    if (!id) return;
    var c = getConsent();
    if (c === "yes") { loadGA(id); return; }
    if (c === "no") return;
    var box = el("div", { class: "consent", role: "dialog", "aria-label": "Cookies" });
    box.innerHTML = '<p>Χρησιμοποιούμε cookies στατιστικών (Google Analytics) για να δούμε πώς χρησιμοποιείται το σάιτ. Τα αποδέχεστε;</p>' +
      '<div class="row"><button type="button" class="no">Όχι</button><button type="button" class="ok">Αποδοχή</button></div>';
    document.body.appendChild(box);
    box.querySelector(".ok").addEventListener("click", function () { setConsent("yes"); box.remove(); loadGA(id); });
    box.querySelector(".no").addEventListener("click", function () { setConsent("no"); box.remove(); });
  }
  // Count calls, Viber, WhatsApp and e-mail clicks as events.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) track("click_call", { number: h.slice(4), page: location.pathname });
    else if (h.indexOf("viber:") === 0) track("click_viber", { page: location.pathname });
    else if (h.indexOf("https://wa.me/") === 0) track("click_whatsapp", { page: location.pathname });
    else if (h.indexOf("mailto:") === 0) track("click_email", { page: location.pathname });
  });

  // Netlify Forms needs "form-name" in the posted data; Netlify strips the hidden
  // input from the served HTML, so add it here.
  function formBody(f) {
    var p = new URLSearchParams(new FormData(f));
    if (!p.get("form-name")) p.set("form-name", f.getAttribute("name") || "prosfora");
    return p.toString();
  }

  /* ---------- quote form (Netlify Forms) ---------- */
  var form = $("quote-form");
  var status = $("form-status");
  if (form) {
    if (form.elements.page) form.elements.page.value = location.pathname;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "Αποστολή…";
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody(form)
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        track("generate_lead", { form: "prosfora", page: location.pathname });
        form.reset();
        if (form.elements.page) form.elements.page.value = location.pathname;
        status.className = "form-status ok";
        status.textContent = "Το αίτημα στάλθηκε. Θα σας καλέσουμε σύντομα.";
      }).catch(function () {
        status.className = "form-status err";
        status.textContent = "Η αποστολή δεν ολοκληρώθηκε. Καλέστε μας στο 6948629979.";
      });
    });
  }

  if ($("year")) $("year").textContent = new Date().getFullYear();
  getJSON("site.json").then(function (site) { applySite(site); setupAnalytics(site); }).catch(function () {});

  if ($("track")) {
    // Photos uploaded from /admin come from /api/erga; until the first upload the samples in data/gallery.json are shown.
    fetch("/api/erga", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { if (!d.items || !d.items.length) throw new Error("empty"); return d.items; })
      .catch(function () { return getJSON("gallery.json").then(function (d) { return d.items; }); })
      .then(buildCarousel)
      .catch(function () { buildCarousel([]); });
  }
  if ($("catalogue")) {
    getJSON("products.json").then(function (d) { buildProducts(d.items); }).catch(function () { buildProducts([]); });
  }
})();
