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

type Corner = "nw" | "ne" | "sw" | "se";
type Mode = "drag" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | "resize-x" | "resize-y" | "rotate";

type Props = {
  src: string;
  name?: string;
  box: DesignBox;
  onChange: (b: DesignBox) => void;
  container: React.RefObject<HTMLDivElement | null>;
  embossed?: boolean;
  lockAspect?: boolean;
};
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
export function DraggableDesignLayer({ src, name, box, onChange, container, embossed, lockAspect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"drag" | "resize" | "resize-x" | "resize-y" | "rotate" | null>(null);
  const start = useRef<{ px: number; py: number; box: DesignBox; cx?: number; cy?: number } | null>(null);

  // Multi-touch pinch state — tracks two active pointers to scale the design
  // symmetrically from its center without distorting the image content.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; box: DesignBox } | null>(null);

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

  // Pinch-to-zoom handlers attached to the drag surface
  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStart.current = { dist, box: { ...box } };
      setMode(null); // stop drag while pinching
      return;
    }
    onDown("drag")(e);
  }, [box, onDown]);

  useEffect(() => {
    function onPointerMoveAll(e: PointerEvent) {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size >= 2 && pinchStart.current) {
        const [a, b] = Array.from(pointers.current.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const scale = Math.max(0.2, Math.min(4, dist / Math.max(8, pinchStart.current.dist)));
        const s = pinchStart.current.box;
        // Scale symmetrically around the design center — image aspect preserved.
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const nw = Math.max(4, Math.min(200, s.w * scale));
        const nh = Math.max(4, Math.min(200, s.h * scale));
        onChange({ ...s, w: nw, h: nh, x: cx - nw / 2, y: cy - nh / 2 });
      }
    }
    function onPointerUpAll(e: PointerEvent) {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchStart.current = null;
    }
    window.addEventListener("pointermove", onPointerMoveAll);
    window.addEventListener("pointerup", onPointerUpAll);
    window.addEventListener("pointercancel", onPointerUpAll);
    return () => {
      window.removeEventListener("pointermove", onPointerMoveAll);
      window.removeEventListener("pointerup", onPointerUpAll);
      window.removeEventListener("pointercancel", onPointerUpAll);
    };
  }, [onChange]);

  useEffect(() => {
    if (!mode) return;
    function onMove(e: PointerEvent) {
      if (pointers.current.size >= 2) return; // pinch takes over
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
        let nw = Math.max(4, Math.min(200, s.box.w + dx));
        let nh = Math.max(4, Math.min(200, s.box.h + dy));
        if (lockAspect && s.box.h > 0) {
          const ratio = s.box.w / s.box.h;
          const scale = Math.max(nw / s.box.w, nh / s.box.h);
          nw = Math.max(4, Math.min(200, s.box.w * scale));
          nh = Math.max(4, Math.min(200, nw / ratio));
        }
        onChange({ ...s.box, w: nw, h: nh });
      } else if (mode === "resize-x") {
        const nw = Math.max(4, Math.min(200, s.box.w + dx));
        const nh = lockAspect && s.box.w > 0 ? Math.max(4, Math.min(200, (nw / s.box.w) * s.box.h)) : s.box.h;
        onChange({ ...s.box, w: nw, h: nh });
      } else if (mode === "resize-y") {
        const nh = Math.max(4, Math.min(200, s.box.h + dy));
        const nw = lockAspect && s.box.h > 0 ? Math.max(4, Math.min(200, (nh / s.box.h) * s.box.w)) : s.box.w;
        onChange({ ...s.box, w: nw, h: nh });
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
  }, [mode, container, onChange, lockAspect]);

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
        className="size-full rounded-lg object-contain shadow-2xl ring-1 ring-white/20"
        style={{ imageRendering: "crisp-edges", filter: cssFilter } as React.CSSProperties}
      />
      {/* drag surface — also captures pinch-to-zoom with two fingers */}
      <button
        onPointerDown={onDragPointerDown}
        aria-label="سحب التصميم — قرصة بإصبعين للتكبير"
        className="absolute inset-0 cursor-move opacity-0"
        style={{ touchAction: "none" }}
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
