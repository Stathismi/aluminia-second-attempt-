import { getStore } from "@netlify/blobs";
import { handleImage } from "../lib/erga.mjs";

export default async (req, context) => {
  // id from the route (/api/img/:id), falling back to the last path segment or ?id=
  const url = new URL(req.url);
  const id = (context && context.params && context.params.id) || url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop();
  try {
    return await handleImage(id, getStore({ name: "erga", consistency: "strong" }));
  } catch (err) {
    console.error("img", id, err);
    return new Response("Image error", { status: 500, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: ["/api/img/:id", "/api/img"] };
