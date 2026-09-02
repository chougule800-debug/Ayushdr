import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Global process guards to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Provide firebase config endpoint
app.get('/api/firebase-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return res.json(config);
    }
    return res.status(404).json({ error: 'Config not found' });
  } catch (e) {
    console.error('Error reading firebase config:', e);
    return res.status(500).json({ error: 'Failed to read config' });
  }
});

// Serve static files from root and public directories
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: false
}));
app.use('/public', express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: false
}));

// Fallback to index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

