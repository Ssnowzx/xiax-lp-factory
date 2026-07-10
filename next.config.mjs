import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Galeria V2 (Asset Package §4): o next/image negocia AVIF→WebP→fonte.
    // O cliente entrega 1 master por slot; o pipeline gera os responsivos.
    formats: ["image/avif", "image/webp"],
  },
  webpack(config, { isServer, webpack }) {
    // Perf XIA-76 — dropa o `polyfill-module.js` que o bootstrap client do Next
    // (app-index.js) injeta INCONDICIONALMENTE (não é gated por browserslist no
    // Next 14.2). O browserslist floor deste projeto (Chrome 100+/Safari 16+)
    // já suporta nativamente cada feature ali (Array.flat/at, Object.hasOwn,
    // Promise.finally, Symbol.description, String.trimStart, URL). Browsers abaixo
    // do floor seguem cobertos pelo bundle `nomodule` (polyfill-nomodule.js).
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]build[\\/]polyfills[\\/]polyfill-module(\.js)?$/,
          path.resolve(__dirname, "lib/polyfill-module-noop.js"),
        ),
      );
    }
    return config;
  },
};

export default nextConfig;
