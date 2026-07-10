import type { Config } from "tailwindcss";
import { BP_PX } from "./lib/ui/breakpoints";
import { xbarberTheme } from "./lib/ui/theme";

// Front-end Architecture (XIA-34): aplica o contrato do Design System (XIA-32).
// screens e extend vêm da FONTE ÚNICA (lib/ui/*) — nenhum literal de token aqui.
const config: Config = {
  // `./lib` é OBRIGATÓRIO: os spans do bento da #galeria são strings em
  // lib/data/gallery.ts (md:/lg:col-span-* + lg:row-span-2). Sem escanear ./lib
  // o JIT purga lg:col-span-8/4/6 + lg:row-span-2 → buraco no grid em lg+ (XIA-131).
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  // `xbarberTheme` é `as const` (readonly, dono: Design System) — cast de FRONTEIRA
  // p/ o tipo mutável do Tailwind. NÃO renomeia nem altera valor: só reconcilia tipos.
  theme: {
    screens: BP_PX, // sm/md/lg/xl da FONTE ÚNICA (breakpoints.ts)
    extend: xbarberTheme,
  } as unknown as Config["theme"],
  plugins: [],
};

export default config;
