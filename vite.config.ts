import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineLovableConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});

