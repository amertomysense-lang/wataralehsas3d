import { defineConfig } from "vite";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    nitro: {
      preset: "cloudflare-pages"
    },
  },
  build: {
    outDir: ".output/public"
  }
});
