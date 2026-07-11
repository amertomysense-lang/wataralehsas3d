// جرس إشعارات فوري للأدمن — يتلقّى طلبات جديدة عبر Realtime
// يُصدر نغمة قصيرة + إشعار متصفح.
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function beep() {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.42);
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignore */ }
}

export function NewOrdersBell() {
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const ch = supabase
      .channel("watar-admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          if (!mounted.current) return;
          setCount((n) => n + 1);
          beep();
          const row = payload.new as { design_name?: string; region_name?: string; total?: number };
          toast.success(`طلب جديد: ${row.design_name ?? "—"} · ${row.region_name ?? ""}`, { duration: 6000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("طلب جديد — وتر الإحساس", {
              body: `${row.design_name ?? ""} · ${row.region_name ?? ""} — ${Number(row.total ?? 0).toLocaleString("ar")}`,
              icon: "/icon-192.png",
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setEnabled(true);
      });
    return () => { mounted.current = false; supabase.removeChannel(ch); };
  }, []);

  async function askPermission() {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    toast(Notification.permission === "granted" ? "تم تفعيل إشعارات المتصفح" : "الإشعارات معطّلة", { duration: 3000 });
  }

  return (
    <button
      onClick={askPermission}
      title={enabled ? "متّصل — إشعارات فورية للطلبات الجديدة" : "غير متصل"}
      className={`relative inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-black transition ${
        enabled ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
      }`}
    >
      <Bell className={`size-4 ${enabled ? "animate-pulse" : ""}`} />
      {count > 0 && (
        <span
          onClick={(e) => { e.stopPropagation(); setCount(0); }}
          className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-black text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
