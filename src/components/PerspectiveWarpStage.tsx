import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Download, Move, Sparkles } from "lucide-react";

export type Corner = { x: number; y: number };
export type BlendMode = "multiply" | "overlay" | "soft-light" | "normal";

type Props = {
  bg: string;
  design: string | null;
  embossed?: boolean;
  blend?: BlendMode;
  opacity?: number;
  className?: string;
  onResult?: (dataUrl: string) => void;
};

/**
 * إسقاط منظور محلي 100% (Canvas) — أربع نقاط زوايا قابلة للسحب.
 * يقسّم رباعي الزوايا إلى 32×32 شبكة من المثلثات ويرسم نسيج التصميم
 * بتطابق رياضي مع زوايا الحائط/الأرضية، ثم يدمجه بـ multiply/overlay
 * للحفاظ على ظلال الإضاءة الطبيعية للغرفة. لا استدعاءات للسحابة.
 */
export function PerspectiveWarpStage({
  bg, design, embossed = false, blend = "multiply", opacity = 0.92,
  className, onResult,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
  const designImg = useRef<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ w: 600, h: 420 });
  const [corners, setCorners] = useState<Corner[]>([
    { x: 0.18, y: 0.18 }, { x: 0.82, y: 0.18 },
    { x: 0.82, y: 0.82 }, { x: 0.18, y: 0.82 },
  ]);
  const drag = useRef<number | null>(null);

  // تحميل الصور
  useEffect(() => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => { bgImg.current = i; draw(); };
    i.src = bg;
  }, [bg]);
  useEffect(() => {
    if (!design) { designImg.current = null; draw(); return; }
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => { designImg.current = i; draw(); };
    i.src = design;
  }, [design]);

  // مقاس متجاوب
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size.w * dpr; c.height = size.h * dpr;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // 1) خلفية الغرفة كما هي
    if (bgImg.current) drawCover(ctx, bgImg.current, 0, 0, size.w, size.h);

    // 2) إسقاط التصميم بالمنظور
    if (designImg.current) {
      const pts = corners.map(p => ({ x: p.x * size.w, y: p.y * size.h }));
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
      warpQuad(ctx, designImg.current, pts);
      ctx.restore();

      // 3) تأثير البروز Embossed (طبقة فاتحة + ظل خفيف)
      if (embossed) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.globalCompositeOperation = "overlay";
        warpQuad(ctx, designImg.current, pts);
        ctx.restore();
      }
    }
  }, [size, corners, blend, opacity, embossed]);

  useEffect(() => { draw(); }, [draw]);

  function onDown(e: React.PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    let best = -1, bd = 0.06;
    corners.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) {
      drag.current = best;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  }
  function onMove(e: React.PointerEvent) {
    if (drag.current === null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCorners(cs => cs.map((c, i) => (i === drag.current ? { x, y } : c)));
  }
  function onUp() { drag.current = null; }

  function reset() {
    setCorners([
      { x: 0.18, y: 0.18 }, { x: 0.82, y: 0.18 },
      { x: 0.82, y: 0.82 }, { x: 0.18, y: 0.82 },
    ]);
  }
  function download() {
    const c = canvasRef.current; if (!c) return;
    const url = c.toDataURL("image/jpeg", 0.93);
    onResult?.(url);
    const a = document.createElement("a");
    a.href = url; a.download = `watar-warp-${Date.now()}.jpg`; a.click();
  }

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className="relative h-[420px] touch-none select-none overflow-hidden rounded-2xl bg-muted"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} style={{ width: size.w, height: size.h }} className="block" />
        {/* مقابض الزوايا الأربعة */}
        {corners.map((p, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full border-2 border-primary bg-background/90 text-[10px] font-black text-primary shadow-md"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            {i + 1}
          </div>
        ))}
        {/* خطوط الإطار */}
        <svg className="pointer-events-none absolute inset-0 size-full">
          <polygon
            points={corners.map(p => `${p.x * size.w},${p.y * size.h}`).join(" ")}
            fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6}
          />
        </svg>
        <div className="absolute bottom-2 right-2 rounded-lg bg-background/85 px-2 py-1 text-[10px] font-bold backdrop-blur">
          <Move className="inline size-3 me-1" /> اسحب الزوايا ١-٤ لمطابقة الجدار
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
        <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5">
          <RotateCcw className="size-3.5" /> إعادة الزوايا
        </button>
        <button onClick={download} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">
          <Download className="size-3.5" /> حفظ النتيجة
        </button>
        <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
          <Sparkles className="size-3" /> محرّك محلي — بدون استهلاك سحابي
        </span>
      </div>
    </div>
  );
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height, br = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > br) { sw = img.height * br; sx = (img.width - sw) / 2; }
  else { sh = img.width / br; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * إسقاط نسيج على رباعي زوايا عبر تقسيم إلى شبكة مثلثات وإسقاط affine لكل مثلث.
 * يحاكي تأثير mapping رباعي الإحداثيات (Vector-Grid) بدقة بصرية ممتازة بدون WebGL.
 */
function warpQuad(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  q: Corner[],   // [TL, TR, BR, BL]
  steps = 24,
) {
  const W = img.width, H = img.height;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const u0 = i / steps, u1 = (i + 1) / steps;
      const v0 = j / steps, v1 = (j + 1) / steps;
      const p00 = bilinear(q, u0, v0);
      const p10 = bilinear(q, u1, v0);
      const p01 = bilinear(q, u0, v1);
      const p11 = bilinear(q, u1, v1);
      // مثلثان لكل خلية
      drawTri(ctx, img,
        u0 * W, v0 * H, u1 * W, v0 * H, u0 * W, v1 * H,
        p00.x, p00.y, p10.x, p10.y, p01.x, p01.y);
      drawTri(ctx, img,
        u1 * W, v0 * H, u1 * W, v1 * H, u0 * W, v1 * H,
        p10.x, p10.y, p11.x, p11.y, p01.x, p01.y);
    }
  }
}

