# Μήτσκας Κουφώματα — mitskas-koufomata.gr

Στατικό σάιτ (HTML/CSS/JS) στο Netlify, με μικρό admin για τις φωτογραφίες των έργων.

## Δομή

| Φάκελος / αρχείο | Τι κάνει |
|---|---|
| `public/index.html`, `public/assets/` | Το σάιτ (στυλ του παλιού Lovable σάιτ) |
| `public/data/products.json` | Προϊόντα και κωδικοί |
| `public/data/site.json` | Τηλέφωνα, email, διεύθυνση, ωράριο |
| `public/data/gallery.json` | Φωτογραφίες δείγματος για «Τα Έργα Μας», μέχρι να ανέβει η πρώτη από το admin |
| `public/admin/` | Admin με κωδικό: ανέβασμα, τίτλος, σειρά και διαγραφή φωτογραφιών έργων |
| `netlify/functions/` | `/api/login`, `/api/erga`, `/api/img/:id` |
| `netlify/lib/` | Κοινός κώδικας (κωδικός, αποθήκευση φωτογραφιών σε Netlify Blobs) |
| `public/sitemap.xml`, `public/robots.txt` | Για το Google |

## Admin

- Διεύθυνση: `https://mitskas-koufomata.gr/admin`
- Κωδικός: η μεταβλητή `ADMIN_PASSWORD` στο Netlify (Site configuration → Environment variables). Τουλάχιστον 6 χαρακτήρες. Αν την αλλάξεις, κάνε Redeploy και όλοι αποσυνδέονται.
- Οι φωτογραφίες μικραίνουν αυτόματα στο κινητό/υπολογιστή (έως 1920 px) πριν ανέβουν.
- Μόλις ανέβει η πρώτη φωτογραφία, το καρουζέλ δείχνει μόνο τις δικές σου.

## Ανέβασμα (μία φορά)

1. Κώδικας στο GitHub: `Stathismi/aluminia-second-attempt-`, branch `main`.
2. Netlify → Add new site → Import from GitHub → αυτό το repo. Οι ρυθμίσεις διαβάζονται από το `netlify.toml` (publish `public`, functions `netlify/functions`).
3. Environment variables → `ADMIN_PASSWORD` = ο κωδικός του admin → Redeploy.
4. Forms → Enable form detection (για τη φόρμα προσφοράς) → Form notifications → email.
5. Domain management → Add domain `mitskas-koufomata.gr` (+ `www`).
6. Papaki → DNS του mitskas-koufomata.gr:
   - **A** `@` → `75.2.60.5` (σβήνεις άλλες A/AAAA του `@`)
   - **CNAME** `www` → `<όνομα-site>.netlify.app`
   - Το HTTPS βγαίνει μόνο του μετά τη διάδοση DNS.
7. Google Search Console → Add property → Domain `mitskas-koufomata.gr` → εγγραφή **TXT** στο Papaki → Verify → Sitemaps → `sitemap.xml`.
8. (Προτείνεται) Google Business Profile για να βγαίνει η επιχείρηση στους Χάρτες.

Η λήξη του domain είναι 08/01/2028 (Papaki).

## Σελίδες υπηρεσιών και περιοχών (SEO)

Τα κείμενα είναι στο `tools/content.py`. Μετά από κάθε αλλαγή:

```
python3 tools/build.py
```

Φτιάχνει τις σελίδες `public/<slug>/index.html`, ανανεώνει το κοινό header/footer και τα blocks της αρχικής (ανάμεσα σε `<!--@όνομα-->` και `<!--/@όνομα-->`) και γράφει το `public/sitemap.xml`.
