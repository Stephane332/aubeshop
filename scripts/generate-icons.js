/**
 * scripts/generate-icons.js
 * =========================
 * Génère les icônes de marque AubeShop en PNG.
 *
 * Le projet n'avait que les images du gabarit Expo (`react-logo.png`,
 * `partial-react-logo.png`) et une icône adaptative bleu clair `#E6F4FE`,
 * en contradiction avec l'identité rouge / noir / blanc.
 *
 * Plutôt que d'ajouter une dépendance de traitement d'image, on encode le
 * PNG à la main : `zlib` est dans Node, et le motif est purement
 * géométrique — un soleil levant au-dessus de l'horizon, « l'aube ».
 *
 * Usage : node scripts/generate-icons.js
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// ============================================
// ENCODAGE PNG
// ============================================

/** Table CRC32, telle que définie par la spécification PNG. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Encode un buffer RGBA (4 octets par pixel) en PNG. */
function encodePNG(rgba, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); // largeur
  header.writeUInt32BE(size, 4); // hauteur
  header[8] = 8; // 8 bits par canal
  header[9] = 6; // couleur RGBA
  header[10] = 0; // compression deflate
  header[11] = 0; // filtrage standard
  header[12] = 0; // pas d'entrelacement

  // Chaque ligne est précédée d'un octet de filtre ; 0 = aucun filtre.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============================================
// DESSIN
// ============================================

const RED = [200, 30, 60]; // #C81E3C — rouge de la marque
const WHITE = [255, 255, 255];

/**
 * Dessine le logo dans un buffer RGBA.
 *
 * @param size     Côté de l'image, en pixels.
 * @param opts.bleed   true = le rouge occupe tout le carré (icône adaptative
 *                     Android, qui applique son propre masque).
 * @param opts.padding Marge autour du motif, en fraction du côté.
 */
function draw(size, { bleed = false, padding = 0 } = {}) {
  const rgba = Buffer.alloc(size * size * 4); // transparent par défaut
  const inset = size * padding;
  const box = size - inset * 2;
  const radius = bleed ? 0 : box * 0.22;

  const cx = size / 2;
  // Le soleil est légèrement au-dessus du centre, l'horizon en dessous.
  const horizonY = inset + box * 0.64;
  const sunR = box * 0.26;
  const sunCy = horizonY - sunR * 0.18;
  const barHalf = box * 0.34;
  const barTop = inset + box * 0.72;
  const barH = Math.max(2, box * 0.075);

  /** Couverture d'un pixel par un disque, échantillonnée 2×2 pour lisser. */
  const coverage = (x, y, test) => {
    let hits = 0;
    for (const dx of [0.25, 0.75]) {
      for (const dy of [0.25, 0.75]) if (test(x + dx, y + dy)) hits++;
    }
    return hits / 4;
  };

  const inRoundedRect = (px, py) => {
    if (bleed) return true;
    const left = inset;
    const right = size - inset;
    if (px < left || px > right || py < left || py > right) return false;
    // Coins arrondis : distance au centre du rayon correspondant.
    const nx = px < left + radius ? left + radius : px > right - radius ? right - radius : px;
    const ny = py < left + radius ? left + radius : py > right - radius ? right - radius : py;
    return (px - nx) ** 2 + (py - ny) ** 2 <= radius ** 2 + 0.001 ||
           (px >= left + radius && px <= right - radius) ||
           (py >= left + radius && py <= right - radius);
  };

  const inSun = (px, py) => (px - cx) ** 2 + (py - sunCy) ** 2 <= sunR ** 2 && py <= horizonY;
  const inBar = (px, py) =>
    py >= barTop && py <= barTop + barH && Math.abs(px - cx) <= barHalf;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      const bg = coverage(x, y, inRoundedRect);
      if (bg === 0) continue;

      // Fond rouge, puis les éléments blancs par-dessus.
      let [r, g, b] = RED;
      const white = Math.max(coverage(x, y, inSun), coverage(x, y, inBar));
      if (white > 0) {
        r = Math.round(RED[0] + (WHITE[0] - RED[0]) * white);
        g = Math.round(RED[1] + (WHITE[1] - RED[1]) * white);
        b = Math.round(RED[2] + (WHITE[2] - RED[2]) * white);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = Math.round(255 * bg);
    }
  }

  return rgba;
}

/** Carré uni, pour le fond de l'icône adaptative Android. */
function solid(size, color) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = color[0];
    rgba[i * 4 + 1] = color[1];
    rgba[i * 4 + 2] = color[2];
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

// ============================================
// SORTIE
// ============================================

const root = path.join(__dirname, '..');

/** @type {{file: string, size: number, rgba: (s: number) => Buffer}[]} */
const targets = [
  // Application
  { file: 'assets/images/icon.png', size: 1024, rgba: (s) => draw(s) },
  { file: 'assets/images/splash-icon.png', size: 512, rgba: (s) => draw(s, { padding: 0.12 }) },
  { file: 'assets/images/favicon.png', size: 96, rgba: (s) => draw(s) },

  // Icône adaptative Android : le premier plan doit prévoir une marge,
  // le système pouvant rogner jusqu'à 18 % sur chaque bord.
  {
    file: 'assets/images/android-icon-foreground.png',
    size: 432,
    rgba: (s) => draw(s, { bleed: false, padding: 0.26 }),
  },
  { file: 'assets/images/android-icon-background.png', size: 432, rgba: (s) => solid(s, RED) },
  {
    file: 'assets/images/android-icon-monochrome.png',
    size: 432,
    rgba: (s) => draw(s, { padding: 0.26 }),
  },

  // PWA
  { file: 'public/icons/icon-192.png', size: 192, rgba: (s) => draw(s) },
  { file: 'public/icons/icon-512.png', size: 512, rgba: (s) => draw(s) },
  // Icône « maskable » : le motif doit tenir dans le cercle de sûreté,
  // soit 80 % du côté, sinon Android le rogne.
  {
    file: 'public/icons/maskable-512.png',
    size: 512,
    rgba: (s) => {
      const base = solid(s, RED);
      const motif = draw(s, { padding: 0.2, bleed: false });
      // Compose le motif sur le fond plein.
      for (let i = 0; i < s * s; i++) {
        const a = motif[i * 4 + 3] / 255;
        if (a > 0) {
          base[i * 4] = Math.round(base[i * 4] * (1 - a) + motif[i * 4] * a);
          base[i * 4 + 1] = Math.round(base[i * 4 + 1] * (1 - a) + motif[i * 4 + 1] * a);
          base[i * 4 + 2] = Math.round(base[i * 4 + 2] * (1 - a) + motif[i * 4 + 2] * a);
        }
      }
      return base;
    },
  },
  { file: 'public/icons/apple-touch-icon.png', size: 180, rgba: (s) => draw(s, { bleed: true }) },
];

let written = 0;
for (const target of targets) {
  const out = path.join(root, target.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, encodePNG(target.rgba(target.size), target.size));
  console.log(`  ${target.file}  (${target.size}px)`);
  written++;
}

// Les images du gabarit Expo n'ont plus lieu d'être.
for (const stale of [
  'assets/images/react-logo.png',
  'assets/images/react-logo@2x.png',
  'assets/images/react-logo@3x.png',
  'assets/images/partial-react-logo.png',
]) {
  const file = path.join(root, stale);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  supprimé : ${stale}`);
  }
}

console.log(`\n${written} icônes générées.`);
