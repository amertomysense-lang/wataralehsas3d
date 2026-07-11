import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listPublicProjects } from "@/lib/projects";
import { ArrowRight, Sparkles, Share2 } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "معرض أعمال العملاء — وتر الإحساس" },
      { name: "description", content: "استعرض أجمل تصاميم ديكور الجدران والأرضيات المنفّذة عبر منصة وتر الإحساس." },
      { property: "og:title", content: "معرض أعمال — وتر الإحساس" },
      { property: "og:description", content: "أفكار حقيقية من عملاء استخدموا محاكي الجدران." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: listPublicProjects,
  });

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            <ArrowRight className="size-4" /> الرئيسية
          </Link>
          <h1 className="text-sm font-black">معرض أعمال العملاء</h1>
          <Link to="/simulator" className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-black text-primary-foreground shadow">
            جرّب على جدارك
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-8">
        <div className="rounded-3xl p-6 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-hero)" }}>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black backdrop-blur">
            <Sparkles className="size-3" /> إلهام حقيقي
          </div>
          <h2 className="mt-2 text-2xl font-black">أعمال منفّذة على جدران عملائنا</h2>
          <p className="mt-1 text-sm opacity-90">اختر أي تصميم لتنفيذه على جدارك بلمسة واحدة.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 py-6 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
        ))}
        {(data ?? []).map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative aspect-[4/5] bg-muted">
              {p.snapshot_url || p.room_url ? (
                <img src={p.snapshot_url ?? p.room_url ?? ""} alt={p.name} className="h-full w-full object-cover" />
              ) : null}
              {p.design_url && (
                <img src={p.design_url} alt="" className="absolute bottom-2 end-2 size-12 rounded-lg border-2 border-white object-cover shadow" />
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-xs font-black">{p.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {p.width_m && p.height_m ? `${p.width_m}م × ${p.height_m}م` : "مشروع ديكور"}
              </p>
              <Link
                to="/simulator"
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary/10 px-2 py-1.5 text-[11px] font-black text-primary hover:bg-primary/20"
              >
                <Share2 className="size-3" /> استلهم على جدارك
              </Link>
            </div>
          </div>
        ))}
        {!isLoading && (!data || data.length === 0) && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-16">
            لم يُنشر أي عمل بعد — كن أول من يشارك تصميمك من المحاكي.
          </p>
        )}
      </div>
    </div>
  );
}
