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

async function run() {
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
  console.log(`[gallery] ${MAP.length} masters otimizados · total ${(total / 1024).toFixed(0)} KB`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
