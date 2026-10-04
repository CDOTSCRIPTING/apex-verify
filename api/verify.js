import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function check(key, hwid) {
  if (!key) return { valid: false };
  const { data } = await db.from("keys").select("*").eq("key", key).single();
  if (!data || data.revoked) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, reason: "expired" };
  if (!data.hwid && hwid) await db.from("keys").update({ hwid }).eq("key", key);
  else if (data.hwid && hwid && data.hwid !== hwid) return { valid: false, reason: "hwid" };
  return { valid: true, expires_at: data.expires_at, plan: data.plan };
}
export default async function handler(req, res) {
  if (req.method === "GET") return res.json(await check(req.query.key, req.query.hwid));
  if (req.method === "POST") {
    const { key, hwid } = req.body || {};
    return res.json(await check(key, hwid));
  }
  return res.status(405).end();
}
