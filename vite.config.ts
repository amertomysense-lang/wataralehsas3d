import { defineConfig } from "vite";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

// نقوم بدمج إعدادات لوفابل الافتراضية مع توجيه السيرفر لـ Cloudflare
export default defineLovableConfig({
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
