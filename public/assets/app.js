(function () {
  "use strict";

  function getJSON(name) {
    return fetch("data/" + name + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) {
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

  /* ---------- projects carousel (data/gallery.json) ---------- */
  function buildCarousel(items) {
    var track = document.getElementById("track");
    var dots = document.getElementById("dots");
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    items = (items || []).filter(function (i) { return i && i.image; });
    track.innerHTML = "";
    dots.innerHTML = "";

    if (!items.length) {
      track.replaceWith(el("p", { class: "empty-works", text: "Σύντομα εδώ φωτογραφίες από τα έργα μας." }));
      prev.hidden = next.hidden = true;
      return;
    }

    items.forEach(function (it) {
      var meta = [it.location, it.date].filter(Boolean).join(", ");
      track.appendChild(el("figure", { class: "work" }, [
        el("img", { src: it.image, alt: it.title || "Έργο αλουμινίου", loading: "lazy" }),
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
      var hide = n < 2;
      prev.hidden = next.hidden = dots.hidden = hide;
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
  var setCategory = function () {};

  function buildProducts(items) {
    var chips = document.getElementById("chips");
    var cat = document.getElementById("catalogue");
    var q = document.getElementById("q");
    var ALL = "Όλα";
    items = items || [];
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
        var f = document.getElementById("f-code");
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
      chips.innerHTML = "";
      [ALL].concat(cats).forEach(function (c) { chips.appendChild(chip(c)); });
      var term = (q.value || "").trim().toLowerCase();
      var list = items.filter(function (p) {
        if (active !== ALL && p.category !== active) return false;
        if (!term) return true;
        return [p.code, p.name, p.category, p.description].join(" ").toLowerCase().indexOf(term) >= 0;
      });
      cat.innerHTML = "";
      if (!list.length) {
        cat.appendChild(el("p", { class: "no-results", text: "Δεν βρέθηκε προϊόν. Γράψτε μας τι χρειάζεστε στη φόρμα ή καλέστε μας." }));
        return;
      }
      list.forEach(function (p) { cat.appendChild(card(p)); });
    }

    setCategory = function (name) {
      active = cats.indexOf(name) >= 0 ? name : ALL;
      q.value = "";
      render();
    };
    q.addEventListener("input", render);
    render();
  }

  document.querySelectorAll("[data-filter]").forEach(function (a) {
    a.addEventListener("click", function () { setCategory(a.getAttribute("data-filter")); });
  });

  /* ---------- quote form (Netlify Forms) ---------- */
  var form = document.getElementById("quote-form");
  var status = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "Αποστολή…";
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.className = "form-status ok";
        status.textContent = "Το αίτημα στάλθηκε. Θα σας καλέσουμε σύντομα.";
      }).catch(function () {
        status.className = "form-status err";
        status.textContent = "Η αποστολή δεν ολοκληρώθηκε. Καλέστε μας στο 6948629979.";
      });
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  getJSON("site.json").then(applySite).catch(function () {});
  // Photos uploaded from /admin come from /api/erga. Until the first upload, the sample photos in data/gallery.json are shown.
  fetch("/api/erga", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { if (!d.items || !d.items.length) throw new Error("empty"); return d.items; })
    .catch(function () { return getJSON("gallery.json").then(function (d) { return d.items; }); })
    .then(buildCarousel)
    .catch(function () { buildCarousel([]); });
  getJSON("products.json").then(function (d) { buildProducts(d.items); }).catch(function () { buildProducts([]); });
})();
