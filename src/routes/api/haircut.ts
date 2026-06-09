import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";

// تحرير قصّة الشعر — يفضّل Lovable AI (Nano Banana 2) عند توفّر المفتاح،
// ويُستخدم Replicate كبديل اختياري إن أُضيف REPLICATE_API_TOKEN.
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { person, style, color } = (await request.json()) as {
          person: string; style?: string; color?: string;
        };
        if (!person) return json({ error: "missing person image" }, 400);

        const styleText = (style?.trim() || "modern stylish haircut").replace(/\s+/g, " ");
        const colorText = color?.trim() ? `, hair color: ${color.trim()}` : "";
        const prompt = [
          `Edit the photo: change ONLY the hairstyle of the person to: ${styleText}${colorText}.`,
          `Keep face geometry, eyes, nose, mouth, jaw, skin tone, freckles and expression 100% identical.`,
          `Do NOT smooth, retouch, beautify, slim or alter the face. Preserve clothing, background, lighting and framing.`,
          `Hair edges must be clean and natural. Output: photorealistic, sharp, single subject, no watermark.`,
          `Return the edited image only.`,
        ].join(" ");

        // 1) المسار المفضّل: Lovable AI Gateway (مغطى برصيد المشروع)
        if (process.env.LOVABLE_API_KEY) {
          const r = await aiEditImage(prompt, [person]);
          if (r.ok) return json({ result_url: r.dataUrl });
          // إن فشل لأي سبب (402/429/شبكة) ينتقل تلقائياً لـ Replicate إن وُجد
          if (!process.env.REPLICATE_API_TOKEN) {
            return json({ error: r.error }, r.status);
          }
        }

        // 2) المسار البديل: Replicate (اختياري)
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) return json({ error: "AI service unavailable" }, 503);

        const model = process.env.REPLICATE_HAIRCUT_MODEL || "black-forest-labs/flux-kontext-pro";
        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
            body: JSON.stringify({
              input: { input_image: person, prompt, output_format: "jpg", safety_tolerance: 2 },
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
