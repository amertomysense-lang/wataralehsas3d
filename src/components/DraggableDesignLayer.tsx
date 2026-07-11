import { useCallback, useEffect, useRef, useState } from "react";
import { Move, Maximize2, RotateCw } from "lucide-react";

export type DesignBox = {
  x: number; y: number; w: number; h: number;
  opacity: number;
  rotation: number;      // درجات
  blur: number;          // px
  brightness: number;    // 0.5–1.6
  saturation: number;    // 0.5–2
  contrast: number;      // 0.5–1.6
  blendMode: React.CSSProperties["mixBlendMode"];
};

type Props = {
  src: string;
  name?: string;
  box: DesignBox;
  onChange: (b: DesignBox) => void;
  container: React.RefObject<HTMLDivElement | null>;
  embossed?: boolean;
  lockAspect?: boolean;
};

/**
 * طبقة تصميم فوق صورة الجدار الثابتة:
 * سحب حر + تكبير من الزاوية + تدوير من مقبض علوي +
 * تأثيرات (شفافية/طمس/إشراق/تشبع/تباين/وضع مزج) + بروز UV.
 */
export function DraggableDesignLayer({ src, name, box, onChange, container, embossed }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"drag" | "resize" | "resize-x" | "resize-y" | "rotate" | null>(null);
  const start = useRef<{ px: number; py: number; box: DesignBox; cx?: number; cy?: number } | null>(null);

  const onDown = useCallback((m: "drag" | "resize" | "resize-x" | "resize-y" | "rotate") => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setMode(m);
    const rect = container.current?.getBoundingClientRect();
    start.current = {
      px: e.clientX, py: e.clientY, box: { ...box },
      cx: rect ? rect.left + ((box.x + box.w / 2) / 100) * rect.width : 0,
      cy: rect ? rect.top + ((box.y + box.h / 2) / 100) * rect.height : 0,
    };
  }, [box, container]);

  useEffect(() => {
    if (!mode) return;
    function onMove(e: PointerEvent) {
      const s = start.current; const c = container.current;
      if (!s || !c) return;
      const rect = c.getBoundingClientRect();
      const dx = ((e.clientX - s.px) / rect.width) * 100;
      const dy = ((e.clientY - s.py) / rect.height) * 100;
      if (mode === "drag") {
        onChange({
          ...s.box,
          x: Math.max(-20, Math.min(120 - s.box.w, s.box.x + dx)),
          y: Math.max(-20, Math.min(120 - s.box.h, s.box.y + dy)),
        });
      } else if (mode === "resize") {
        onChange({
          ...s.box,
          w: Math.max(4, Math.min(200, s.box.w + dx)),
          h: Math.max(4, Math.min(200, s.box.h + dy)),
        });
      } else if (mode === "resize-x") {
        onChange({ ...s.box, w: Math.max(4, Math.min(200, s.box.w + dx)) });
      } else if (mode === "resize-y") {
        onChange({ ...s.box, h: Math.max(4, Math.min(200, s.box.h + dy)) });
      } else if (mode === "rotate") {
        const angle = Math.atan2(e.clientY - (s.cy ?? 0), e.clientX - (s.cx ?? 0)) * (180 / Math.PI) + 90;
        onChange({ ...s.box, rotation: Math.round(angle) });
      }
    }

    function onUp() { setMode(null); start.current = null; }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [mode, container, onChange]);

  const embossFilter = embossed ? "url(#watar-emboss)" : "";
  const embossShadow = embossed
    ? "drop-shadow(0 1px 0 rgba(0,0,0,.55)) drop-shadow(0 -1px 0 rgba(255,255,255,.35))"
    : "";
  const cssFilter = [
    `blur(${box.blur}px)`,
    `brightness(${box.brightness})`,
    `saturate(${box.saturation})`,
    `contrast(${box.contrast})`,
    embossFilter,
    embossShadow,
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className="absolute touch-none select-none"
      style={{
        left: `${box.x}%`, top: `${box.y}%`,
        width: `${box.w}%`, height: `${box.h}%`,
        opacity: box.opacity,
        mixBlendMode: box.blendMode,
        transform: `rotate(${box.rotation}deg)`,
        transformOrigin: "center",
      }}
    >
      {embossed && (
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="watar-emboss">
            <feConvolveMatrix order="3" kernelMatrix="-2 -1 0  -1 1 1  0 1 2" preserveAlpha="true" />
            <feColorMatrix type="saturate" values="1.4" />
          </filter>
        </svg>
      )}
      <img
        src={src}
        alt={name ?? "design"}
        draggable={false}
        decoding="async"
        className="size-full rounded-lg object-cover shadow-2xl ring-1 ring-white/20"
        style={{ imageRendering: "crisp-edges", filter: cssFilter } as React.CSSProperties}
      />
      {/* drag surface */}
      <button
        onPointerDown={onDown("drag")}
        aria-label="سحب التصميم"
        className="absolute inset-0 cursor-move opacity-0"
      >drag</button>

      {/* selection border */}
      <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-primary/70" />

      {/* rotate handle (top) */}
      <button
        onPointerDown={onDown("rotate")}
        aria-label="تدوير"
        title="تدوير"
        className="absolute -top-8 left-1/2 -translate-x-1/2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "grab" }}
      >
        <RotateCw className="size-3.5" />
      </button>

      {/* drag chip */}
      <span className="pointer-events-none absolute -top-3 right-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow">
        <Move className="size-3" /> اسحب
      </span>
      {embossed && (
        <span className="pointer-events-none absolute -top-3 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-accent-foreground shadow">
          بروز +30%
        </span>
      )}

      {/* resize handle (both axes) */}
      <button
        onPointerDown={onDown("resize")}
        aria-label="تكبير وتصغير"
        title="تمديد بالعرض والارتفاع"
        className="absolute -left-1 -bottom-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "nwse-resize" }}
      >
        <Maximize2 className="size-3.5" />
      </button>

      {/* stretch handle — horizontal (width only) */}
      <button
        onPointerDown={onDown("resize-x")}
        aria-label="تمديد عرضاً"
        title="تمديد/تقليص العرض"
        className="absolute -left-2 top-1/2 -translate-y-1/2 h-10 w-3 rounded-full bg-primary/90 text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "ew-resize" }}
      />
      <button
        onPointerDown={onDown("resize-x")}
        aria-label="تمديد عرضاً"
        title="تمديد/تقليص العرض"
        className="absolute -right-2 top-1/2 -translate-y-1/2 h-10 w-3 rounded-full bg-primary/90 text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "ew-resize" }}
      />

      {/* stretch handle — vertical (height only) */}
      <button
        onPointerDown={onDown("resize-y")}
        aria-label="تمديد ارتفاعاً"
        title="تمديد/تقليص الارتفاع"
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-3 w-10 rounded-full bg-primary/90 text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "ns-resize" }}
      />
      <button
        onPointerDown={onDown("resize-y")}
        aria-label="تمديد ارتفاعاً"
        title="تمديد/تقليص الارتفاع"
        className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-10 rounded-full bg-primary/90 text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "ns-resize" }}
      />

    </div>
  );
}

export function resetBox(): DesignBox {
  return {
    x: 18, y: 20, w: 55, h: 45,
    opacity: 0.9, rotation: 0,
    blur: 0, brightness: 1, saturation: 1, contrast: 1,
    blendMode: "normal",
  };
}
