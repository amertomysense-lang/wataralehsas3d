import { useMemo } from "react";
import type { Order } from "@/lib/platform";

const COLS: { key: string; label: string; tone: string }[] = [
  { key: "new",       label: "جديد",         tone: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { key: "inspected", label: "معاينة",       tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { key: "active",    label: "قيد التنفيذ",  tone: "bg-primary/15 text-primary border-primary/30" },
  { key: "finished",  label: "منتهي",        tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { key: "done",      label: "منجز",         tone: "bg-success/15 text-success border-success/30" },
  { key: "cancelled", label: "ملغى",         tone: "bg-destructive/15 text-destructive border-destructive/30" },
];

export function KanbanBoard({
  orders,
  onMove,
}: {
  orders: Order[];
  onMove: (id: string, status: string) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, Order[]> = {};
    for (const c of COLS) g[c.key] = [];
    for (const o of orders) {
      const s = (o.status && g[o.status]) ? o.status : "new";
      g[s].push(o);
    }
    return g;
  }, [orders]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {COLS.map((c) => (
        <div
          key={c.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData("text/plain");
            if (id) onMove(id, c.key);
          }}
          className={`rounded-2xl border ${c.tone} min-h-[300px] p-2`}
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
                className="cursor-grab active:cursor-grabbing rounded-xl border border-border bg-background p-2.5 text-xs shadow-sm hover:shadow"
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
          </div>
        </div>
      ))}
    </div>
  );
}
