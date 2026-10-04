import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { key, hwid } = req.body || {};
  if (!key) return res.json({ valid: false });
  const { data } = await db.from("keys").select("*").eq("key", key).single();
  if (!data || data.revoked) return res.json({ valid: false });
  if (data.expires_at && new Date(data.expires_at) < new Date()) return res.json({ valid: false, reason: "expired" });
  if (!data.hwid && hwid) await db.from("keys").update({ hwid }).eq("key", key);
  else if (data.hwid && hwid && data.hwid !== hwid) return res.json({ valid: false, reason: "hwid" });
  res.json({ valid: true, expires_at: data.expires_at, plan: data.plan });
}
