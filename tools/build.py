# -*- coding: utf-8 -*-
"""Builds the service and area pages and the shared header/footer.

    python3 tools/build.py

- Writes public/<slug>/index.html for every service and area in tools/content.py
- Refreshes the shared blocks inside public/index.html (between <!--@name--> and <!--/@name-->)
- Writes public/sitemap.xml
"""
import html
import json
import os
import re
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from content import SITE, SERVICES, AREAS, AREA_FAQ, HOME_FAQ  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
PHONE_MOBILE = "6948629979"
PHONE_FIXED = "2381089377"
PHONE_MOBILE2 = "6983159095"
NAME1 = "Στάθης"
NAME2 = "Δημήτρης"
EMAIL = "alu.mitskas@gmail.com"
ADDRESS = "Κενέντυ 6, Σκύδρα 58500"
MAPS = "https://www.google.com/maps/search/?api=1&query=%CE%9A%CE%B5%CE%BD%CE%AD%CE%BD%CF%84%CF%85+6+%CE%A3%CE%BA%CF%8D%CE%B4%CF%81%CE%B1+58500"
BUSINESS_ID = SITE + "/#business"

e = html.escape


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=2) + "\n</script>"


# ---------------------------------------------------------------- shared blocks
SPRITE = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
  <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></symbol>
  <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></symbol>
  <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
  <symbol id="i-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
  <symbol id="i-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  <symbol id="i-window" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></symbol>
</svg>"""


def service_links(cls=""):
    return "".join(f'<a{cls} href="/{s["slug"]}/">{e(s["name"])}</a>' for s in SERVICES)


def area_links(cls=""):
    return "".join(f'<a{cls} href="/{a["slug"]}/">Κουφώματα {e(a["town"])}</a>' for a in AREAS)


def header():
    return f"""<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Μήτσκας Κουφώματα, αρχική σελίδα">
      <span class="brand-mark">M</span>
      <span class="brand-text"><strong>ΜΗΤΣΚΑΣ</strong><span>ΚΟΥΦΩΜΑΤΑ · ΑΠΟ ΤΟ 1976</span></span>
    </a>
    <nav class="nav" aria-label="Κύριο μενού">
      <details class="dd">
        <summary>Υπηρεσίες<svg class="i"><use href="#i-down"/></svg></summary>
        <div class="dd-panel">{service_links()}</div>
      </details>
      <a href="/#erga">Έργα</a>
      <a href="/#proionta">Κωδικοί</a>
      <a href="/#perioxes">Περιοχές</a>
      <a href="/#epikoinonia">Επικοινωνία</a>
    </nav>
    <div class="header-actions">
      <a class="btn btn-outline" data-tel="mobile" href="tel:+30{PHONE_MOBILE}"><svg class="i"><use href="#i-phone"/></svg><span data-site="mobile">{PHONE_MOBILE}</span></a>
      <a class="btn btn-red call-btn" data-tel="mobile" href="tel:+30{PHONE_MOBILE}" aria-label="Καλέστε μας"><svg class="i"><use href="#i-phone"/></svg><span class="lbl">Καλέστε Μας</span></a>
      <details class="mnav">
        <summary aria-label="Μενού"><svg class="i"><use href="#i-menu"/></svg></summary>
        <div class="mnav-panel">
          <p class="mnav-title">Υπηρεσίες</p>
          {service_links()}
          <p class="mnav-title">Σελίδα</p>
          <a href="/#erga">Έργα</a><a href="/#proionta">Κωδικοί προϊόντων</a><a href="/#perioxes">Περιοχές</a><a href="/#epikoinonia">Επικοινωνία</a>
        </div>
      </details>
    </div>
  </div>
