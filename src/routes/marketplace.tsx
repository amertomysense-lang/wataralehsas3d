import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Crown, MessageCircle } from "lucide-react";

type Vendor = {
  id: string; business_name: string; category: string;
  whatsapp_number: string; logo_url: string | null; is_premium: boolean;
};

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "سوق الشركاء — وتر الإحساس" }] }),
  component: Marketplace,
});

function Marketplace() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase.from("vendors").select("*").order("is_premium", { ascending: false });
      if (error) return [];
      return (data ?? []) as Vendor[];
    },
  });

  return (
    <div className="min-h-screen bg-background px-5 py-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <Link to="/workflow" className="text-sm font-bold text-primary hover:underline">← الوحدات</Link>
        <h1 className="mt-3 text-3xl font-black text-foreground">سوق <span className="text-primary">شركاء الديكور</span></h1>
        <p className="mt-2 text-muted-foreground">شركاؤنا المعتمدون: ستائر، أرائك، أثاث — تواصل مباشر عبر واتساب.</p>

        {isLoading && <p className="mt-8 text-center text-muted-foreground">…تحميل</p>}
        {!isLoading && (!data || data.length === 0) && (
          <div className="mt-10 rounded-3xl border-2 border-dashed border-border p-10 text-center">
            <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-bold">لا يوجد شركاء بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">أضف شركاء من لوحة الأدمن لعرضهم هنا.</p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((v) => (
            <div key={v.id} className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
              {v.is_premium && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] font-black text-primary">
                  <Crown className="size-3" /> Premium
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="grid size-14 place-items-center rounded-2xl bg-muted">
                  {v.logo_url ? <img src={v.logo_url} alt={v.business_name} className="size-full rounded-2xl object-cover" /> :
                    <ShoppingBag className="size-6 text-primary" />}
                </div>
                <div>
                  <h3 className="font-black text-foreground">{v.business_name}</h3>
                  <p className="text-xs text-muted-foreground">{v.category}</p>
                </div>
              </div>
              <a href={`https://wa.me/${v.whatsapp_number}`} target="_blank" rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
                <MessageCircle className="size-4" /> تواصل واتساب
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
