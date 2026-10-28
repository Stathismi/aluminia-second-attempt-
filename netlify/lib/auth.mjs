import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_DAYS = 30;

function secret() {
  const pw = process.env.ADMIN_PASSWORD || "";
  // Changing ADMIN_PASSWORD (or SESSION_SECRET) logs everyone out.
  return pw + "|" + (process.env.SESSION_SECRET || "mitskas-koufomata");
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordConfigured() {
  return (process.env.ADMIN_PASSWORD || "").length >= 6;
}

export function checkPassword(candidate) {
  if (!passwordConfigured()) return false;
  return safeEqual(candidate || "", process.env.ADMIN_PASSWORD);
}

export function issueToken(now = Date.now()) {
  const exp = String(now + TOKEN_DAYS * 24 * 60 * 60 * 1000);
  return exp + "." + sign("admin:" + exp);
}

export function verifyToken(token, now = Date.now()) {
  if (!passwordConfigured() || !token) return false;
  const [exp, sig] = String(token).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < now) return false;
  return safeEqual(sig, sign("admin:" + exp));
}

export function tokenFrom(req) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
  });
}