</header>"""


def footer():
    return f"""<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" href="/"><span class="brand-mark">M</span><span class="brand-text"><strong>ΜΗΤΣΚΑΣ</strong><span>ΚΟΥΦΩΜΑΤΑ · ΑΠΟ ΤΟ 1976</span></span></a>
        <p>Κουφώματα αλουμινίου και PVC, θωρακισμένες και εσωτερικές πόρτες, γκαραζόπορτες, κάγκελα, σίτες, ρολά και επισκευές στην Πέλλα από το 1976. Επίσημοι συνεργάτες EXALCO &amp; ALUMINCO.</p>
        <p class="signature">Μήτσκας · από το 1976</p>
      </div>
      <div>
        <h4>Υπηρεσίες</h4>
        <ul>{"".join(f'<li><a href="/{s["slug"]}/">{e(s["name"])}</a></li>' for s in SERVICES)}</ul>
      </div>
      <div>
        <h4>Περιοχές</h4>
        <ul>{"".join(f'<li><a href="/{a["slug"]}/">Κουφώματα {e(a["town"])}</a></li>' for a in AREAS)}</ul>
      </div>
      <div>
        <h4>Επικοινωνία</h4>
        <ul>
          <li><svg class="i"><use href="#i-phone"/></svg><a data-tel="mobile" href="tel:+30{PHONE_MOBILE}">{NAME1} <span data-site="mobile">{PHONE_MOBILE}</span></a></li>
          <li><svg class="i"><use href="#i-phone"/></svg><a data-tel="mobile2" href="tel:+30{PHONE_MOBILE2}">{NAME2} <span data-site="mobile2">{PHONE_MOBILE2}</span></a></li>
          <li><svg class="i"><use href="#i-phone"/></svg><a data-tel="phone" href="tel:+30{PHONE_FIXED}">Σταθερό <span data-site="phone">{PHONE_FIXED}</span></a></li>
          <li><svg class="i"><use href="#i-mail"/></svg><a data-mail="email" href="mailto:{EMAIL}"><span data-site="email">{EMAIL}</span></a></li>
          <li><svg class="i"><use href="#i-pin"/></svg><a href="{MAPS}" target="_blank" rel="noopener"><span data-site="address">{e(ADDRESS)}</span></a></li>
        </ul>
      </div>
    </div>
    <p class="copy">© <span id="year">2026</span> Μήτσκας Κουφώματα · Από το 1976. Με επιφύλαξη παντός δικαιώματος.</p>
  </div>
</footer>"""


def head(title, description, path, image="/images/site/hero.webp", extra_ld=()):
    url = SITE + path
    blocks = "\n".join(ld(x) for x in extra_ld)
    return f"""<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:image" content="{SITE}{image}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="el_GR">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;900&display=swap">
