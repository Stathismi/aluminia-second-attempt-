// Projects ("Τα Έργα Μας") stored in Netlify Blobs.
// index  -> JSON array [{ id, title, location, date, created }]
// img/ID -> image bytes, metadata { contentType }
import { verifyToken, tokenFrom, json } from "./auth.mjs";
import { makeThumb } from "./thumb.mjs";

const LONG_CACHE = {
  "cache-control": "public, max-age=31536000, immutable",
  "netlify-cdn-cache-control": "public, max-age=31536000, immutable, durable"
};

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function clean(v, max = 120) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function readIndex(store) {
  const list = await store.get("index", { type: "json" });
  return Array.isArray(list) ? list : [];
}

function publicItem(it) {
  // "image" is the small version used by the carousel; "full" is the original upload
  return { id: it.id, image: "/api/thumb/" + it.id, full: "/api/img/" + it.id, title: it.title, location: it.location, date: it.date };
}

export async function handleErga(req, store) {
  const method = req.method.toUpperCase();

  if (method === "GET") {
    const list = await readIndex(store);
    return json({ items: list.map(publicItem) }, 200, { "cache-control": "public, max-age=0, must-revalidate" });
  }

  if (!verifyToken(tokenFrom(req))) return json({ error: "Συνδεθείτε ξανά στο admin." }, 401);

  if (method === "POST") {
    let form;
    try { form = await req.formData(); } catch { return json({ error: "Δεν στάλθηκε φωτογραφία." }, 400); }
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return json({ error: "Δεν στάλθηκε φωτογραφία." }, 400);
    const type = file.type || "image/jpeg";
    if (!TYPES.includes(type)) return json({ error: "Επιτρέπονται μόνο φωτογραφίες JPG, PNG ή WebP." }, 400);
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return json({ error: "Η φωτογραφία είναι πάνω από 5 MB." }, 413);
    if (bytes.byteLength === 0) return json({ error: "Η φωτογραφία είναι κενή." }, 400);

    const id = newId();
    await store.set("img/" + id, bytes, { metadata: { contentType: type } });
    // small version: sent by the admin page, or made here from the upload
    const thumbFile = form.get("thumb");
    let thumb = null;
    if (thumbFile && typeof thumbFile.arrayBuffer === "function") {
      const tb = await thumbFile.arrayBuffer();
      if (tb.byteLength > 0 && tb.byteLength <= MAX_BYTES) thumb = tb;
    }
    if (!thumb) { try { thumb = makeThumb(bytes); } catch (e) { thumb = null; } }
    if (thumb) await store.set("thumb/" + id, thumb, { metadata: { contentType: "image/jpeg" } });
    const item = {
      id,
      title: clean(form.get("title")),
      location: clean(form.get("location")),
      date: clean(form.get("date"), 20),
      created: new Date().toISOString()
    };
    const list = await readIndex(store);
    list.unshift(item);
    await store.setJSON("index", list);
    return json({ item: publicItem(item) }, 201);
  }

  if (method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Λάθος αίτημα." }, 400); }
    const list = await readIndex(store);
    if (Array.isArray(body.order)) {
      const byId = new Map(list.map((it) => [it.id, it]));
      const ordered = body.order.map((id) => byId.get(id)).filter(Boolean);
      list.forEach((it) => { if (!body.order.includes(it.id)) ordered.push(it); });
      await store.setJSON("index", ordered);
      return json({ items: ordered.map(publicItem) });
    }
    if (body.id) {
      const it = list.find((x) => x.id === body.id);
      if (!it) return json({ error: "Η φωτογραφία δεν βρέθηκε." }, 404);
      if ("title" in body) it.title = clean(body.title);
      if ("location" in body) it.location = clean(body.location);
      if ("date" in body) it.date = clean(body.date, 20);
      await store.setJSON("index", list);
      return json({ item: publicItem(it) });
    }
    return json({ error: "Λάθος αίτημα." }, 400);
  }

  if (method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    const list = await readIndex(store);
    const next = list.filter((x) => x.id !== id);
    if (next.length === list.length) return json({ error: "Η φωτογραφία δεν βρέθηκε." }, 404);
    await store.setJSON("index", next);
    await store.delete("img/" + id);
    await store.delete("thumb/" + id);
    return json({ ok: true });
  }

  return json({ error: "Μη υποστηριζόμενη ενέργεια." }, 405);
}

export async function handleImage(id, store) {
  if (!id || !/^[a-z0-9]+$/.test(id)) return new Response("Not found", { status: 404 });
  const res = await store.getWithMetadata("img/" + id, { type: "arrayBuffer" });
  if (!res || !res.data) return new Response("Not found", { status: 404 });
  return new Response(res.data, {
    headers: { "content-type": (res.metadata && res.metadata.contentType) || "image/jpeg", ...LONG_CACHE }
  });
}

// Small version for the carousel. Made once on first request for older uploads, then stored.
export async function handleThumb(id, store) {
  if (!id || !/^[a-z0-9]+$/.test(id)) return new Response("Not found", { status: 404 });
  const have = await store.getWithMetadata("thumb/" + id, { type: "arrayBuffer" });
  if (have && have.data) {
    return new Response(have.data, { headers: { "content-type": "image/jpeg", ...LONG_CACHE } });
  }
  const full = await store.getWithMetadata("img/" + id, { type: "arrayBuffer" });
  if (!full || !full.data) return new Response("Not found", { status: 404 });
  let thumb = null;
  try { thumb = makeThumb(full.data); } catch (e) { thumb = null; }
  if (!thumb) return handleImage(id, store); // not a JPEG: serve the original
  await store.set("thumb/" + id, thumb, { metadata: { contentType: "image/jpeg" } });
  return new Response(thumb, { headers: { "content-type": "image/jpeg", ...LONG_CACHE } });
}
