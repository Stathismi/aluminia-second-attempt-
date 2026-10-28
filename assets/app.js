(function () {
  "use strict";

  var DATA = "data/";

  function getJSON(name) {
    return fetch(DATA + name + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) {
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

  function telHref(v) { return "tel:" + String(v || "").replace(/[^\d+]/g, ""); }

  /* ---------- site details ---------- */
  function applySite(site) {
    document.querySelectorAll("[data-site]").forEach(function (n) {
      var v = site[n.getAttribute("data-site")];
      if (v) n.textContent = v;
    });
    document.querySelectorAll("[data-site-tel]").forEach(function (n) {
      var v = site[n.getAttribute("data-site-tel")];
      if (v) n.setAttribute("href", telHref(v)); else n.closest("div, a").hidden = true;
    });
    document.querySelectorAll("[data-site-mail]").forEach(function (n) {
      var v = site[n.getAttribute("data-site-mail")];
      if (v) n.setAttribute("href", "mailto:" + v);
    });
    document.querySelectorAll("[data-site-href]").forEach(function (n) {
      var v = site[n.getAttribute("data-site-href")];
      if (v) n.setAttribute("href", v); else n.hidden = true;
    });
  }

  /* ---------- carousel ---------- */
  function buildCarousel(items) {
    var slides = document.getElementById("slides");
    var dots = document.getElementById("dots");
    var counter = document.getElementById("counter");
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    items = (items || []).filter(function (i) { return i && i.image; });

    slides.innerHTML = "";
    dots.innerHTML = "";
    if (!items.length) {
      slides.appendChild(el("div", { class: "empty-gallery" }, [
        el("strong", { text: "Οι δουλειές μας" }),
        el("span", { text: "Σύντομα εδώ φωτογραφίες από τα έργα μας." })
      ]));
      prev.hidden = next.hidden = true;
      return;
    }

    items.forEach(function (it, i) {
      var cap = el("figcaption", {}, [
        el("strong", { text: it.title || "Έργο" }),
        el("span", { text: [it.location, it.date].filter(Boolean).join(", ") })
      ]);
      slides.appendChild(el("figure", { class: "slide", "aria-label": (i + 1) + " από " + items.length }, [
        el("img", { src: it.image, alt: it.title || "Έργο κουφωμάτων", loading: i ? "lazy" : "eager" }),
        cap
      ]));
      var d = el("button", { class: "dot", type: "button", "aria-label": "Φωτογραφία " + (i + 1) });
      d.addEventListener("click", function () { go(i); });
      dots.appendChild(d);
    });

    var current = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function mark(i) {
      current = i;
      Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      counter.textContent = (i + 1) + " / " + items.length;
    }
    function go(i) {
      i = (i + items.length) % items.length;
      slides.scrollTo({ left: slides.clientWidth * i, behavior: reduce ? "auto" : "smooth" });
      mark(i);
      restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduce && items.length > 1) timer = setInterval(function () { go(current + 1); }, 6000);
    }
    prev.addEventListener("click", function () { go(current - 1); });
    next.addEventListener("click", function () { go(current + 1); });
    slides.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    });
    var t;
    slides.addEventListener("scroll", function () {
      clearTimeout(t);
      t = setTimeout(function () { mark(Math.round(slides.scrollLeft / slides.clientWidth)); }, 80);
    });
    slides.addEventListener("pointerdown", function () { if (timer) clearInterval(timer); });
    prev.hidden = next.hidden = items.length < 2;
    mark(0);
    restart();
  }

  /* ---------- products ---------- */
  function buildProducts(items) {
    var chips = document.getElementById("chips");
    var cat = document.getElementById("catalogue");
    var q = document.getElementById("q");
    items = items || [];
    var cats = [];
    items.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var active = "Όλα";

    function chip(name) {
      var b = el("button", { class: "chip", type: "button", "aria-pressed": name === active ? "true" : "false", text: name });
      b.addEventListener("click", function () { active = name; render(); });
      return b;
    }

    function card(p) {
      var specs = el("ul", { class: "specs" });
      (p.specs || []).forEach(function (s) { if (s) specs.appendChild(el("li", { text: typeof s === "string" ? s : (s.spec || "") })); });
      var ask = el("a", { class: "btn btn-ghost", href: "#epikoinonia", text: "Προσφορά για " + (p.code || "αυτό") });
      ask.addEventListener("click", function () {
        var f = document.getElementById("f-code");
        if (f) f.value = p.code || p.name || "";
      });
      return el("article", { class: "product" }, [
        p.image ? el("img", { class: "product-img", src: p.image, alt: p.name || "", loading: "lazy" }) : null,
        el("div", { class: "product-body" }, [
          el("div", { class: "product-top" }, [
            el("span", { class: "code", text: p.code || "" }),
            el("span", { class: "cat", text: p.category || "" })
          ]),
          el("h3", { text: p.name || "" }),
          p.description ? el("p", { text: p.description }) : null,
          specs.children.length ? specs : null
        ]),
        el("div", { class: "product-foot" }, [ask])
      ]);
    }

    function render() {
      chips.innerHTML = "";
      ["Όλα"].concat(cats).forEach(function (c) { chips.appendChild(chip(c)); });
      var term = (q.value || "").trim().toLowerCase();
      var list = items.filter(function (p) {
        if (active !== "Όλα" && p.category !== active) return false;
        if (!term) return true;
        return [p.code, p.name, p.category, p.description].join(" ").toLowerCase().indexOf(term) >= 0;
      });
      cat.innerHTML = "";
      if (!list.length) {
        cat.appendChild(el("p", { class: "no-results", text: "Δεν βρέθηκε προϊόν με αυτόν τον κωδικό. Γράψτε μας τι χρειάζεστε στη φόρμα." }));
        return;
      }
      list.forEach(function (p) { cat.appendChild(card(p)); });
    }

    q.addEventListener("input", render);
    render();
  }

  /* ---------- quote form (Netlify Forms) ---------- */
  function setupForm() {
    var form = document.getElementById("quote-form");
    var status = document.getElementById("form-status");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "Αποστολή…";
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          status.className = "form-status ok";
          status.textContent = "Το αίτημα στάλθηκε. Θα σας καλέσουμε σύντομα.";
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Η αποστολή δεν ολοκληρώθηκε. Καλέστε μας στο τηλέφωνο που φαίνεται αριστερά.";
        });
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  setupForm();
  getJSON("site.json").then(applySite).catch(function () {});
  getJSON("gallery.json").then(function (d) { buildCarousel(d.items); }).catch(function () { buildCarousel([]); });
  getJSON("products.json").then(function (d) { buildProducts(d.items); }).catch(function () { buildProducts([]); });
})();
