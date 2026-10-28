import { checkPassword, issueToken, passwordConfigured, verifyToken, tokenFrom, json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method === "GET") {
    // "Am I still logged in?"
    return json({ ok: verifyToken(tokenFrom(req)) });
  }
  if (req.method !== "POST") return json({ error: "Μη υποστηριζόμενη ενέργεια." }, 405);
  if (!passwordConfigured()) {
    return json({ error: "Δεν έχει οριστεί κωδικός admin. Ορίστε το ADMIN_PASSWORD στο Netlify." }, 503);
  }
  let body = {};
  try { body = await req.json(); } catch {}
  if (!checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "Λάθος κωδικός." }, 401);
  }
  return json({ token: issueToken() });
};

export const config = { path: "/api/login" };
