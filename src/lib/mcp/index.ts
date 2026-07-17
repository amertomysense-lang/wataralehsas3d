import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import listMyProjects from "./tools/list-my-projects";
import createOrder from "./tools/create-order";

// OAuth issuer MUST be the direct Supabase host; the published SUPABASE_URL is
// the .lovable.cloud proxy which mcp-js rejects (RFC 8414 issuer mismatch).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "watar-al-ihsas-mcp",
  title: "Watar Al-Ihsas — Decor Print MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Watar Al-Ihsas 3D wall & floor printing platform. Use list_products / get_product to browse the design catalog, list_my_projects to see the signed-in user's saved decor simulations, and create_order to place a new print order on their behalf.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, getProduct, listMyProjects, createOrder],
});
