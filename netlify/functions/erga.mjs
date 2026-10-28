import { getStore } from "@netlify/blobs";
import { handleErga } from "../lib/erga.mjs";

export default async (req) => handleErga(req, getStore({ name: "erga", consistency: "strong" }));

export const config = { path: "/api/erga" };
