import { getStore } from "@netlify/blobs";
import { handleThumb } from "../lib/erga.mjs";

export default async (req, context) => {
  const url = new URL(req.url);
  const id = (context && context.params && context.params.id) || url.pathname.split("/").filter(Boolean).pop();
  try {
    const res = await handleThumb(id, getStore({ name: "erga", consistency: "strong" }));
    if (url.searchParams.get("check") === "1") {
      const size = res.ok ? (await res.arrayBuffer()).byteLength : 0;
      return new Response(JSON.stringify({ id, status: res.status, type: res.headers.get("content-type"), bytes: size }),
        { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    return res;
  } catch (err) {
    console.error("thumb", id, err);
    return new Response("Image error", { status: 500, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/api/thumb/:id" };
