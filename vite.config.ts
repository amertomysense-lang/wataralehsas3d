import { defineConfig } from "vite";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineLovableConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  build: {
    outDir: ".output/public"
  }
});
