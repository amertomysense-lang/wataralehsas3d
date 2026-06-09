import { createFileRoute } from "@tanstack/react-router";

// Haircut عالي الدقة — FLUX Kontext مع قيود هوية وجه صارمة لمنع التشوّه.
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
          return json({ error: "أضف REPLICATE_API_TOKEN لتفعيل تجربة قصّات الشعر بالذكاء الاصطناعي." }, 400);
        }
        const { person, style, color } = (await request.json()) as {
          person: string; style?: string; color?: string;
        };
        if (!person) return json({ error: "missing person image" }, 400);

        const model = process.env.REPLICATE_HAIRCUT_MODEL || "black-forest-labs/flux-kontext-pro";
        const styleText = (style?.trim() || "modern stylish haircut").replace(/\s+/g, " ");
        const colorText = color?.trim() ? `, hair color: ${color.trim()}` : "";
        const prompt = [
          `Change ONLY the hairstyle of the person in the image to: ${styleText}${colorText}.`,
          `CRITICAL identity preservation: keep the face 100% identical — same facial geometry, eyes (shape, color, position), eyebrows, nose, mouth, jawline, skin tone, skin texture, freckles, age and expression.`,
          `Do NOT smooth, retouch, beautify, slim, or alter the face in any way. Do not change ethnicity, gender, or age.`,
          `Preserve clothing, background, lighting direction, shadows and camera framing exactly.`,
          `Hair edges must be clean and natural; remove any overlapping noise, glitches or artifacts around the head.`,
          `Output: photorealistic, natural lighting, sharp detail, no watermark, no extra people, single subject only.`,
        ].join(" ");

        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
            body: JSON.stringify({
              input: {
                input_image: person,
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