<link rel="stylesheet" href="/assets/style.css">
{blocks}
</head>
<body>
"""


def faq_section(faq, title="Συχνές ερωτήσεις"):
    items = "".join(
        f'<details class="faq-item"><summary>{e(q)}<svg class="i"><use href="#i-down"/></svg></summary><p>{e(a)}</p></details>'
        for q, a in faq
    )
    return f"""<section class="section alt" id="erotiseis" aria-labelledby="faq-title">
    <div class="wrap narrow">
      <div class="section-head"><span class="kicker">Ερωτήσεις</span><h2 id="faq-title">{e(title)}</h2></div>
      <div class="faq">{items}</div>
    </div>
  </section>"""


def faq_ld(faq):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq
        ],
    }


def breadcrumb_ld(name, path):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Αρχική", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": name, "item": SITE + path},
        ],
    }


def contact_section():
    return f"""<section class="section" id="epikoinonia" aria-labelledby="contact-title">
    <div class="wrap">
      <div class="section-head">
        <span class="kicker">Επικοινωνία</span>
        <h2 id="contact-title">Ζητήστε μέτρηση και προσφορά</h2>
        <p>Καλέστε μας ή στείλτε μας τη φόρμα και σας καλούμε εμείς.</p>
      </div>
      <div class="call-row">
        <a class="btn btn-red btn-lg" data-tel="mobile" href="tel:+30{PHONE_MOBILE}"><svg class="i"><use href="#i-phone"/></svg><span class="who">{NAME1}</span><span data-site="mobile">{PHONE_MOBILE}</span></a>
        <a class="btn btn-red btn-lg" data-tel="mobile2" href="tel:+30{PHONE_MOBILE2}"><svg class="i"><use href="#i-phone"/></svg><span class="who">{NAME2}</span><span data-site="mobile2">{PHONE_MOBILE2}</span></a>
        <a class="btn btn-outline btn-lg" data-tel="phone" href="tel:+30{PHONE_FIXED}"><svg class="i"><use href="#i-phone"/></svg><span class="who">Σταθερό</span><span data-site="phone">{PHONE_FIXED}</span></a>
      </div>
      <div class="contact-grid">
        <form class="panel" name="prosfora" method="POST" data-netlify="true" netlify-honeypot="bot-field" id="quote-form">
          <input type="hidden" name="form-name" value="prosfora">
          <input type="hidden" name="page" value="">
          <p class="hp"><label>Μην το συμπληρώσετε <input name="bot-field" id="bot-field"></label></p>
          <h3>Ζητήστε προσφορά</h3>
          <p class="sub">Γράψτε μας τι χρειάζεστε και σας καλούμε εμείς.</p>
          <div class="row">
            <label for="f-name">Ονοματεπώνυμο<input id="f-name" name="name" required autocomplete="name"></label>
            <label for="f-phone">Τηλέφωνο<input id="f-phone" name="phone" type="tel" required autocomplete="tel"></label>
          </div>
          <div class="row">
            <label for="f-code">Κωδικός προϊόντος<input id="f-code" name="product_code" placeholder="π.χ. MK-SR-01"></label>
            <label for="f-area">Περιοχή<input id="f-area" name="area" placeholder="π.χ. Έδεσσα"></label>
          </div>
          <label for="f-msg">Μήνυμα<textarea id="f-msg" name="message" placeholder="Πόσα ανοίγματα, περίπου διαστάσεις, χρώμα…"></textarea></label>
          <button class="btn btn-red" type="submit">Αποστολή αιτήματος</button>
          <p class="form-status" id="form-status" role="status"></p>
        </form>
        <div class="info-stack">
          <div class="info"><span class="info-icon"><svg class="i"><use href="#i-pin"/></svg></span><div><h3>Εργαστήριο</h3><a href="{MAPS}" target="_blank" rel="noopener"><span data-site="address">{e(ADDRESS)}</span></a></div></div>
          <div class="info"><span class="info-icon"><svg class="i"><use href="#i-clock"/></svg></span><div><h3>Ωράριο</h3><p data-site="hours_weekdays">Δευ - Παρ: 08:00 - 21:00</p><p data-site="hours_saturday">Σάβ: 09:00 - 19:00</p></div></div>
          <div class="info"><span class="info-icon"><svg class="i"><use href="#i-mail"/></svg></span><div><h3>Email</h3><a data-mail="email" href="mailto:{EMAIL}"><span data-site="email">{EMAIL}</span></a></div></div>
        </div>
      </div>
    </div>
  </section>"""


def render_sections(sections):
    out = []
    for h2, parts in sections:
        out.append(f"<h2>{e(h2)}</h2>")
        for p in parts:
            if isinstance(p, tuple) and p[0] == "ul":
                out.append("<ul>" + "".join(f"<li>{e(x)}</li>" for x in p[1]) + "</ul>")
            else:
                out.append(f"<p>{p}</p>")  # paragraphs may contain trusted <a> links
    return "\n        ".join(out)


def side_card():
    return f"""<aside class="side-card" aria-label="Επικοινωνία">
          <p class="side-since">Από το 1976</p>
          <h3>Ζητήστε μέτρηση</h3>
          <p>Ερχόμαστε, παίρνουμε μέτρα και σας δίνουμε γραπτή προσφορά.</p>
          <a class="btn btn-red" data-tel="mobile" href="tel:+30{PHONE_MOBILE}"><svg class="i"><use href="#i-phone"/></svg><span class="who">{NAME1}</span><span data-site="mobile">{PHONE_MOBILE}</span></a>
          <a class="btn btn-red" data-tel="mobile2" href="tel:+30{PHONE_MOBILE2}"><svg class="i"><use href="#i-phone"/></svg><span class="who">{NAME2}</span><span data-site="mobile2">{PHONE_MOBILE2}</span></a>
          <a class="btn btn-outline" data-tel="phone" href="tel:+30{PHONE_FIXED}"><svg class="i"><use href="#i-phone"/></svg><span class="who">Σταθερό</span><span data-site="phone">{PHONE_FIXED}</span></a>
          <a class="side-link" href="#epikoinonia">ή στείλτε τη φόρμα</a>
          <p class="side-addr"><svg class="i"><use href="#i-pin"/></svg><span data-site="address">{e(ADDRESS)}</span></p>
        </aside>"""


def works_section(match=None, town=None, alt=False):
    attr = f' data-match="{e("|".join(match))}"' if match else ""
    title = f"Έργα μας {e(town)}" if town else "Τα Έργα Μας"
    cls = "section alt" if alt else "section"
    return f"""<section class="{cls}" id="erga" aria-labelledby="works-title">
    <div class="wrap">
      <div class="section-head"><span class="kicker">Portfolio</span><h2 id="works-title">{title}</h2></div>
      <div class="carousel" aria-roledescription="carousel" aria-label="Έργα">
        <div class="track" id="track" tabindex="0"{attr}></div>
        <div class="carousel-nav">
          <button class="round-btn" id="prev" type="button" aria-label="Προηγούμενα έργα"><svg class="i"><use href="#i-left"/></svg></button>
          <div class="dots" id="dots" role="group" aria-label="Σελίδες έργων"></div>
          <button class="round-btn" id="next" type="button" aria-label="Επόμενα έργα"><svg class="i"><use href="#i-right"/></svg></button>
        </div>
      </div>
    </div>
  </section>"""


def catalogue_section(categories, name):
    return f"""<section class="section" id="proionta" aria-labelledby="products-title">
    <div class="wrap">
      <div class="section-head"><span class="kicker">Κωδικοί</span><h2 id="products-title">{e(name)}: προϊόντα και κωδικοί</h2>
        <p>Πείτε μας τον κωδικό στο τηλέφωνο ή στη φόρμα και ξέρουμε αμέσως τι χρειάζεστε.</p></div>
      <div class="toolbar">
        <div class="chips" id="chips" role="group" aria-label="Κατηγορίες"></div>
      </div>
      <div class="catalogue" id="catalogue" data-categories="{e("|".join(categories))}"></div>
    </div>
  </section>"""


def links_section(current):
    s = "".join(f'<a class="pill{" on" if x["slug"] == current else ""}" href="/{x["slug"]}/">{e(x["name"])}</a>' for x in SERVICES)
    a = "".join(f'<a class="pill{" on" if x["slug"] == current else ""}" href="/{x["slug"]}/">{e(x["town"])}</a>' for x in AREAS)
    return f"""<section class="section links-band">
    <div class="wrap">
      <div class="links-group"><h2>Όλες οι υπηρεσίες</h2><div class="pills">{s}</div></div>
      <div class="links-group"><h2>Περιοχές που εξυπηρετούμε</h2><div class="pills">{a}</div></div>
    </div>
  </section>"""


def page(title, description, path, h1, lead, image, crumb, body, extra_ld):
    hero = f"""<section class="page-hero" aria-labelledby="page-title">
    <img class="hero-bg" src="{image}" alt="" fetchpriority="high">
    <div class="wrap">
      <nav class="crumbs" aria-label="Διαδρομή"><a href="/">Αρχική</a><span aria-hidden="true">/</span><span>{e(crumb)}</span></nav>
      <div class="hero-tags"><span class="since">Από το 1976</span><span class="badge">Συνεργάτες EXALCO &amp; ALUMINCO</span></div>
      <h1 id="page-title">{e(h1)}</h1>
      <p class="hero-lead">{e(lead)}</p>
      <div class="hero-actions">
        <a class="btn btn-red btn-lg" data-tel="mobile" href="tel:+30{PHONE_MOBILE}"><svg class="i"><use href="#i-phone"/></svg>Καλέστε Τώρα</a>
        <a class="btn btn-ghost-light btn-lg" href="#epikoinonia">Ζητήστε προσφορά</a>
      </div>
    </div>
  </section>"""
    return (
        head(title, description, path, image, extra_ld)
        + SPRITE + "\n\n" + header() + "\n\n<main id=\"top\">\n  " + hero + "\n  " + body + "\n</main>\n\n"
        + footer() + '\n\n<script src="/assets/app.js"></script>\n</body>\n</html>\n'
    )


def service_page(s):
    path = f'/{s["slug"]}/'
    area_names = [a["town"] for a in AREAS]
    service_ld = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": s["name"],
        "serviceType": s["name"],
        "description": s["description"],
        "url": SITE + path,
        "provider": {"@id": BUSINESS_ID},
        "areaServed": [{"@type": "City", "name": n} for n in area_names],
    }
    body = f"""<section class="section">
    <div class="wrap page-grid">
      <article class="prose">
        {render_sections(s["sections"])}
      </article>
      {side_card()}
    </div>
  </section>
  {works_section(alt=True)}
  {catalogue_section(s["categories"], s["name"]) if s["categories"] else ""}
  {faq_section(s["faq"])}
  {links_section(s["slug"])}
  {contact_section()}"""
    return page(s["title"], s["description"], path, s["h1"], s["lead"], s["image"], s["name"], body,
                [breadcrumb_ld(s["name"], path), service_ld, faq_ld(s["faq"])])


def area_page(a):
    path = f'/{a["slug"]}/'
    faq = [(q.format(**a), ans.format(**a)) for q, ans in AREA_FAQ]
    services_list = "".join(
        f'<li><a href="/{s["slug"]}/">{e(s["name"])}</a> {e(a["in_town"])}</li>' for s in SERVICES
    )
    paras = "".join(f"<p>{e(p)}</p>" for p in a["paragraphs"])
    body = f"""<section class="section">
    <div class="wrap page-grid">
      <article class="prose">
        <h2>Κουφώματα και πόρτες {e(a["in_town"])}</h2>
        {paras}
        <h2>Τι αναλαμβάνουμε {e(a["in_town"])}</h2>
        <ul>{services_list}</ul>
        <h2>Πώς δουλεύουμε</h2>
        <ol>
          <li><strong>Μέτρηση στο χώρο:</strong> ερχόμαστε {e(a["in_town"])} και παίρνουμε μέτρα σε κάθε άνοιγμα.</li>
          <li><strong>Γραπτή προσφορά:</strong> για κάθε άνοιγμα, με σύστημα, τζάμι και χρώμα.</li>
          <li><strong>Κατασκευή:</strong> στο εργαστήριό μας στη Σκύδρα.</li>
          <li><strong>Τοποθέτηση:</strong> από το δικό μας συνεργείο, με στεγάνωση και ρύθμιση.</li>
        </ol>
      </article>
      {side_card()}
    </div>
  </section>
  {works_section(a["match"], a["in_town"], alt=True)}
  {faq_section(faq)}
  {links_section(a["slug"])}
  {contact_section()}"""
    service_ld = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": f'Κουφώματα αλουμινίου και PVC {a["in_town"]}',
        "serviceType": "Κουφώματα αλουμινίου",
        "description": a["description"],
        "url": SITE + path,
        "provider": {"@id": BUSINESS_ID},
        "areaServed": {"@type": "City", "name": a["town"]},
    }
    return page(a["title"], a["description"], path, a["h1"], a["lead"], "/images/site/hero.webp",
                f'Κουφώματα {a["town"]}', body, [breadcrumb_ld(f'Κουφώματα {a["town"]}', path), service_ld, faq_ld(faq)])


# ---------------------------------------------------------------- homepage blocks
def home_blocks():
    more = "".join(
        f'<a class="svc-link" href="/{s["slug"]}/"><strong>{e(s["name"])}</strong><span>Δείτε περισσότερα</span></a>'
        for s in SERVICES
    )
    areas = "".join(f'<a class="pill" href="/{a["slug"]}/">Κουφώματα {e(a["town"])}</a>' for a in AREAS)
    return {
        "sprite": SPRITE,
        "header": header(),
        "footer": footer(),
        "more-services": f'<div class="svc-grid">{more}</div>',
        "areas": f"""<section class="section links-band" id="perioxes" aria-labelledby="areas-title">
    <div class="wrap">
      <div class="section-head"><span class="kicker">Περιοχές</span><h2 id="areas-title">Περιοχές που εξυπηρετούμε</h2>
        <p>Από το εργαστήριό μας στη Σκύδρα τοποθετούμε σε όλη την Πέλλα και σε γειτονικές περιοχές της Κεντρικής Μακεδονίας.</p></div>
      <div class="pills center">{areas}</div>
    </div>
  </section>""",
        "faq": faq_section(HOME_FAQ),
        "faq-ld": ld(faq_ld(HOME_FAQ)),
    }


def replace_block(text, name, content):
    pat = re.compile(r"(<!--@" + re.escape(name) + r"-->).*?(<!--/@" + re.escape(name) + r"-->)", re.S)
    if not pat.search(text):
        raise SystemExit(f"marker {name} missing in index.html")
    return pat.sub(lambda m: m.group(1) + "\n" + content + "\n" + m.group(2), text)


def main():
    pages = ["/"]
    for s in SERVICES:
        d = os.path.join(ROOT, s["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(service_page(s))
        pages.append(f'/{s["slug"]}/')
    for a in AREAS:
        d = os.path.join(ROOT, a["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(area_page(a))
        pages.append(f'/{a["slug"]}/')

    idx = os.path.join(ROOT, "index.html")
    text = open(idx, encoding="utf-8").read()
    for name, content in home_blocks().items():
        text = replace_block(text, name, content)
    open(idx, "w", encoding="utf-8").write(text)

    today = date.today().isoformat()
    urls = "".join(
        f"  <url>\n    <loc>{SITE}{p}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>{'1.0' if p == '/' else '0.8'}</priority>\n  </url>\n"
        for p in pages
    )
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n"
    )
    print(f"built {len(pages) - 1} pages + homepage blocks + sitemap ({len(pages)} urls)")


if __name__ == "__main__":
    main()
