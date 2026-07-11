import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/platform";
import { TrendingUp, ShoppingBag, DollarSign, MapPin, Calendar } from "lucide-react";

export function AdminAnalytics() {
  const { data: orders } = useQuery({
    queryKey: ["orders-analytics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders").select("*")
        .order("created_at", { ascending: false }).limit(1000);
      return (data ?? []) as Order[];
    },
    refetchInterval: 30_000,
  });

  const list = orders ?? [];
  const total = list.length;
  const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
  const today = list.filter((o) => {
    const d = new Date(o.created_at);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  });
  const todayRev = today.reduce((s, o) => s + Number(o.total || 0), 0);
  const weekRev = list
    .filter((o) => Date.now() - new Date(o.created_at).getTime() < 7 * 86400_000)
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const byRegion = new Map<string, { count: number; sum: number }>();
  for (const o of list) {
    const k = o.region_name || "—";
    const prev = byRegion.get(k) || { count: 0, sum: 0 };
    prev.count++; prev.sum += Number(o.total || 0);
    byRegion.set(k, prev);
  }
  const topRegions = [...byRegion.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 5);

  const byStatus = new Map<string, number>();
  for (const o of list) byStatus.set(o.status || "new", (byStatus.get(o.status || "new") || 0) + 1);

  // 14 يوم — إيرادات يومية
  const days: { day: string; sum: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const sum = list
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((s, o) => s + Number(o.total || 0), 0);
    days.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, sum });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.sum));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<ShoppingBag className="size-4" />} label="إجمالي الطلبات" value={total.toLocaleString("ar")} tone="from-primary to-primary-glow" />
        <Stat icon={<Calendar className="size-4" />} label="طلبات اليوم" value={today.length.toLocaleString("ar")} tone="from-emerald-500 to-teal-500" />
        <Stat icon={<DollarSign className="size-4" />} label="إيرادات اليوم" value={todayRev.toLocaleString("ar", { maximumFractionDigits: 0 })} tone="from-amber-500 to-orange-500" />
        <Stat icon={<TrendingUp className="size-4" />} label="إيرادات آخر 7 أيام" value={weekRev.toLocaleString("ar", { maximumFractionDigits: 0 })} tone="from-fuchsia-500 to-pink-500" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-black text-muted-foreground">الإيرادات آخر 14 يوماً</p>
        <div className="flex items-end gap-1.5" style={{ height: 140 }}>
          {days.map((d) => (
            <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary-glow transition group-hover:opacity-80"
                style={{ height: `${(d.sum / maxDay) * 100}%`, minHeight: 2 }}
                title={`${d.day}: ${d.sum.toLocaleString("ar")}`}
              />
              <span className="text-[9px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-muted-foreground">
            <MapPin className="size-3.5 text-primary" /> أعلى المناطق
          </p>
          <div className="space-y-1.5">
            {topRegions.map(([name, s]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-xs">
                <span className="font-bold">{name}</span>
                <span className="text-muted-foreground">
                  {s.count.toLocaleString("ar")} طلب · <b className="text-primary">{s.sum.toLocaleString("ar", { maximumFractionDigits: 0 })}</b>
                </span>
              </div>
            ))}
            {topRegions.length === 0 && <p className="text-center text-[11px] text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-black text-muted-foreground">توزّع الحالات</p>
          <div className="space-y-1.5">
            {[...byStatus.entries()].map(([k, v]) => {
              const pct = total ? (v / total) * 100 : 0;
              return (
                <div key={k}>
                  <div className="mb-0.5 flex items-center justify-between text-[11px] font-bold">
                    <span>{k}</span><span className="text-muted-foreground">{v.toLocaleString("ar")}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {byStatus.size === 0 && <p className="text-center text-[11px] text-muted-foreground">—</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tone} p-3 text-white shadow-soft`}>
      <div className="flex items-center justify-between opacity-90">{icon}<span className="text-[10px] font-black">{label}</span></div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
