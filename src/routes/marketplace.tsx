import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { ShoppingBag, Crown, MessageCircle, Sofa, Shirt, Sparkles } from "lucide-react";

type Vendor = {
  id: string; business_name: string; category: string;
  whatsapp_number: string; logo_url: string | null; is_premium: boolean;
};

const DECOR_CATS = ["curtains", "sofa", "furniture", "other"];
const FASHION_CATS = ["fashion"];

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "سوق الشركاء — وتر الإحساس" }] }),
  component: Marketplace,
});

function Marketplace() {
  const [tab, setTab] = useState<"decor" | "fashion">("decor");
  const { data, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("is_premium", { ascending: false })
        .order("business_name");
      if (error) return [];
      return (data ?? []) as Vendor[];
    },
  });

  const filtered = useMemo(() => {
    const cats = tab === "decor" ? DECOR_CATS : FASHION_CATS;
    return (data ?? []).filter((v) => cats.includes(v.category));
  }, [data, tab]);

  return (
    <div className="min-h-screen bg-background px-5 py-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <Link to="/workflow" className="text-sm font-bold text-primary hover:underline">← الوحدات</Link>
        <h1 className="mt-3 text-3xl font-black text-foreground">
          سوق <span className="text-primary">شركاء الديكور والأزياء</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تجربة فاخرة لاكتشاف أفضل شركاء المنطقة — تواصل مباشر مع المحل عبر واتساب.
        </p>

        {/* Tabs */}
        <div className="mt-6 inline-flex rounded-2xl border border-border bg-card p-1">
          <TabBtn active={tab === "decor"} onClick={() => setTab("decor")}
            icon={<Sofa className="size-4" />} label="عالم الديكور والأثاث" />
          <TabBtn active={tab === "fashion"} onClick={() => setTab("fashion")}
            icon={<Shirt className="size-4" />} label="عالم الأزياء والموضة" />
        </div>

        {isLoading && <p className="mt-8 text-center text-muted-foreground">…تحميل</p>}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-10 rounded-3xl border-2 border-dashed border-border p-10 text-center">
            <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-bold">لا يوجد شركاء في هذا العالم بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">أضف شركاء من لوحة الأدمن لعرضهم هنا.</p>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VendorCard key={v.id} v={v} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }:
  { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
        active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      }`}>
      {icon} {label}
    </button>
  );
}

function VendorCard({ v }: { v: Vendor }) {
  const catLabel: Record<string, string> = {
    curtains: "ستائر فاخرة", sofa: "كنب وأرائك", furniture: "أثاث منزلي",
    fashion: "أزياء وموضة", other: "متنوع",
  };
  return (
    <div className={`group relative overflow-hidden rounded-3xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-soft ${
      v.is_premium ? "border-primary/60 shadow-[0_0_0_1px_var(--primary)/10]" : "border-border"
    }`}>
      {v.is_premium && (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at top left, var(--primary), transparent 60%)" }} />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-primary-foreground shadow-soft">
            <Crown className="size-3" /> شريك مميّز
          </span>
        </>
      )}
      <div className="relative flex items-center gap-3">
        <div className="grid size-16 place-items-center rounded-2xl bg-muted ring-1 ring-border">
          {v.logo_url ? (
            <img src={v.logo_url} alt={v.business_name} className="size-full rounded-2xl object-cover" />
          ) : (
            <Sparkles className="size-6 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-foreground">{v.business_name}</h3>
          <p className="text-xs text-muted-foreground">{catLabel[v.category] ?? v.category}</p>
        </div>
      </div>
      <a href={`https://wa.me/${v.whatsapp_number}`} target="_blank" rel="noreferrer"
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
        <MessageCircle className="size-4" /> تواصل واتساب
      </a>
    </div>
  );
}
