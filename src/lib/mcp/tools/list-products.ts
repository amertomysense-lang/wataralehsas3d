import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List decor design products available in the Watar Al-Ihsas catalog. Optionally filter by category or search term.",
  inputSchema: {
    category: z.string().optional().describe("Optional category filter, e.g. 'flowers', 'nature'."),
    search: z.string().optional().describe("Optional case-insensitive text search over product title."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, search, limit }, ctx) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    let q = supabase
      .from("products")
      .select("id, title, description, category, type, price, price_usd, price_try, image_url")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (category) q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    const { data, error } = await q;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
