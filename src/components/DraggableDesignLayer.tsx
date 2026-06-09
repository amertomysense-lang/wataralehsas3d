import { useCallback, useEffect, useRef, useState } from "react";
import { Move, Maximize2, RotateCcw } from "lucide-react";

export type DesignBox = { x: number; y: number; w: number; h: number; opacity: number };

type Props = {
  src: string;
  name?: string;
  box: DesignBox;
  onChange: (b: DesignBox) => void;
  container: React.RefObject<HTMLDivElement>;
};

/**
 * طبقة تصميم قابلة للسحب والتحجيم فوق صورة الجدار الثابتة.
 * الجدار يبقى ثابتاً والمستخدم يحرّك ويحجّم التصميم على المكان المطلوب
 * مما يسمح بقياس دقيق للمساحة المطبوعة.
 */
export function DraggableDesignLayer({ src, name, box, onChange, container }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"drag" | "resize" | null>(null);
  const start = useRef<{ px: number; py: number; box: DesignBox } | null>(null);

  const onDown = useCallback((m: "drag" | "resize") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setMode(m);
    start.current = { px: e.clientX, py: e.clientY, box: { ...box } };
  }, [box]);

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
          x: Math.max(0, Math.min(100 - s.box.w, s.box.x + dx)),
          y: Math.max(0, Math.min(100 - s.box.h, s.box.y + dy)),
        });
      } else {
        onChange({
          ...s.box,
          w: Math.max(10, Math.min(100 - s.box.x, s.box.w + dx)),
          h: Math.max(10, Math.min(100 - s.box.y, s.box.h + dy)),
        });
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

  return (
    <div
      ref={ref}
      className="absolute touch-none select-none"
      style={{
        left: `${box.x}%`, top: `${box.y}%`,
        width: `${box.w}%`, height: `${box.h}%`,
        opacity: box.opacity,
        mixBlendMode: "multiply",
      }}
    >
      <img src={src} alt={name ?? "design"} draggable={false}
        className="size-full rounded-lg object-cover shadow-2xl" />
      {/* drag overlay */}
      <button onPointerDown={onDown("drag")}
        aria-label="سحب التصميم"
        className="absolute inset-0 cursor-move opacity-0">drag</button>
      {/* drag chip */}
      <span className="pointer-events-none absolute -top-3 right-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow">
        <Move className="size-3" /> اسحب
      </span>
      {/* resize handle */}
      <button onPointerDown={onDown("resize")}
        aria-label="تكبير وتصغير"
        className="absolute -left-1 -bottom-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background"
        style={{ cursor: "nwse-resize" }}>
        <Maximize2 className="size-3" />
      </button>
    </div>
  );
}

export function resetBox(): DesignBox {
  return { x: 15, y: 18, w: 60, h: 55, opacity: 0.85 };
}

export { RotateCcw };
