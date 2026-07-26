import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { seedIfEmpty } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH ?? path.resolve(here, '../data/gmvault.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = openDb(dbPath);
if (seedIfEmpty(db)) {
  console.log('Empty database — seeded sample campaign "Cinders of the Aether Engine"');
}

const app = createApp(db);

const clientDir = process.env.CLIENT_DIR ?? path.resolve(here, '../../client/dist');
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
} else {
  console.warn(`Client build not found at ${clientDir} — API only (use the Vite dev server)`);
}

const port = Number(process.env.PORT ?? 8580);
app.listen(port, () => {
  console.log(`GM Vault listening on http://localhost:${port} (db: ${dbPath})`);
});
