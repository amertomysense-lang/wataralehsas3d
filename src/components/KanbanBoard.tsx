import { useMemo } from "react";
import type { Order } from "@/lib/platform";

// المراحل الأربع الرسمية للتشغيل
export const KANBAN_STAGES = [
  { key: "inspection", label: "١. معاينة وتحضير",  tone: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { key: "printing",   label: "٢. طباعة",         tone: "bg-primary/15 text-primary border-primary/30" },
  { key: "varnish",    label: "٣. ورنيش يدوي",    tone: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  { key: "delivered",  label: "٤. تم التسليم",    tone: "bg-success/15 text-success border-success/30" },
] as const;

export type KanbanStage = typeof KANBAN_STAGES[number]["key"];

// خرائط توافقية مع الحالات القديمة
const LEGACY_MAP: Record<string, KanbanStage> = {
  new: "inspection",
  inspected: "inspection",
  active: "printing",
  finished: "varnish",
  done: "delivered",
};

function normalize(s: string | null | undefined): KanbanStage {
  if (!s) return "inspection";
  if (KANBAN_STAGES.some((k) => k.key === s)) return s as KanbanStage;
  return LEGACY_MAP[s] ?? "inspection";
}

export function KanbanBoard({
  orders,
  onMove,
}: {
  orders: Order[];
  onMove: (id: string, status: KanbanStage) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<KanbanStage, Order[]> = { inspection: [], printing: [], varnish: [], delivered: [] };
    for (const o of orders) g[normalize(o.status)].push(o);
    return g;
  }, [orders]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KANBAN_STAGES.map((c) => (
        <div
          key={c.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData("text/plain");
            if (id) onMove(id, c.key);
          }}
          className={`rounded-2xl border ${c.tone} min-h-[320px] p-2`}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-black">{c.label}</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-black">{grouped[c.key].length}</span>
          </div>
          <div className="space-y-2">
            {grouped[c.key].map((o) => (
              <div
                key={o.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                className="cursor-grab active:cursor-grabbing rounded-xl border border-border bg-background p-2.5 text-xs shadow-sm hover:shadow-md transition"
              >
                <p className="line-clamp-1 font-black">{o.design_name ?? "—"}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {o.region_name} · {o.width}×{o.height}م
                </p>
                <p className="mt-1 text-[10px] font-bold text-primary">
                  {Number(o.total).toLocaleString("ar")}
                </p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ar")}
                </p>
              </div>
            ))}
            {grouped[c.key].length === 0 && (
              <p className="rounded-lg border border-dashed border-current/20 py-6 text-center text-[10px] opacity-60">
                اسحب طلباً هنا
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
