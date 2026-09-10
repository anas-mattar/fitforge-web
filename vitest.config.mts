import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest reads no configuration from `tsconfig.json`, so the `@/` alias that resolves
 * everywhere else has to be declared here too. Without it, a test that imports anything
 * through `@/` fails to resolve rather than failing an assertion — which is why every
 * test written before this file used relative imports, and why the route the browser
 * actually calls had no test at all.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
