import { getStore } from "@netlify/blobs";
import { handleThumb } from "../lib/erga.mjs";

export default async (req, context) => {
  const url = new URL(req.url);
  const id = (context && context.params && context.params.id) || url.pathname.split("/").filter(Boolean).pop();
  try {
    return await handleThumb(id, getStore({ name: "erga", consistency: "strong" }));
  } catch (err) {
    console.error("thumb", id, err);
    return new Response("Image error", { status: 500, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/api/thumb/:id" };
