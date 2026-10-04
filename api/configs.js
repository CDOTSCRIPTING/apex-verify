import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function check(key, hwid) {
  if (!key) return null;
  const { data } = await db.from("keys").select("*").eq("key", key).single();
  if (!data || data.revoked) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.hwid && hwid && data.hwid !== hwid) return null;
  return data;
}
export default async function handler(req, res) {
  const q = req.query || {};
  const row = await check(q.key, q.hwid);
  if (!row) return res.json({ ok: false, error: "bad key" });
  if (q.action === "list") {
    const { data } = await db.from("configs").select("name,updated_at").eq("key", q.key).order("name");
    return res.json({ ok: true, configs: data || [] });
  }
  if (q.action === "load") {
    const { data } = await db.from("configs").select("data").eq("key", q.key).eq("name", q.name).single();
    if (!data) return res.json({ ok: false, error: "not found" });
    return res.json({ ok: true, data: data.data });
  }
  if (q.action === "save") {
    if (!q.name || !q.data) return res.json({ ok: false, error: "missing" });
    let data;
    try { data = JSON.parse(q.data); } catch { return res.json({ ok: false, error: "bad json" }); }
    await db.from("configs").upsert({ key: q.key, name: q.name, data, updated_at: new Date().toISOString() });
    return res.json({ ok: true });
  }
  if (q.action === "delete") {
    await db.from("configs").delete().eq("key", q.key).eq("name", q.name);
    return res.json({ ok: true });
  }
  return res.json({ ok: false, error: "bad action" });
}
