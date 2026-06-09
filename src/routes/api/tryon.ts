import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
          return new Response(JSON.stringify({ error: "REPLICATE_API_TOKEN missing" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        const { person, garment_url } = (await request.json()) as { person: string; garment_url: string };
        if (!person || !garment_url) {
          return new Response(JSON.stringify({ error: "missing inputs" }), { status: 400 });
        }
        const create = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
            input: { human_img: person, garm_img: garment_url, garment_des: "clothing item" },
          }),
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
        if (status !== "succeeded") return new Response(JSON.stringify({ error: `status=${status}` }), { status: 500 });
        const url = Array.isArray(out) ? out[0] : out;
        return new Response(JSON.stringify({ result_url: url }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
