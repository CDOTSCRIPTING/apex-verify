import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function genKey() {
  let s = "";
  for (let i = 0; i < 12; i++) s += ALPHA[randomBytes(1)[0] % ALPHA.length];
  return `APEX-${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
}
const EXPIRY = { weekly: "7 days", monthly: "30 days", lifetime: null };
export default async function handler(req, res) {
  const { secret, action, plan, count, key } = req.query || {};
  if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ ok: false });
  if (action === "gen") {
    if (!EXPIRY.hasOwnProperty(plan)) return res.json({ ok: false, error: "bad plan" });
    const n = Math.min(parseInt(count) || 1, 50);
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = genKey();
      await db.from("keys").insert({ key: k, plan, expires_at: EXPIRY[plan] ? new Date(Date.now() + { weekly: 7, monthly: 30 }[plan] * 864e5).toISOString() : null, revoked: false });
      out.push(k);
    }
    return res.json({ ok: true, keys: out });
  }
  if (action === "revoke") {
    await db.from("keys").update({ revoked: true }).eq("key", key);
    return res.json({ ok: true });
  }
  return res.json({ ok: false });
}
