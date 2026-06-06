import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Design } from "@/integrations/supabase/client";
import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { ProductChat } from "@/components/ProductChat";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { design: data as Design };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.design.name ?? "منتج"} — وتر الإحساس` },
      {
        name: "description",
        content: loaderData?.design.description ?? "تصميم طباعة جدارية فاخرة من وتر الإحساس",
      },
      { property: "og:title", content: loaderData?.design.name ?? "منتج" },
      { property: "og:image", content: loaderData?.design.image_url ?? "" },
    ],
  }),
  component: ProductPage,
  errorComponent: () => (
    <div className="p-10 text-center">
      <p>تعذّر تحميل المنتج.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">العودة للمعرض</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p>المنتج غير موجود.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">العودة للمعرض</Link>
    </div>
  ),
});

function ProductPage() {
  const { design } = Route.useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            <ArrowRight className="size-4" />
            المعرض
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="line-clamp-1 text-sm font-bold text-foreground">{design.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pt-6">
        <div className="overflow-hidden rounded-3xl bg-card shadow-card border border-border">
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img src={design.image_url} alt={design.name} className="size-full object-cover" />
          </div>
          <div className="p-6">
            {design.category && (
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent-foreground">
                {design.category}
              </span>
            )}
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-foreground">{design.name}</h1>
            {design.price != null && (
              <p className="mt-2 text-2xl font-black text-primary">
                {Number(design.price).toLocaleString("ar")} ل.س
              </p>
            )}
            {design.description && (
              <p className="mt-4 leading-relaxed text-muted-foreground">{design.description}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition hover:bg-muted"
              >
                <MessageCircle className="size-4" />
                اسأل عن هذا المنتج
              </button>
              <button
                onClick={() => toast.success("سيتم التواصل معك قريباً لإكمال الطلب")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90"
              >
                <ShoppingBag className="size-4" />
                اطلب الخدمة
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductChat open={chatOpen} onClose={() => setChatOpen(false)} design={design} />
    </div>
  );
}
