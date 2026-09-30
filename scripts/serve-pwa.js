/**
 * scripts/serve-pwa.js
 * ====================
 * Serveur statique pour l'export web, afin de tester la PWA localement.
 *
 * Sans dépendance : `npx serve` fonctionnerait, mais il faut un serveur qui
 * renvoie `index.html` sur les routes inconnues (expo-router fait du
 * routage côté client) et qui serve `sw.js` avec le bon type MIME, sans
 * quoi le navigateur refuse d'enregistrer le service worker.
 *
 * Usage : node scripts/serve-pwa.js [port]
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'dist');
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

if (!fs.existsSync(ROOT)) {
  console.error('dist/ introuvable. Lancez d’abord : npm run build:web');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Empêche de remonter hors de dist/ via « ../ ».
  const safe = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(ROOT, safe);

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }

  // Route inconnue : on rend une page HTML exportée si elle existe,
  // sinon l'index — expo-router prend le relais côté client.
  if (!fs.existsSync(file)) {
    const asHtml = `${file}.html`;
    file = fs.existsSync(asHtml) ? asHtml : path.join(ROOT, 'index.html');
  }

  const ext = path.extname(file);
  const headers = { 'Content-Type': MIME[ext] ?? 'application/octet-stream' };

  // Le service worker ne doit jamais être servi depuis le cache, sinon une
  // ancienne version reste active après un déploiement.
  if (path.basename(file) === 'sw.js') headers['Cache-Control'] = 'no-cache';

  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`AubeShop (PWA) : http://localhost:${PORT}`);
});
