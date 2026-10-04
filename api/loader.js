export default async function handler(req, res) {
  const key = req.query.key;
  if (!key) return res.status(400).send("-- missing key");
  res.setHeader("Content-Type", "text/plain");
  res.send(`local _k=${JSON.stringify(key)} local _h=""; pcall(function() _h=tostring(MachoAuthenticationKey()) end) MachoIsolatedInject(MachoWebRequest("https://apex-verify-lovat.vercel.app/api/payload?key=".._k.."&hwid=".._h))`);
}
