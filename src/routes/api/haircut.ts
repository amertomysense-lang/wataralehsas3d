import { createFileRoute } from "@tanstack/react-router";

// تحرير قصّة الشعر — Replicate مباشر (بدون بوّابة Lovable) باستخدام مفتاح المالك
export const Route = createFileRoute("/api/haircut")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { person, style, color, hairstyle_url } = (await request.json()) as {
            person: string; style?: string; color?: string; hairstyle_url?: string;
          };
          if (!person) return json({ error: "missing person image" }, 400);

          const token =
            process.env.REPLICATE_API_TOKEN ||
            process.env.VITE_REPLICATE_API_TOKEN;

          // وضع المحاكاة التلقائي — لا أعطال على العميل
          if (!token) {
            return json({
              fallback: true,
              error: "REPLICATE_API_TOKEN missing — switching to local preview mode",
            });
          }

          const styleText = (style?.trim() || "modern stylish haircut").replace(/\s+/g, " ");
          const colorText = color?.trim() ? `, hair color: ${color.trim()}` : "";
          const refClause = hairstyle_url
            ? `Use the second image strictly as a STYLE REFERENCE for hair shape, length, parting and texture — do NOT copy its face, skin, lighting or background.`
            : ``;

          const prompt = [
            `Identity-locked photo edit. INPUT 1 = the real person (source of truth).`,
            refClause,
            `TASK: Re-synthesize ONLY the hair region to match: ${styleText}${colorText}.`,
            `STRICT IDENTITY LOCK: Treat the face as a fixed mask. Preserve 100% of facial geometry, eyes, eyebrows, nose, mouth, jawline, ears, skin tone, freckles, age and expression.`,
            `HAIR BOUNDARY: Re-grow hair organically from the actual scalp topology. Natural hairline, baby hairs, follicle direction, shine and stray strands. Blend edges seamlessly. No stamping, no flat overlay.`,
            `CONTEXT LOCK: Preserve clothing, background, camera angle, lighting and shadows exactly.`,
            `OUTPUT: One photorealistic image. Return ONLY the edited image.`,
          ].filter(Boolean).join(" ");

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
          if (!create.ok) {
            const msg = String(pred?.detail || pred?.error || "create failed");
            return json({ error: msg, fallback: true });
          }

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
          if (status !== "succeeded") return json({ error: `status=${status}`, fallback: true });
          const url = Array.isArray(out) ? out[0] : out;
          return json({ result_url: url });
        } catch (e) {
          console.error("/api/haircut failed:", e);
          return json({ error: e instanceof Error ? e.message : String(e), fallback: true });
        }
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
