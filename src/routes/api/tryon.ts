import { createFileRoute } from "@tanstack/react-router";

// Try-On عالي الدقة — FLUX Kontext (image-edit) مع الحفاظ الصارم على هوية الوجه
// يتجاوز سلوكيات IDM-VTON غير المتوقعة عبر فرض ضوابط هوية ومعالم وجهية.
export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
          return json({ error: "أضف REPLICATE_API_TOKEN لتفعيل التجربة عالية الدقة." }, 500);
        }
        const { person, garment_url, garment_desc } = (await request.json()) as {
          person: string;
          garment_url: string;
          garment_desc?: string;
        };
        if (!person || !garment_url) return json({ error: "missing inputs" }, 400);

        const model = process.env.REPLICATE_TRYON_MODEL || "black-forest-labs/flux-kontext-pro";
        const desc = (garment_desc || "the provided garment").trim();
        const prompt = [
          `Dress the exact same person in the first image with: ${desc}.`,
          `The garment reference is the second image — match its color, pattern, texture, neckline and silhouette faithfully.`,
          `CRITICAL identity preservation: keep the person's face 100% identical — same facial geometry, eyes shape, nose, mouth, skin tone, skin texture, freckles, hair, hairstyle, beard, expression and pose.`,
          `Do NOT alter, smooth, retouch, beautify or change the face in any way. Do not change ethnicity, age, or body proportions.`,
          `Keep the original background, lighting direction, shadows and camera angle unchanged.`,
          `Replace ONLY the clothing visible on the torso/body. Remove any noise, glitches or overlapping artifacts outside the body silhouette.`,
          `Output: photorealistic, natural lighting, high detail, clean edges, no watermark, no extra people, no duplicated limbs.`,
        ].join(" ");

        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
            body: JSON.stringify({
              input: {
                input_image: person,
                image_reference: garment_url,
                prompt,
                output_format: "jpg",
                safety_tolerance: 2,
                prompt_upsampling: false,
              },
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
