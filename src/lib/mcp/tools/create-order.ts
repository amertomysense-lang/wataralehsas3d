import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export default defineTool({
  name: "create_order",
  title: "Create print order",
  description:
    "Create a new print order for wall/floor decor. Requires the design URL and physical dimensions in meters.",
  inputSchema: {
    design_url: z.string().url().describe("Public URL of the design/artwork to print."),
    design_name: z.string().optional(),
    width: z.number().positive().describe("Width in meters."),
    height: z.number().positive().describe("Height in meters."),
    embossed: z.boolean().optional().describe("Whether to apply the embossed 3D finish."),
    region_name: z.string().optional().describe("Delivery region / city name."),
    customer_phone: z.string().optional().describe("Contact phone for delivery coordination."),
    shipping_mode: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await supabase
      .from("orders")
      .insert({
        design_url: input.design_url,
        design_name: input.design_name ?? null,
        width: input.width,
        height: input.height,
        embossed: input.embossed ?? false,
        region_name: input.region_name ?? null,
        customer_phone: input.customer_phone ?? null,
        shipping_mode: input.shipping_mode ?? null,
        status: "new",
      })
      .select()
      .maybeSingle();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Order created: ${data?.id}` }],
      structuredContent: { order: data },
    };
  },
});
