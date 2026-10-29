/**
 * Pipeline de imagem da #galeria — sharp em BUILD, NUNCA em runtime (Brief §WS1).
 * ============================================================================
 * Lê os masters de origem (`assets/gallery-src/`, versionados) e emite masters
 * OTIMIZADOS em `public/gallery/`. O `next/image` (Vercel Image Optimization,
 * `formats: [avif, webp]` no next.config) negocia AVIF→WebP→master no edge; este
 * script só garante que o MASTER entra no repo leve e no formato certo — nada de
 * sharp no servidor de request.
 *
 * FRONTEIRA (Front-end Architect): eu entrego o pipeline + os masters otimizados +
 * o contrato de dimensão (lib/data/gallery.ts). O `ui-engineer` liga `next/image`
 * nos slots do bento consumindo `sizes/target` daqui. Zero placeholder no fim.
 *
 * `--salon-only` regenera só as fotos do salão (não reescreve as da barbearia).
 * Rodar: `npm run gallery:build` (também roda no `prebuild`). Idempotente.
 *
 * Regras:
 *  - Fotos (JPEG) → mozjpeg q78, largura teto p/ o maior slot; metadados removidos.
 *  - Screenshot de produto (PNG, texto de UI) → mantém PNG (texto nítido, sem
 *    artefato de JPEG), comprimido (palette + effort 10). next/image deriva os
 *    responsivos AVIF/WebP.
 */
import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "gallery-src");
const OUT = path.join(ROOT, "public", "gallery");

// Mapa slot → master de origem. id do slot = nome do arquivo emitido em /public/gallery.
// Mantém 1:1 com GALLERY_SLOTS em lib/data/gallery.ts.
const MAP = [
  { id: "gallery-01", src: "barbearia-sistema.png", kind: "screenshot", maxW: 1600 },
  { id: "gallery-02", src: "barbearia-cliente-celular.jpg", kind: "photo", maxW: 1200 },
  { id: "gallery-03", src: "barbearia-ambiente.jpg", kind: "photo", maxW: 1024 },
  { id: "gallery-04", src: "barbearia-atendimento.jpg", kind: "photo", maxW: 1024 },
  { id: "gallery-05", src: "barbearia-dono.jpg", kind: "photo", maxW: 1024 },
  { id: "gallery-06", src: "barbearia-produtos.jpg", kind: "photo", maxW: 1024 },
];

// Salon page photos (change xiax-lp-v5-salon, task 6.4): PNG sources → exact-size WebP q82.
// Mirrors SALON_GALLERY_SLOTS in lib/data/gallery.ts (all 16:9).
const SALON_SRC = path.join(SRC, "salon");
const SALON_OUT = path.join(OUT, "salon");
const SALON_MAP = [
  { id: "salon-01", w: 1600, h: 900 },
  { id: "salon-02", w: 1200, h: 675 },
  { id: "salon-03", w: 1024, h: 576 },
  { id: "salon-04", w: 1024, h: 576 },
  { id: "salon-05", w: 1024, h: 576 },
];

async function runSalon() {
  await mkdir(SALON_OUT, { recursive: true });
  for (const { id, w, h } of SALON_MAP) {
    const input = path.join(SALON_SRC, `${id}.png`);
    const output = path.join(SALON_OUT, `${id}.webp`);
    // Centre-crop to 16:9 first, then Lanczos down to the exact slot size.
    const meta = await sharp(input).metadata();
    const cropH = Math.min(meta.height, Math.round((meta.width * 9) / 16));
    const cropW = Math.round((cropH * 16) / 9);
    await sharp(input)
      .extract({
        left: Math.floor((meta.width - cropW) / 2),
        top: Math.floor((meta.height - cropH) / 2),
        width: cropW,
        height: cropH,
      })
      .resize(w, h, { kernel: "lanczos3" })
      .webp({ quality: 82 })
      .toFile(output);
    const { size } = await stat(output);
    console.log(`  ${id}  → public/gallery/salon/${id}.webp  ${w}x${h}  ${(size / 1024).toFixed(0)} KB`);
  }
}

async function run() {
  if (process.argv.includes("--salon-only")) {
    await runSalon();
    return;
  }
  await mkdir(OUT, { recursive: true });
  const srcFiles = new Set(await readdir(SRC));
  let total = 0;

  for (const { id, src, kind, maxW } of MAP) {
    if (!srcFiles.has(src)) {
      throw new Error(`[gallery] master ausente: assets/gallery-src/${src} (slot ${id})`);
    }
    const input = path.join(SRC, src);
    const pipe = sharp(input).rotate().resize({ width: maxW, withoutEnlargement: true });

    let outName;
    if (kind === "screenshot") {
      outName = `${id}.png`;
      await pipe.png({ compressionLevel: 9, palette: true, effort: 10 }).toFile(path.join(OUT, outName));
    } else {
      outName = `${id}.jpg`;
      await pipe.jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, outName));
    }
    const { size } = await stat(path.join(OUT, outName));
    total += size;
    const kb = (size / 1024).toFixed(0);
    console.log(`  ${id}  ${src} → public/gallery/${outName}  ${kb} KB`);
  }
  await runSalon();
  console.log(`[gallery] ${MAP.length} masters otimizados · total ${(total / 1024).toFixed(0)} KB`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
