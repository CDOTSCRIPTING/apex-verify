import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export default async function handler(req, res) {
  const { key, hwid } = req.query || {};
  const { data } = await db.from("keys").select("*").eq("key", key).single();
  if (!data || data.revoked) return res.status(403).send("-- bad key");
  if (data.expires_at && new Date(data.expires_at) < new Date()) return res.status(403).send("-- expired");
  if (!data.hwid && hwid) await db.from("keys").update({ hwid }).eq("key", key);
  else if (data.hwid && hwid && data.hwid !== hwid) return res.status(403).send("-- hwid");
  const f = await db.storage.from("payload").download("menu.lua");
  if (f.error) return res.status(500).send("-- no payload");
  res.setHeader("Content-Type", "text/plain");
  res.send(await f.data.text());
}
