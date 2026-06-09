import { createFileRoute } from "@tanstack/react-router";

// تحويل الشعر/القصّة باستخدام Replicate. النموذج قابل للتعديل عبر متغير بيئة.
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
          return new Response(JSON.stringify({ error: "REPLICATE_API_TOKEN missing" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        const { person, style, color, hairstyle_url } = (await request.json()) as {
          person: string; style?: string; color?: string; hairstyle_url?: string;
        };
        if (!person) return new Response(JSON.stringify({ error: "missing person image" }), { status: 400 });

        // النموذج الافتراضي: hairclip / hair style transfer (يمكن تغييره عبر REPLICATE_HAIRCUT_VERSION)
        const version = process.env.REPLICATE_HAIRCUT_VERSION
          || "c4c7e5a657e2e1abccd57625093522a9928edeccee77e3f55d57c664bcd96fa6";

        const input: Record<string, unknown> = {
          image: person,
          hairstyle: style ?? "Bob cut",
          color: color ?? "natural",
        };
        if (hairstyle_url) input.reference = hairstyle_url;

        const create = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ version, input }),
        });
        const pred = await create.json();
        if (!create.ok) return new Response(JSON.stringify({ error: pred.detail || "create failed" }), { status: 500 });

        let status = pred.status, out = pred.output;
        const id = pred.id;
        for (let i = 0; i < 60 && (status === "starting" || status === "processing"); i++) {
          await new Promise((r) => setTimeout(r, 2500));
          const p = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: { Authorization: `Token ${token}` },
          });
          const j = await p.json();
          status = j.status; out = j.output;
        }
        if (status !== "succeeded") {
          return new Response(JSON.stringify({ error: `status=${status}` }), { status: 500 });
        }
        const url = Array.isArray(out) ? out[0] : out;
        return new Response(JSON.stringify({ result_url: url }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
