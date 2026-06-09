import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";

// تحرير قصّة الشعر — قفل هوية صارم + تعديل حدود الشعر فقط
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
        const { person, style, color, hairstyle_url } = (await request.json()) as {
          person: string; style?: string; color?: string; hairstyle_url?: string;
        };
        if (!person) return json({ error: "missing person image" }, 400);


        const styleText = (style?.trim() || "modern stylish haircut").replace(/\s+/g, " ");
        const colorText = color?.trim() ? `, hair color: ${color.trim()}` : "";
        const refClause = hairstyle_url
          ? `Use the second image strictly as a STYLE REFERENCE for hair shape, length, parting and texture — do NOT copy its face, skin, lighting or background.`
          : ``;

        // برومبت محترف يحاكي تأثير IP-Adapter Face + ControlNet Hair Boundary
        const prompt = [
          `Identity-locked photo edit. INPUT 1 = the real person (source of truth).`,
          refClause,
          `TASK: Re-synthesize ONLY the hair region of the person to match this hairstyle: ${styleText}${colorText}.`,
          `STRICT IDENTITY LOCK: Treat the face as a fixed mask. Preserve 100% of facial geometry, eye shape & color, eyebrows, nose, mouth, lips, jawline, chin, ears, skin tone, freckles, moles, beard/stubble, neck, age, gender, ethnicity and original expression. Do NOT smooth, slim, beautify, retouch, age, de-age or alter the face in any way.`,
          `HAIR BOUNDARY: Re-grow hair organically from the actual scalp topology. Match natural hairline, scalp curvature, baby hairs, follicle direction, root density, shine and stray strands. Blend hair edges seamlessly with the forehead, temples and ears. No stamping, no flat overlay, no cap-like silhouette.`,
          `CONTEXT LOCK: Preserve the original clothing, background, camera angle, framing, focal length, lighting direction, color temperature, shadows and depth of field exactly.`,
          `OUTPUT: A single photorealistic image, sharp, natural film grain, no watermark, no text, no extra people. Return ONLY the edited image.`,
        ].filter(Boolean).join(" ");

        const inputs = hairstyle_url ? [person, hairstyle_url] : [person];

        // 1) Lovable AI Gateway (Nano Banana)
        if (process.env.LOVABLE_API_KEY) {
          const r = await aiEditImage(prompt, inputs);
          if (r.ok) return json({ result_url: r.dataUrl });
          if (!process.env.REPLICATE_API_TOKEN) {
            return json({ error: r.error }, r.status);
          }
        }

        // 2) Replicate fallback
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) return json({ error: "AI service unavailable" }, 503);

        // نموذج متخصّص بتغيير الشعر مع قفل الوجه — يحافظ على الملامح والبشرة والعينين
        const model = process.env.REPLICATE_HAIRCUT_MODEL || "flux-kontext-apps/change-haircut";
        const isChangeHaircut = model.includes("change-haircut");
        const input = isChangeHaircut
          ? {
              input_image: person,
              haircut: styleText,
              hair_color: color?.trim() || "No change",
              aspect_ratio: "match_input_image",
              output_format: "jpg",
              safety_tolerance: 2,
            }
          : { input_image: person, prompt, output_format: "jpg", safety_tolerance: 2 };

        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
            body: JSON.stringify({ input }),
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
        if (status !== "succeeded") return json({ error: `status=${status}`, fallback: true }, 200);
        const url = Array.isArray(out) ? out[0] : out;
        return json({ result_url: url });
        } catch (e) {
          console.error("/api/haircut failed:", e);
          return json({ error: e instanceof Error ? e.message : String(e), fallback: true }, 200);
        }
      },

    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
