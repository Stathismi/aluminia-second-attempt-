import { getStore } from "@netlify/blobs";
import { handleImage } from "../lib/erga.mjs";

export default async (req, context) => {
  // id from the route (/api/img/:id), falling back to the last path segment or ?id=
  const url = new URL(req.url);
  const id = (context && context.params && context.params.id) || url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop();
  try {
    const store = getStore({ name: "erga", consistency: "strong" });
    if (url.searchParams.get("check") === "1") {
      // text-only health check: does the photo exist and how big is it
      const res = await store.getWithMetadata("img/" + id, { type: "arrayBuffer" });
      return new Response(JSON.stringify({
        id, found: !!(res && res.data), bytes: res && res.data ? res.data.byteLength : 0,
        contentType: res && res.metadata ? res.metadata.contentType : null
      }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    return await handleImage(id, store);
  } catch (err) {
    console.error("img", id, err);
    return new Response("Image error", { status: 500, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: ["/api/img/:id", "/api/img"] };
