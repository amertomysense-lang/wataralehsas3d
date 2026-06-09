import { createFileRoute } from "@tanstack/react-router";
import { aiEditImage } from "@/lib/ai-image-edit.server";

// إسقاط منظوري واقعي للديكور — ينسج الخامة على الجدار/الأرضية بتدرّج المنظور والظلال
export const Route = createFileRoute("/api/decor-project")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { room, design, design_desc, surface, embossed } = (await request.json()) as {
          room: string; design: string; design_desc?: string;
          surface?: "wall" | "floor" | "ceiling"; embossed?: boolean;
        };
        if (!room || !design) return json({ error: "missing inputs" }, 400);

        const target = surface === "floor" ? "floor" : surface === "ceiling" ? "ceiling" : "main visible wall";
        const desc = (design_desc || "the decorative pattern shown in the second image").trim();
        const embossedClause = embossed
          ? `Add a tactile ~30% embossed relief: subtle raised geometry with self-shadowing on the pattern edges that responds to the scene lighting direction.`
          : `Keep the surface flat and matte unless the pattern naturally implies sheen.`;

        const prompt = [
          `Architectural interior compositing. INPUT 1 = the real room photo. INPUT 2 = decorative design reference (${desc}).`,
          `TASK: Project the design from INPUT 2 onto the ${target} of INPUT 1 with photoreal perspective.`,
          `PERSPECTIVE MATRIX: Detect the room's vanishing points, surface normals and corner vectors. Bend, scale and foreshorten the design along the surface plane so vertical lines stay vertical, horizontal patterns recede toward the vanishing point, and the design wraps correctly around real corners, pillars, sockets and moldings.`,
          `OCCLUSION & DEPTH: Place the design BEHIND any foreground furniture, lamps, plants, frames or people. Respect existing shadow casts, ambient occlusion in corners, and contact shadows under furniture.`,
          `LIGHT MATCH: Re-light the projected design with the scene's light direction, color temperature and intensity. Preserve highlights, reflections on glossy materials, and softness of shadows.`,
          embossedClause,
          `LOCK: Do NOT change room geometry, furniture, windows, doors, ceiling, floor outline, people or framing. Only the ${target} surface receives the new pattern.`,
          `OUTPUT: One photorealistic interior render, sharp, natural film grain, no watermark, no text. Return ONLY the composited image.`,
        ].join(" ");

        if (process.env.LOVABLE_API_KEY) {
          const r = await aiEditImage(prompt, [room, design]);
          if (r.ok) return json({ result_url: r.dataUrl });
          return json({ error: r.error }, r.status);
        }
        return json({ error: "AI service unavailable" }, 503);
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
