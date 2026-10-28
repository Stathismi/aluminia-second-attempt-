import { getStore } from "@netlify/blobs";
import { handleImage } from "../lib/erga.mjs";

export default async (req, context) => handleImage(context.params.id, getStore({ name: "erga", consistency: "strong" }));

export const config = { path: "/api/img/:id" };
