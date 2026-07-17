import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineLovableConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [mcpPlugin()],
});
