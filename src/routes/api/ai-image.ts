import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";
import { friendlyAiError, hfGenerateImage } from "@/lib/hf-fallback.server";

// توليد/تعديل صورة عبر Lovable AI Gateway (Gemini Image)
// المدخلات: prompt (نص)، image (اختياري base64 data URL) لتعديل صورة قائمة.
export const Route = createFileRoute("/api/ai-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, image } = (await request.json()) as { prompt?: string; image?: string };
        if (!prompt || prompt.trim().length < 3) return json({ error: "اكتب وصفاً للصورة" }, 400);

        if (process.env.LOVABLE_API_KEY) {
          const primary = await aiEditImage(
            prompt,
            image && image.startsWith("data:image") ? [image] : [],
          );
          if (primary.ok) return json({ image_url: primary.dataUrl });
          console.warn("Lovable AI image route failed, trying HF fallback:", primary.status, primary.error);
        }

        const hf = await hfGenerateImage(prompt);
        if (hf.ok) return json({ image_url: hf.dataUrl, fallback: "hf" });

        return json({ fallback: true, error: friendlyAiError() });
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
