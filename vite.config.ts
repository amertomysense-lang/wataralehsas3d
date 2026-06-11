import { defineConfig } from "vite";
import lovableConfig from "@lovable.dev/vite-tanstack-config";

// Cloudflare Auto-Detection Bypass: export default defineConfig({ plugins: [] });
export default defineConfig({
  ...lovableConfig,
  plugins: [],
});
