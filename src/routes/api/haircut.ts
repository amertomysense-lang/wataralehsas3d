import { createFileRoute } from "@tanstack/react-router";

// تحرير صورة الشعر باستخدام نموذج FLUX Kontext من Replicate (يقبل صورة + برومبت).
// يمكن تجاوز النموذج عبر REPLICATE_HAIRCUT_MODEL (مثل: "black-forest-labs/flux-kontext-pro").
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
          return new Response(
            JSON.stringify({
              error:
                "لتفعيل التوليد بالذكاء الاصطناعي أضف مفتاح REPLICATE_API_TOKEN في إعدادات الأسرار. حتى ذلك الحين استخدم زر «حفظ المعاينة» المجاني.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const { person, style, color } = (await request.json()) as {
          person: string;
          style?: string;
          color?: string;
          hairstyle_url?: string;
        };
        if (!person) {
          return new Response(JSON.stringify({ error: "missing person image" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const model = process.env.REPLICATE_HAIRCUT_MODEL || "black-forest-labs/flux-kontext-pro";
        const styleText = style?.trim() || "modern stylish haircut";
        const colorText = color?.trim() ? `, hair color: ${color}` : "";
        const prompt = `Change only the hairstyle of the person to: ${styleText}${colorText}. Keep the same face, identity, skin tone, expression, pose, background and clothing unchanged. Photorealistic, natural lighting, high detail.`;

        const create = await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "wait",
            },
            body: JSON.stringify({
              input: {
                input_image: person,
                prompt,
                output_format: "jpg",
                safety_tolerance: 2,
              },
            }),
          },
        );

        const pred = await create.json();
        if (!create.ok) {
          console.error("Replicate create failed", create.status, pred);
          return new Response(
            JSON.stringify({ error: pred?.detail || pred?.error || "create failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let status = pred.status as string;
        let out = pred.output;
        const id = pred.id;
        for (let i = 0; i < 90 && (status === "starting" || status === "processing"); i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const p = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const j = await p.json();
          status = j.status;
          out = j.output;
        }
        if (status !== "succeeded") {
          console.error("Replicate did not succeed", status, out);
          return new Response(JSON.stringify({ error: `status=${status}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = Array.isArray(out) ? out[0] : out;
        return new Response(JSON.stringify({ result_url: url }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
