import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover pure logic in lib/** (motion math, lead delivery); DOM/motion behavior is
// verified by the Playwright harness in qa/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["lib/motion/depth.ts", "lib/motion/scissors-path.ts", "lib/motion/steps.ts", "lib/motion/razor-path.ts", "lib/motion/brush-path.ts", "lib/motion/cut-state.ts", "lib/motion/math.ts", "lib/contact/whatsapp.ts", "lib/data/plans.ts", "lib/ui/contrast.ts", "lib/seo/page-metadata.ts", "lib/seo/json-ld.ts", "lib/analytics/events.ts", "lib/content/salon-features.ts", "lib/motion/sweep-tool.ts", "lib/three/lighting.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
