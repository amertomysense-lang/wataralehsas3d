import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";

// تجربة الأزياء — فصل جسم + قفل وجه + إعادة لفّ القماش حول العضلات
export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { person, garment_url, garment_desc } = (await request.json()) as {
          person: string; garment_url: string; garment_desc?: string;
        };
        if (!person || !garment_url) return json({ error: "missing inputs" }, 400);

        const desc = (garment_desc || "the garment shown in the second image").trim();

        // برومبت محترف يحاكي IDM-VTON / segmentation mask + drape physics
        const prompt = [
          `Virtual try-on photo edit. INPUT 1 = real person (human_img). INPUT 2 = garment reference (garm_img).`,
          `TASK: Dress the person from INPUT 1 with the garment from INPUT 2 (${desc}).`,
          `BODY SEGMENTATION: Detect the person's body silhouette precisely. Fully discard the old clothing textures, prints, seams and shadows. Do NOT blend the new garment on top of the old one.`,
          `GARMENT SYNTHESIS: Reproduce the garment's exact color, pattern repeats, fabric texture, weave, sheen, neckline, sleeves, hem length, buttons, zippers and silhouette as in INPUT 2. Warp the fabric realistically around shoulders, chest, waist, hips, arms and any muscle/body contours, with natural folds, creases, fabric drape weight, and gravity-correct wrinkles. Zero clipping artifacts. Sleeves must end at the wrists naturally; hems must follow the pose.`,
          `STRICT IDENTITY LOCK: Preserve 100% of the face, eyes, nose, mouth, lips, jawline, skin tone, freckles, hair, age and expression. Preserve the person's pose, hands, fingers, body proportions, height and ethnicity. Do NOT beautify or alter the face.`,
          `CONTEXT LOCK: Keep the original background, lighting direction, color temperature, shadows, camera angle and framing identical. Lighting on the garment must match the scene.`,
          `OUTPUT: One photorealistic image, sharp, natural film grain, no watermark, no text, no duplicate person, no mannequin artifacts. Return ONLY the edited image.`,
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
