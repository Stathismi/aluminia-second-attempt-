# Μήτσκας Κουφώματα — mitskas-koufomata.gr

Στατικό σάιτ (HTML/CSS/JS, χωρίς build) με σελίδα διαχείρισης στο `/admin`.

## Τι υπάρχει

| Αρχείο | Τι κάνει |
|---|---|
| `index.html` | Η σελίδα: καρουζέλ έργων, προϊόντα με κωδικούς, διαδικασία, φόρμα προσφοράς |
| `assets/style.css`, `assets/app.js` | Εμφάνιση και λειτουργία |
| `data/gallery.json` | Φωτογραφίες του καρουζέλ «Οι δουλειές μας» |
| `data/products.json` | Προϊόντα: κωδικός, όνομα, κατηγορία, περιγραφή, χαρακτηριστικά, φωτογραφία |
| `data/site.json` | Τηλέφωνα, email, διεύθυνση, ωράριο |
| `admin/` | Decap CMS: εδώ μπαίνει ο admin και αλλάζει τα παραπάνω χωρίς κώδικα |
| `images/uploads/` | Οι φωτογραφίες που ανεβαίνουν από το admin |
| `images/samples/` | Δείγματα (σχέδια όψης) μέχρι να ανέβουν αληθινές φωτογραφίες |

Οι κωδικοί `MK-…` και τα χαρακτηριστικά των προϊόντων είναι παραδείγματα: αλλάζονται από το admin.

## Ανέβασμα (μία φορά)

1. **GitHub**: ο κώδικας μπαίνει στο repo `Stathismi/aluminia-second-attempt-` (branch `main`).
2. **Netlify** (δωρεάν): Sign up with GitHub → Add new site → Import an existing project → GitHub → επιλογή repo. Build command: κενό. Publish directory: `.` → Deploy.
3. **Φόρμα προσφοράς**: Netlify → Forms → Enable form detection → Redeploy. Στο Forms → Form notifications → Email notification προς το email της επιχείρησης.
4. **Login στο admin**:
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
     - Homepage URL: `https://mitskas-koufomata.gr`
     - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Αντιγραφή Client ID και δημιουργία Client secret.
   - Netlify → Site configuration → Access & security → OAuth → Install provider → GitHub → επικόλληση Client ID και Secret.
   - Μπαίνεις στο `https://mitskas-koufomata.gr/admin` → Login with GitHub. Μπορεί να κάνει αλλαγές όποιος έχει δικαίωμα εγγραφής στο repo (για δεύτερο admin: GitHub repo → Settings → Collaborators).
5. **Domain (Papaki)**:
   - Netlify → Domain management → Add a domain → `mitskas-koufomata.gr` (και το `www`).
   - Papaki → Τα domain μου → mitskas-koufomata.gr → Διαχείριση DNS:
     - Εγγραφή **A** για `@` (κενό host) → `75.2.60.5` (σβήνεις όποια άλλη A/AAAA υπάρχει για το `@`)
     - Εγγραφή **CNAME** για `www` → `<όνομα-site>.netlify.app`
   - Σε λίγα λεπτά έως λίγες ώρες το Netlify βγάζει μόνο του πιστοποιητικό HTTPS.

## Καθημερινή χρήση (admin)

`mitskas-koufomata.gr/admin` → «Οι δουλειές μας (καρουζέλ)» → Φωτογραφίες → Προσθήκη φωτογραφία → ανέβασμα → τίτλος, περιοχή → **Publish**. Σε 1–2 λεπτά εμφανίζεται στο σάιτ. Το ίδιο για προϊόντα/κωδικούς και στοιχεία επικοινωνίας.

Η λήξη του domain είναι 08/01/2028 (Papaki): ανανέωση πριν από τότε.
