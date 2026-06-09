import { createFileRoute } from "@tanstack/react-router";
import { getLovableApiKey } from "@/lib/ai-gateway.server";

// توليد/تعديل صورة عبر Lovable AI Gateway (Gemini Image)
// المدخلات: prompt (نص)، image (اختياري base64 data URL) لتعديل صورة قائمة.
export const Route = createFileRoute("/api/ai-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let key: string;
        try { key = getLovableApiKey(); } catch {
          return json({ error: "LOVABLE_API_KEY مفقود — فعّل Lovable AI" }, 500);
        }
        const { prompt, image } = (await request.json()) as { prompt?: string; image?: string };
        if (!prompt || prompt.trim().length < 3) return json({ error: "اكتب وصفاً للصورة" }, 400);

        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "text", text: prompt },
        ];
        if (image && image.startsWith("data:image")) {
          content.push({ type: "image_url", image_url: { url: image } });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return json({ error: data?.error?.message || `فشل التوليد (${res.status})` }, res.status);
        }
        // استخراج الصورة المُولّدة من الاستجابة (تنسيق OpenRouter)
        const msg = data?.choices?.[0]?.message;
        const imgUrl: string | undefined =
          msg?.images?.[0]?.image_url?.url ||
          msg?.images?.[0]?.url ||
          (Array.isArray(msg?.content) ? msg.content.find((c: { image_url?: { url: string } }) => c.image_url)?.image_url?.url : undefined);
        if (!imgUrl) return json({ error: "لم يتم استلام صورة" }, 502);
        return json({ image_url: imgUrl });
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
