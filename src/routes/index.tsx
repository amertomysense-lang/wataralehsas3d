import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Design } from "@/integrations/supabase/client";
import { Sparkles, ImagePlus, Search, Grid3x3 } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "معرض وتر الإحساس — تصاميم طباعة جدارية فاخرة" },
      {
        name: "description",
        content:
          "اكتشف مجموعة تصاميم الطباعة الجدارية ثلاثية الأبعاد. جودة 8K، أحبار UV، ضمان 12 شهر.",
      },
      { property: "og:title", content: "معرض وتر الإحساس" },
      { property: "og:description", content: "تصاميم طباعة جدارية فاخرة بجودة 8K" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: designs, isLoading, error } = useQuery({
    queryKey: ["designs"],
    queryFn: async (): Promise<Design[]> => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Design[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    designs?.forEach((d) => d.category && set.add(d.category));
    return Array.from(set);
  }, [designs]);

  const filtered = useMemo(() => {
    return (designs ?? []).filter((d) => {
      const matchCat = !category || d.category === category;
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description ?? "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [designs, search, category]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header
        className="relative overflow-hidden text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 80%, white 0, transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Sparkles className="size-4" /> منصة وتر الإحساس
          </div>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black leading-tight">
            معرض التصاميم
            <br />
            <span className="text-accent">الجدارية الفاخرة</span>
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg opacity-90">
            تصفح مكتبتنا من تصاميم الطباعة ثلاثية الأبعاد بجودة 8K. اسأل الذكاء الاصطناعي عن أي
            منتج، أو حوّل صورتك إلى تصميم تسويقي جاهز.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/marketing-tool"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-soft transition hover:scale-[1.02]"
            >
              <ImagePlus className="size-4" />
              أداة التسويق الذكية
            </Link>
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20"
            >
              <Grid3x3 className="size-4" />
              تصفح المعرض
            </a>
          </div>
        </div>
      </header>

      {/* Search + filters */}
      <section id="gallery" className="mx-auto max-w-6xl px-5 -mt-8 relative z-10">
        <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن تصميم..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  !category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                الكل
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products grid */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-destructive/10 p-6 text-center text-destructive">
            تعذّر تحميل التصاميم. تأكد من اتصال قاعدة البيانات.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <p className="text-lg font-bold text-foreground">لا توجد تصاميم بعد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              أضف تصاميم من لوحة التحكم لعرضها هنا.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((d, idx) => (
            <Link
              key={d.id}
              to="/product/$id"
              params={{ id: d.id }}
              className="group animate-fade-up overflow-hidden rounded-2xl bg-card shadow-card border border-border transition hover:-translate-y-1 hover:shadow-soft"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={d.image_url}
                  alt={d.name}
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {d.category && (
                  <span className="absolute top-2 right-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold backdrop-blur">
                    {d.category}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-bold text-foreground">{d.name}</h3>
                {d.price != null && (
                  <p className="mt-1 text-sm font-black text-primary">
                    {Number(d.price).toLocaleString("ar")} ل.س
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} وتر الإحساس — جميع الحقوق محفوظة
        <span className="mx-2">·</span>
        <Link to="/admin" className="hover:text-primary">لوحة التحكم</Link>
      </footer>
    </div>
  );
}
