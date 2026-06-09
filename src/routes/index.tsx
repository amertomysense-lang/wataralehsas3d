import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Cuboid, Shirt, Scissors, ArrowLeft, ShieldCheck, MessageCircle, X, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOnlineSync } from "@/lib/offline-sync";
import { useVendorStore, DEFAULT_VENDOR_STATE } from "@/lib/vendor-config";
import { VideoStrip } from "@/components/VideoStrip";

type Vendor = {
  id: string; name: string; category: string; phone: string;
  logo_url: string | null; cover_image?: string | null; is_premium: boolean;
  subscription_status?: string | null;
};

const DECOR_CATS = ["curtains", "sofa", "furniture", "other"];
const FASHION_CATS = ["fashion"];
const HAIRCUT_CATS = ["haircut", "salon", "barber"];

type WingKey = "decor" | "haircut" | "fashion";

const WINGS: Record<WingKey, {
  title: string; subtitle: string; icon: typeof Cuboid;
  cats: string[]; toolPath: string; toolLabel: string;
  accent: string;
}> = {
  decor: {
    title: "جناح التصميم والديكور الذكي",
    subtitle: "محاكي الجدران والأرضيات بدقة 8K",
    icon: Cuboid, cats: DECOR_CATS,
    toolPath: "/simulator", toolLabel: "افتح محاكي الديكور",
    accent: "from-amber-200/40 to-rose-200/40",
  },
  haircut: {
    title: "صالون وتر الإحساس للعناية وقصّات الشعر AI",
    subtitle: "جرّب قصّتك الجديدة افتراضياً قبل أيّ موعد",
    icon: Scissors, cats: HAIRCUT_CATS,
    toolPath: "/haircut", toolLabel: "ابدأ تجربة قصّة الشعر",
    accent: "from-rose-200/40 to-fuchsia-200/40",
  },
  fashion: {
    title: "المجمّع الافتراضي للأزياء والموضة AI",
    subtitle: "غرفة قياس ذكية تعرض الإطلالة على وجهك",
    icon: Shirt, cats: FASHION_CATS,
    toolPath: "/tryon", toolLabel: "ادخل غرفة قياس الأزياء",
    accent: "from-sky-200/40 to-violet-200/40",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وتر الإحساس — مجمّع رقمي فاخر للديكور والأزياء وقصّات AI" },
      { name: "description", content: "ثلاثة أجنحة تفاعلية: ديكور ذكي، صالون قصّات AI، ومجمّع أزياء افتراضي — اكتشف وجرّب قبل أن تشتري." },
      { property: "og:title", content: "وتر الإحساس — مجمّع رقمي فاخر" },
      { property: "og:description", content: "ديكور ذكي · صالون AI · أزياء افتراضية" },
    ],
  }),
  component: Home,
});

function Home() {
  useOnlineSync();
  const [open, setOpen] = useState<WingKey | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
            <span className="font-black tracking-tight">وتر الإحساس</span>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground/80 transition hover:border-primary/40">
            <ShieldCheck className="size-3.5" /> لوحة الإدارة
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pt-12 pb-6 sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold text-primary">
          <Crown className="size-3" /> مجمّع رقمي فاخر · ثلاثة أجنحة تفاعلية
        </span>
        <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          اختر جناحك،
          <br />
          <span className="bg-gradient-to-l from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            وجرّب قبل أن تقرر.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
          المنصّة تعتمد على <b className="text-foreground">الدمج الواقعي بالـ AI</b>:
          صورتك الحقيقية + التصميم = نتيجة فورية بمقاسات وإضاءة طبيعية.
        </p>
      </section>

      <VideoStrip />

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {(Object.keys(WINGS) as WingKey[]).map((k) => {
            const w = WINGS[k];
            const Icon = w.icon;
            return (
              <button key={k} onClick={() => setOpen(k)}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-right transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${w.accent} opacity-0 transition group-hover:opacity-100`} />
                <div className="relative">
                  <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-black leading-tight">{w.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{w.subtitle}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-xs font-black text-primary">
                    افتح النافذة <ArrowLeft className="size-4 transition group-hover:-translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {open && <WingDrawer wingKey={open} onClose={() => setOpen(null)} />}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} وتر الإحساس
      </footer>
    </div>
  );
}

function WingDrawer({ wingKey, onClose }: { wingKey: WingKey; onClose: () => void }) {
  const w = WINGS[wingKey];
  const Icon = w.icon;
  const [vendorStore] = useVendorStore();

  const { data, isLoading } = useQuery({
    queryKey: ["wing-vendors", wingKey],
    queryFn: async (): Promise<Vendor[]> => {
      const { data } = await supabase.from("vendors").select("*").order("is_premium", { ascending: false });
      return (data ?? []) as Vendor[];
    },
  });

  const active = (data ?? []).filter((v) => {
    const status = v.subscription_status ?? "active";
    if (status === "hidden" || status === "suspended") return false;
    const local = vendorStore[v.id] ?? DEFAULT_VENDOR_STATE;
    return local.subscription_active && w.cats.includes(v.category);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl animate-in slide-in-from-bottom" dir="rtl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <div>
              <h2 className="text-sm font-black leading-tight">{w.title}</h2>
              <p className="text-[11px] text-muted-foreground">{w.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <Link to={w.toolPath} className="block rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-5 py-4 text-center text-sm font-black text-primary-foreground shadow-soft">
            {w.toolLabel}
          </Link>

          <div>
            <h3 className="mb-3 text-xs font-black text-muted-foreground">شركاء فاعلون في هذا الجناح</h3>
            {isLoading && <p className="text-center text-xs text-muted-foreground py-6">…تحميل</p>}
            {!isLoading && active.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                لا يوجد شركاء فاعلون بعد في هذا الجناح.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((v) => (
                <div key={v.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  {v.cover_image && <img src={v.cover_image} alt={v.name} className="h-28 w-full object-cover" />}
                  <div className="flex items-center gap-3 p-3">
                    {v.logo_url && <img src={v.logo_url} alt="" className="size-10 rounded-xl object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-sm font-black">{v.name}</p>
                      {v.is_premium && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"><Crown className="size-3" /> Premium</span>}
                    </div>
                    <a href={`https://wa.me/${v.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                      className="rounded-xl bg-primary/10 p-2 text-primary"><MessageCircle className="size-4" /></a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link to="/marketplace" className="block text-center text-xs font-bold text-primary hover:underline">
            عرض السوق الكامل ←
          </Link>
        </div>
      </div>
    </div>
  );
}