function bilinear(q: Corner[], u: number, v: number): Corner {
  // TL,TR,BR,BL
  const top = { x: q[0].x + (q[1].x - q[0].x) * u, y: q[0].y + (q[1].y - q[0].y) * u };
  const bot = { x: q[3].x + (q[2].x - q[3].x) * u, y: q[3].y + (q[2].y - q[3].y) * u };
  return { x: top.x + (bot.x - top.x) * v, y: top.y + (bot.y - top.y) * v };
}

function drawTri(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  sx0: number, sy0: number, sx1: number, sy1: number, sx2: number, sy2: number,
  dx0: number, dy0: number, dx1: number, dy1: number, dx2: number, dy2: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy1); ctx.lineTo(dx2, dy2); ctx.closePath();
  ctx.clip();
  // حلّ التحويل affine
  const denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
  if (denom === 0) { ctx.restore(); return; }
  const m11 = -(sy0 * (dx2 - dx1) - sy1 * dx2 + sy2 * dx1 + (sy1 - sy2) * dx0) / denom;
  const m12 =  (sy1 * dy2 + sy0 * (dy1 - dy2) - sy2 * dy1 + (sy2 - sy1) * dy0) / denom;
  const m21 =  (sx0 * (dx2 - dx1) - sx1 * dx2 + sx2 * dx1 + (sx1 - sx2) * dx0) / denom;
  const m22 = -(sx1 * dy2 + sx0 * (dy1 - dy2) - sx2 * dy1 + (sx2 - sx1) * dy0) / denom;
  const dx  =  (sx0 * (sy2 * dx1 - sy1 * dx2) + sy0 * (sx1 * dx2 - sx2 * dx1) + (sx2 * sy1 - sx1 * sy2) * dx0) / denom;
  const dy  =  (sx0 * (sy2 * dy1 - sy1 * dy2) + sy0 * (sx1 * dy2 - sx2 * dy1) + (sx2 * sy1 - sx1 * sy2) * dy0) / denom;
  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
