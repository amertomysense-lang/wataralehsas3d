import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";

// تجربة الأزياء — يفضّل Lovable AI (Nano Banana 2) عند توفّر المفتاح،
// ويستخدم Replicate كبديل اختياري عند إضافة REPLICATE_API_TOKEN.
export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { person, garment_url, garment_desc } = (await request.json()) as {
          person: string; garment_url: string; garment_desc?: string;
        };
        if (!person || !garment_url) return json({ error: "missing inputs" }, 400);

        const desc = (garment_desc || "the provided garment").trim();
        const prompt = [
          `Dress the same person from the first image with: ${desc}.`,
          `Use the second image as the garment reference — match color, pattern, texture, neckline and silhouette faithfully.`,
          `Keep the face 100% identical (geometry, eyes, nose, mouth, skin, freckles, hair, expression, pose).`,
          `Do NOT alter or beautify the face. Preserve background, lighting and camera angle.`,
          `Replace ONLY the clothing on the torso/body. Output: photorealistic, clean edges, single subject, no watermark.`,
          `Return the edited image only.`,
        ].join(" ");

        if (process.env.LOVABLE_API_KEY) {
          const r = await aiEditImage(prompt, [person, garment_url]);
          if (r.ok) return json({ result_url: r.dataUrl });
          if (!process.env.REPLICATE_API_TOKEN) return json({ error: r.error }, r.status);
        }

        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) return json({ error: "AI service unavailable" }, 503);

        const model = process.env.REPLICATE_TRYON_MODEL || "black-forest-labs/flux-kontext-pro";
        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
            body: JSON.stringify({
              input: { input_image: person, image_reference: garment_url, prompt, output_format: "jpg", safety_tolerance: 2 },
            }),
          },
        );
        const pred = await create.json();
        if (!create.ok) return json({ error: pred?.detail || pred?.error || "create failed" }, 500);

        let status = pred.status as string, out = pred.output;
        const id = pred.id;
        for (let i = 0; i < 90 && (status === "starting" || status === "processing"); i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const p = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const j = await p.json();
          status = j.status; out = j.output;
        }
        if (status !== "succeeded") return json({ error: `status=${status}` }, 500);
        const url = Array.isArray(out) ? out[0] : out;
        return json({ result_url: url });
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
