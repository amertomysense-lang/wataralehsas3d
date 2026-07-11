import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

/**
 * مقارنة قبل/بعد بسحب مقبض واحد — تعرض صورتين متطابقتين بالحجم
 * وتقص الصورة العلوية بنسبة السحب.
 */
export function BeforeAfterSlider({
  beforeSrc, afterSrc, className = "",
}: { beforeSrc: string; afterSrc: string; className?: string }) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function move(clientX: number) {
    const r = wrapRef.current?.getBoundingClientRect(); if (!r) return;
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }

  return (
    <div
      ref={wrapRef}
      className={`relative select-none overflow-hidden rounded-2xl bg-muted ${className}`}
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <img src={afterSrc} alt="بعد" className="block w-full" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={beforeSrc}
          alt="قبل"
          className="block h-full w-auto max-w-none"
          style={{ width: wrapRef.current?.clientWidth ?? "100%" }}
          draggable={false}
        />
      </div>
      {/* labels */}
      <span className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-black text-background">قبل</span>
      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">بعد</span>
      {/* handle */}
      <div
        className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${pos}%` }}
      >
        <button
          type="button"
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white text-foreground shadow-xl ring-2 ring-primary cursor-ew-resize"
          aria-label="مقارنة"
        >
          <MoveHorizontal className="size-4" />
        </button>
      </div>
      <input
        type="range" min={0} max={100} value={pos}
        onChange={(e) => setPos(+e.target.value)}
        className="absolute inset-x-0 bottom-2 mx-auto w-4/5 accent-primary opacity-0"
        aria-label="نسبة المقارنة"
      />
    </div>
  );
}
